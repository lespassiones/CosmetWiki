"""Load the 15 722 ingredients from data/ingredients_raw.json into Supabase.

Calls the SECURITY DEFINER RPC `public.cosme_check_upsert_ingredients(rows JSONB)`
which writes into the isolated `cosme_check.ingredients` table.

Usage:
    cd Cosme Check
    python scripts/load_ingredients_to_supabase.py
"""
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"
RAW_JSON = ROOT / "data" / "ingredients_raw.json"

BATCH_SIZE = 500  # ~80 KB JSON per batch


def load_env(path: Path) -> dict:
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


URL_RE = re.compile(r"/ingredients/(\d+)-(.+?)/?$")


def parse_url(url: str) -> tuple[int | None, str | None]:
    if not url:
        return None, None
    m = URL_RE.search(url)
    if not m:
        return None, None
    return int(m.group(1)), m.group(2)


def main() -> None:
    env = load_env(ENV_PATH)
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        sys.exit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

    if not RAW_JSON.exists():
        sys.exit(f"Missing {RAW_JSON}")

    raw = json.loads(RAW_JSON.read_text(encoding="utf-8"))
    print(f"Loaded {len(raw)} ingredients from {RAW_JSON.name}")

    rows = []
    skipped = 0
    seen_ids: set[int] = set()
    seen_slugs: set[str] = set()

    for r in raw:
        inci_id, slug = parse_url(r.get("url", ""))
        if inci_id is None or not slug:
            skipped += 1
            continue
        if inci_id in seen_ids:
            continue
        seen_ids.add(inci_id)
        if slug in seen_slugs:
            slug = f"{slug}-{inci_id}"
        seen_slugs.add(slug)

        translations: dict[str, str] = {}
        if r.get("translation"):
            translations["fr"] = r["translation"]

        rows.append(
            {
                "inci_id": inci_id,
                "slug": slug,
                "name": r["name"],
                "color_rating": r["color"],
                "source_url": r["url"],
                "translations": translations,
                "details_scraped": False,
            }
        )

    print(f"Prepared {len(rows)} unique rows ({skipped} skipped, no parseable id)")

    endpoint = f"{supabase_url}/rest/v1/rpc/cosme_check_upsert_ingredients"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    total = len(rows)
    inserted = 0
    t0 = time.time()
    for i in range(0, total, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        resp = requests.post(endpoint, headers=headers, json={"rows": batch}, timeout=180)
        if resp.status_code >= 300:
            print(f"\nERROR batch {i}: {resp.status_code} {resp.text[:500]}")
            sys.exit(1)
        inserted += len(batch)
        elapsed = time.time() - t0
        rate = inserted / elapsed if elapsed > 0 else 0
        print(f"  {inserted}/{total} ({rate:.0f}/s)", end="\r", flush=True)

    print(f"\nDone in {time.time() - t0:.1f}s.")


if __name__ == "__main__":
    main()
