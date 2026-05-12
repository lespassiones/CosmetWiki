"""Scrape detailed ingredient pages from incibeauty.com and self-host product images.

For each ingredient with details_scraped = FALSE :
  1. fetch the URL
  2. parse details (CAS, fonctions, prévalence, traductions, produits)
  3. download every product image, convert to WebP (~12-20 KB each), upload to
     Supabase Storage bucket `cosmetwiki-products/<inci_product_id>.webp`
  4. push everything to Supabase via the upsert RPCs

Self-hosted images make the site fully independent from incibeauty.com.

Features:
  - polite (random 0.5-1.5s delay)
  - parallel workers (4 by default)
  - checkpoint via the `details_scraped` flag in DB
  - --limit, --debug-url, --no-images, --workers, --batch flags

Usage:
    cd Cosme Check
    python scripts/scrape_ingredient_details.py --limit 50           # test on 50
    python scripts/scrape_ingredient_details.py                      # all pending
    python scripts/scrape_ingredient_details.py --debug-url <url>    # debug a single page
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import random
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

import requests
import urllib3
from bs4 import BeautifulSoup
from PIL import Image, ImageOps

urllib3.disable_warnings()

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

IMAGE_HEADERS = {
    "User-Agent": HEADERS["User-Agent"],
    "Referer": "https://incibeauty.com/",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}

BUCKET = "cosmetwiki-products"
WEBP_MAX_WIDTH = 360
WEBP_QUALITY = 72


def load_env(path: Path) -> dict[str, str]:
    env = {}
    if not path.exists():
        sys.exit(f".env not found at {path}")
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


# ============================================================
# HTTP fetch with retry + politeness
# ============================================================
def fetch(url: str, retries: int = 3, polite: bool = True) -> str | None:
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            if polite:
                time.sleep(random.uniform(0.15, 0.45))
            r = requests.get(url, headers=HEADERS, timeout=30, verify=False)
            if r.status_code == 404:
                return None
            if r.status_code == 429:  # rate limited
                time.sleep(2.0 + attempt * 2)
                continue
            r.raise_for_status()
            r.encoding = "utf-8"
            return r.text
        except Exception as e:
            last_exc = e
            time.sleep(1.0 * (attempt + 1))
    print(f"  ! failed {url}: {last_exc}", file=sys.stderr)
    return None


def fetch_image(url: str, retries: int = 2) -> bytes | None:
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=IMAGE_HEADERS, timeout=20, verify=False, stream=True)
            r.raise_for_status()
            return r.content
        except Exception as e:
            last_exc = e
            time.sleep(0.5 * (attempt + 1))
    return None


# ============================================================
# Image processing : convert to WebP at max width, return bytes
# ============================================================
def convert_to_webp(raw: bytes) -> bytes | None:
    try:
        img = Image.open(io.BytesIO(raw))
        img = ImageOps.exif_transpose(img)
        if img.mode in ("P", "RGBA", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            mask = img.convert("RGBA").split()[-1] if img.mode in ("RGBA", "LA", "P") else None
            background.paste(img.convert("RGBA") if img.mode != "RGB" else img, mask=mask)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        if img.width > WEBP_MAX_WIDTH:
            ratio = WEBP_MAX_WIDTH / img.width
            new_size = (WEBP_MAX_WIDTH, max(1, int(img.height * ratio)))
            img = img.resize(new_size, Image.LANCZOS)

        out = io.BytesIO()
        img.save(out, format="WEBP", quality=WEBP_QUALITY, method=6)
        return out.getvalue()
    except Exception as e:
        print(f"  ! image convert failed: {e}", file=sys.stderr)
        return None


# ============================================================
# HTML parsing
# ============================================================
PRODUCT_PATH_RE = re.compile(r"/produit/(\d+)")
SCORE_RE = re.compile(r"([\d,\.]+)\s*/\s*20")
CAS_RE = re.compile(r"\b\d{2,7}-\d{2}-\d\b")
EINECS_RE = re.compile(r"\b\d{3}-\d{3}-\d\b")


def decode_data_l(s: str | None) -> str | None:
    """Decode incibeauty's base64-encoded product link in `data-l` attributes."""
    if not s:
        return None
    try:
        padded = s + "=" * (-len(s) % 4)
        return base64.b64decode(padded).decode("utf-8", errors="replace")
    except Exception:
        return None


@dataclass
class ParsedDetails:
    cas_number: str | None = None
    einecs_number: str | None = None
    classification: list[str] = field(default_factory=list)
    description: str | None = None
    origin: str | None = None
    functions: list[dict[str, str]] = field(default_factory=list)
    prevalence_pct: float | None = None
    category_breakdown: dict[str, float] = field(default_factory=dict)
    regulated_zones: list[str] = field(default_factory=list)
    translations: dict[str, str] = field(default_factory=dict)
    products: list[dict[str, Any]] = field(default_factory=list)


def text_clean(s: str | None) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def _strip_label(li_text: str, label: str) -> str:
    """Strip a leading 'Label :' from an <li> text content."""
    return re.sub(rf"^\s*{re.escape(label)}\s*:\s*", "", li_text, flags=re.I).strip()


def parse_ingredient_html(html: str, source_url: str) -> ParsedDetails:
    soup = BeautifulSoup(html, "html.parser")
    out = ParsedDetails()

    # ---- Metadata <li> with <strong>Label :</strong> value ----
    # Origine(s), Autres langues, Nom INCI, N° EINECS/ELINCS, Classification
    for li in soup.select("ul.list-unstyled > li"):
        strong = li.find("strong")
        if not strong:
            continue
        label = text_clean(strong.get_text(" ", strip=True)).rstrip(":").strip()
        full = text_clean(li.get_text(" ", strip=True))
        value = _strip_label(full, label)

        if not value:
            continue

        if "Origine" in label:
            out.origin = value[:200]
        elif "Autres langues" in label or "Other languages" in label:
            # Comma-separated translations — store all under generic keys
            parts = [text_clean(p) for p in value.split(",") if text_clean(p)]
            for i, p in enumerate(parts[:30]):
                # No language identifier — use index. We keep them as a list under "alt"
                out.translations[f"alt_{i}"] = p
        elif "EINECS" in label or "ELINCS" in label:
            m = EINECS_RE.search(value)
            if m:
                out.einecs_number = m.group(0)
        elif "CAS" in label:
            m = CAS_RE.search(value)
            if m:
                out.cas_number = m.group(0)
        elif "Classification" in label:
            items = [text_clean(s.get_text(" ", strip=True)) for s in li.find_all("span")]
            items = [i for i in items if i and i not in ("(i)", "(ii)")]
            if not items:
                items = [text_clean(p) for p in value.split(",") if text_clean(p)]
            out.classification = items[:8]

    # CAS sometimes appears in the page header instead of the li list
    if not out.cas_number:
        h1 = soup.find("h1")
        if h1 and h1.parent:
            block_text = h1.parent.get_text(" ", strip=True)
            m = CAS_RE.search(block_text)
            if m:
                out.cas_number = m.group(0)

    # ---- Long "À savoir" description ----
    section_zoom = soup.find(class_="section-zoom")
    if section_zoom:
        # Drop the .zoom label, keep the rest
        for zoom in section_zoom.find_all(class_="zoom"):
            zoom.decompose()
        txt = text_clean(section_zoom.get_text(" ", strip=True))
        if len(txt) > 30:
            out.description = txt[:2000]

    # Fallback : short penalty label
    if not out.description:
        for kw in ("Pas de pénalité", "Pénalité légère", "Pénalité moyenne", "Pénalité forte"):
            node = soup.find(string=re.compile(re.escape(kw), re.I))
            if node:
                out.description = text_clean(str(node))
                break

    # ---- Functions INCI ----
    fn_ul = soup.find("ul", class_="fonctions-inci")
    if fn_ul:
        for li in fn_ul.find_all("li"):
            i_tag = li.find("i")
            if i_tag:
                name = text_clean(i_tag.get_text(" ", strip=True)).rstrip(":").strip()
                # Description is the text after the <i>
                desc = ""
                for sib in i_tag.next_siblings:
                    desc += sib.get_text(" ", strip=True) if hasattr(sib, "get_text") else str(sib)
                desc = text_clean(desc)
                if name:
                    out.functions.append({"name": name, "description": desc})
            else:
                txt = text_clean(li.get_text(" ", strip=True))
                if ":" in txt:
                    n, d = txt.split(":", 1)
                    out.functions.append({"name": text_clean(n), "description": text_clean(d)})
                elif txt:
                    out.functions.append({"name": txt, "description": ""})

    # ---- Prevalence ----
    full_text = soup.get_text(" ", strip=True)
    m_prev = re.search(
        r"présent\s+dans\s+([\d,\.]+)\s*%\s+des\s+cosmétiques",
        full_text,
        re.I,
    )
    if m_prev:
        try:
            out.prevalence_pct = float(m_prev.group(1).replace(",", "."))
        except ValueError:
            pass

    # ---- Category breakdown : .progress-bar with text "Cat (XX,YY%)" ----
    for bar in soup.select(".progress-bar"):
        txt = text_clean(bar.get_text(" ", strip=True))
        m = re.match(r"^(.*?)\s*\(([\d,\.]+)\s*%\)\s*$", txt)
        if m:
            cat = text_clean(m.group(1))
            try:
                pct = float(m.group(2).replace(",", "."))
                out.category_breakdown[cat] = pct / 100.0
            except ValueError:
                pass

    # ---- Regulated zones : country flag images near "réglement" / "interdit" ----
    for kw in ("Europe", "Royaume-Uni", "France", "Canada", "États-Unis", "Japon"):
        pattern = rf"\b{re.escape(kw)}\b.{{0,80}}(réglement|interdit|restrein|annexe)"
        if re.search(pattern, full_text, re.I) and kw not in out.regulated_zones:
            out.regulated_zones.append(kw)

    # Locate the "Produits qui en contiennent" section
    products_h2 = None
    for h in soup.find_all(["h2", "h3"]):
        if "Produits qui en contiennent" in h.get_text(strip=True):
            products_h2 = h
            break

    seen_pids: set[str] = set()

    if products_h2 is not None:
        # All product cards are .product-apercu inside the next sibling container
        scope = products_h2.find_next_sibling()
        cards = []
        while scope is not None:
            cards.extend(scope.find_all(class_="product-apercu"))
            if cards:
                break
            scope = scope.find_next_sibling()

        # Fallback : search the whole document
        if not cards:
            cards = soup.find_all(class_="product-apercu")

        for card in cards:
            img = card.find("img")
            if not img:
                continue

            # Decode the base64 product link (gives /produit/<EAN>)
            decoded = decode_data_l(img.get("data-l"))
            ean = None
            if decoded:
                m = PRODUCT_PATH_RE.search(decoded)
                if m:
                    ean = m.group(1)
            if not ean:
                # Try direct hrefs in the card
                for a in card.find_all("a", href=True):
                    m = PRODUCT_PATH_RE.search(a["href"])
                    if m:
                        ean = m.group(1)
                        break
            if not ean or ean in seen_pids:
                continue
            seen_pids.add(ean)

            image_url = img.get("src")
            if image_url and image_url.startswith("/"):
                image_url = "https://incibeauty.com" + image_url

            # Brand : the small heading ("name-brand", "brand", or first <span>)
            brand = None
            for sel in ("name-brand", "product-brand", "brand"):
                node = card.find(class_=sel)
                if node:
                    brand = text_clean(node.get_text(" ", strip=True))
                    break
            if not brand:
                spans = card.find_all("span")
                if spans:
                    brand = text_clean(spans[0].get_text(" ", strip=True))

            # Product name : the longer descriptive line
            name = None
            for sel in ("name-product", "product-name", "product-title"):
                node = card.find(class_=sel)
                if node:
                    name = text_clean(node.get_text(" ", strip=True))
                    break
            if not name:
                # Fallback : extract from card text minus brand & score
                full = text_clean(card.get_text(" ", strip=True))
                full = re.sub(r"[\d,\.]+\s*/\s*20", "", full).strip()
                # incibeauty repeats the brand 1-2 times before the product name
                if brand:
                    while full.lower().startswith(brand.lower()):
                        full = full[len(brand):].strip()
                name = full or None
            else:
                # Same dedup if name was extracted from a structured selector
                if brand:
                    while name.lower().startswith(brand.lower()):
                        name = name[len(brand):].strip()

            score = None
            ms_score = SCORE_RE.search(card.get_text(" ", strip=True))
            if ms_score:
                try:
                    score = float(ms_score.group(1).replace(",", "."))
                except ValueError:
                    pass

            volume = None
            ms_vol = re.search(
                r"\b(\d+(?:[.,]\d+)?)\s*(ml|mL|g|kg)\b",
                card.get_text(" ", strip=True),
            )
            if ms_vol:
                volume = f"{ms_vol.group(1)} {ms_vol.group(2)}"

            if not name:
                continue
            if not brand:
                brand = name.split(" ")[0]

            source_url = decoded or f"https://incibeauty.com/produit/{ean}"

            out.products.append(
                {
                    "inci_product_id": ean,
                    "brand": brand,
                    "name": name,
                    "volume": volume,
                    "score": score,
                    "image_url": image_url,
                    "source_url": source_url,
                }
            )

    return out


# ============================================================
# Supabase client
# ============================================================
class SBClient:
    def __init__(self, env: dict[str, str]):
        self.url = env["NEXT_PUBLIC_SUPABASE_URL"]
        self.key = env["SUPABASE_SERVICE_ROLE_KEY"]
        self.session = requests.Session()
        self.session.headers.update(
            {
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
            }
        )

    def fetch_pending(self, limit: int) -> list[dict]:
        url = f"{self.url}/rest/v1/rpc/cosme_check_pending_ingredients"
        r = self.session.post(url, json={"p_limit": limit}, timeout=60)
        if r.status_code == 404:
            print("RPC cosme_check_pending_ingredients missing - apply the migration first.")
            sys.exit(1)
        r.raise_for_status()
        return r.json() or []

    def fetch_by_slugs(self, slugs: list[str]) -> list[dict]:
        url = f"{self.url}/rest/v1/rpc/cosme_check_pending_by_slugs"
        r = self.session.post(url, json={"p_slugs": slugs}, timeout=60)
        r.raise_for_status()
        return r.json() or []

    def upsert_ingredients(self, rows: list[dict]) -> None:
        if not rows:
            return
        url = f"{self.url}/rest/v1/rpc/cosme_check_upsert_ingredients"
        r = self.session.post(url, json={"rows": rows}, timeout=120)
        if r.status_code >= 300:
            raise RuntimeError(f"upsert_ingredients failed: {r.status_code} {r.text[:300]}")

    def upsert_products(self, rows: list[dict]) -> None:
        if not rows:
            return
        url = f"{self.url}/rest/v1/rpc/cosme_check_upsert_products"
        r = self.session.post(url, json={"rows": rows}, timeout=120)
        if r.status_code >= 300:
            raise RuntimeError(f"upsert_products failed: {r.status_code} {r.text[:300]}")

    def upload_image(self, path: str, data: bytes, content_type: str = "image/webp") -> bool:
        """Upload to Supabase Storage. Skip if it already exists (409)."""
        url = f"{self.url}/storage/v1/object/{BUCKET}/{path}"
        h = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": content_type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "x-upsert": "false",
        }
        try:
            r = requests.post(url, headers=h, data=data, timeout=30)
            if r.status_code in (200, 201, 409):
                return True
            # 400 with "Duplicate" body is also "already exists"
            if r.status_code == 400 and "Duplicate" in r.text:
                return True
            print(f"  ! upload {path}: {r.status_code} {r.text[:120]}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"  ! upload {path}: {e}", file=sys.stderr)
            return False

    def public_url(self, path: str) -> str:
        return f"{self.url}/storage/v1/object/public/{BUCKET}/{path}"

    def storage_exists(self, path: str) -> bool:
        """Quick HEAD check on a Storage object — used to skip re-upload."""
        url = f"{self.url}/storage/v1/object/info/public/{BUCKET}/{path}"
        try:
            r = requests.get(url, timeout=10, headers={"apikey": self.key})
            return r.status_code == 200
        except Exception:
            return False


# ============================================================
# Main loop
# ============================================================
def process_image(sb: SBClient, src_url: str, pid: str, no_images: bool) -> str | None:
    """Download the source image, convert to WebP, upload to Storage. Return public URL or None."""
    if no_images or not src_url:
        return src_url
    path = f"{pid}.webp"
    public = sb.public_url(path)
    # Fast path: image already in Storage from a previous run
    if sb.storage_exists(path):
        return public
    raw = fetch_image(src_url)
    if not raw:
        return src_url
    webp = convert_to_webp(raw)
    if not webp:
        return src_url
    if sb.upload_image(path, webp):
        return public
    return src_url


def scrape_one(sb: SBClient, item: dict, no_images: bool) -> tuple[dict, list[dict]] | None:
    html = fetch(item["source_url"])
    if html is None:
        return None
    parsed = parse_ingredient_html(html, item["source_url"])

    ingredient_row = {
        "inci_id": item["inci_id"],
        "slug": item["slug"],
        "name": item["name"],
        "color_rating": item["color_rating"],
        "source_url": item["source_url"],
        "details_scraped": True,
        "cas_number": parsed.cas_number,
        "einecs_number": parsed.einecs_number,
        "classification": None,
        "description": parsed.description,
        "functions": parsed.functions or None,
        "prevalence_pct": parsed.prevalence_pct,
        "category_breakdown": parsed.category_breakdown or None,
        "regulated_zones": parsed.regulated_zones or None,
        "translations": parsed.translations or {},
    }

    products_payload = []
    for p in parsed.products[:12]:  # cap at 12 per ingredient
        if p.get("image_url"):
            new_url = process_image(sb, p["image_url"], p["inci_product_id"], no_images)
            p["image_url"] = new_url

        products_payload.append(
            {
                **p,
                "composition": [{"inci_id": item["inci_id"], "position": None}],
            }
        )

    return ingredient_row, products_payload


POPULAR_SLUGS = [
    "niacinamide", "glycerin", "phenoxyethanol", "aqua", "parfum",
    "citric-acid", "tocopherol", "sodium-chloride", "butylene-glycol",
    "alcohol-denat-", "retinol", "salicylic-acid", "panthenol",
    "ascorbic-acid", "hyaluronic-acid", "sodium-hyaluronate",
    "caffeine", "allantoin", "bisabolol", "squalane", "lactic-acid",
    "alpha-arbutin", "ceramide-np", "centella-asiatica-extract",
    "aloe-barbadensis-leaf-juice", "argania-spinosa-kernel-oil",
    "rosa-canina-fruit-oil", "tocopheryl-acetate", "linalool",
    "limonene", "geraniol", "citronellol", "benzyl-alcohol",
    "phenoxyethanol-1", "ethylhexylglycerin", "sodium-benzoate",
    "potassium-sorbate", "carbomer", "xanthan-gum", "glycol-distearate",
    "petrolatum", "paraffinum-liquidum", "mineral-oil",
    "dimethicone", "cyclopentasiloxane", "isopropyl-myristate",
    "cetearyl-alcohol", "stearic-acid", "lauric-acid",
    "titanium-dioxide", "zinc-oxide", "iron-oxides",
    "ci-77891", "ci-77492", "ci-77491",
    "sodium-laureth-sulfate", "sodium-lauryl-sulfate", "cocamidopropyl-betaine",
    "polysorbate-20", "peg-40-hydrogenated-castor-oil",
    "ethanol", "denatonium-benzoate", "butylphenyl-methylpropional",
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10000)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--debug-url", help="Debug a single URL and print parsed JSON")
    ap.add_argument("--batch", type=int, default=20, help="Batch size for DB upsert")
    ap.add_argument("--no-images", action="store_true", help="Skip image download/upload (faster)")
    ap.add_argument("--slugs", help="Comma-separated list of slugs to scrape in priority")
    ap.add_argument("--popular", action="store_true", help="Scrape the curated POPULAR_SLUGS list first")
    args = ap.parse_args()

    if args.debug_url:
        html = fetch(args.debug_url, polite=False)
        if not html:
            sys.exit(1)
        parsed = parse_ingredient_html(html, args.debug_url)
        print(json.dumps(asdict(parsed), ensure_ascii=False, indent=2, default=str))
        return

    env = load_env(ENV_PATH)
    sb = SBClient(env)

    if args.slugs or args.popular:
        slugs = []
        if args.popular:
            slugs.extend(POPULAR_SLUGS)
        if args.slugs:
            slugs.extend([s.strip() for s in args.slugs.split(",") if s.strip()])
        seen: set[str] = set()
        slugs = [s for s in slugs if not (s in seen or seen.add(s))]
        print(f"Fetching ingredients by slugs (n={len(slugs)})...")
        pending = sb.fetch_by_slugs(slugs)
        print(f"  -> {len(pending)} found in DB")
        if not pending:
            print("Nothing to do.")
            return
        scrape_batch(sb, pending, args)
        return

    if args.no_images:
        print("(images: hotlink, no download/upload)")
    else:
        print(f"(images: download + WebP@{WEBP_QUALITY}@{WEBP_MAX_WIDTH}px -> bucket {BUCKET}/)")

    # Loop until no more pending or until --limit is reached.
    total_done = 0
    target = args.limit
    while total_done < target:
        chunk_size = min(1000, target - total_done)  # PostgREST default cap is 1000
        print(f"\nFetching next chunk (up to {chunk_size})...")
        pending = sb.fetch_pending(chunk_size)
        if not pending:
            print("All ingredients enriched. Nothing left.")
            break
        print(f"  -> {len(pending)} pending")
        n = scrape_batch(sb, pending, args)
        total_done += n
        if n == 0:
            print("No progress this round — exiting to avoid loop.")
            break

    print(f"\nGrand total: {total_done} ingredients processed.")


def scrape_batch(sb: SBClient, pending: list[dict], args) -> int:
    ing_buffer: list[dict] = []
    prod_buffer: list[dict] = []
    done = 0
    t0 = time.time()

    def flush():
        nonlocal ing_buffer, prod_buffer
        sb.upsert_ingredients(ing_buffer); ing_buffer = []
        sb.upsert_products(prod_buffer); prod_buffer = []

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(scrape_one, sb, item, args.no_images): item for item in pending}
        for fut in as_completed(futures):
            try:
                res = fut.result()
            except Exception as e:
                print(f"  ! task failed: {e}", file=sys.stderr)
                done += 1
                continue
            done += 1
            if res is None:
                continue
            ing_row, prods = res
            ing_buffer.append(ing_row)
            prod_buffer.extend(prods)

            if len(ing_buffer) >= args.batch:
                flush()

            if done % 25 == 0 or done == len(pending):
                rate = done / max(time.time() - t0, 0.001)
                print(f"  {done}/{len(pending)} ({rate:.1f}/s)")

    flush()
    elapsed = time.time() - t0
    print(f"  batch done in {elapsed:.0f}s - {done} processed.")
    return done


if __name__ == "__main__":
    main()
