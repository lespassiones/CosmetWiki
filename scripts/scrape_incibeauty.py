"""Scrape incibeauty.com/ingredients across all letters and group by color."""
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}

LETTERS = ["1"] + [chr(c) for c in range(ord("A"), ord("Z") + 1)]
BASE = "https://incibeauty.com/ingredients/"

COLOR_MAP = {
    "vert": "Vert",
    "jaune": "Jaune",
    "orange": "Orange",
    "orange_4": "Orange",
    "rouge": "Rouge",
}

OUT_DIR = Path(__file__).parent
RAW_JSON = OUT_DIR / "ingredients_raw.json"


def fetch(letter: str, retries: int = 4) -> str:
    url = BASE + letter
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=60, verify=False)
            r.raise_for_status()
            r.encoding = "utf-8"
            return r.text
        except Exception as e:
            last_exc = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_exc}")


def parse(letter: str, html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.select_one("table.table-inci")
    if table is None:
        return []
    items: list[dict] = []
    for tr in table.find_all("tr"):
        tds = tr.find_all("td", recursive=False)
        if len(tds) < 2:
            continue
        img = tds[0].find("img")
        if not img or not img.get("src"):
            continue
        m = re.search(r"inci_([a-z0-9_]+)\.png", img["src"])
        if not m:
            continue
        color_key = m.group(1)
        color = COLOR_MAP.get(color_key)
        if color is None:
            continue
        a = tds[1].find("a")
        name = (a.get_text(strip=True) if a else tds[1].get_text(strip=True)).strip()
        if not name:
            continue
        translation = tds[2].get_text(" ", strip=True) if len(tds) > 2 else ""
        items.append(
            {
                "letter": letter,
                "name": name,
                "color": color,
                "color_key": color_key,
                "translation": translation,
                "url": a["href"] if a and a.get("href") else "",
            }
        )
    return items


def scrape_letter(letter: str) -> list[dict]:
    html = fetch(letter)
    rows = parse(letter, html)
    print(f"[{letter}] {len(rows)} ingredients")
    return rows


def main() -> None:
    all_rows: list[dict] = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(scrape_letter, ltr): ltr for ltr in LETTERS}
        for fut in as_completed(futures):
            ltr = futures[fut]
            try:
                all_rows.extend(fut.result())
            except Exception as e:
                print(f"[{ltr}] ERROR: {e}")

    # Deduplicate by (name, color)
    seen: dict[tuple[str, str], dict] = {}
    for row in all_rows:
        key = (row["name"].upper(), row["color"])
        # keep first occurrence
        seen.setdefault(key, row)
    deduped = list(seen.values())
    deduped.sort(key=lambda r: (r["name"].upper()))
    print(f"Total unique ingredients: {len(deduped)}")

    by_color: dict[str, int] = {}
    for r in deduped:
        by_color[r["color"]] = by_color.get(r["color"], 0) + 1
    print("By color:", by_color)

    RAW_JSON.write_text(json.dumps(deduped, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {RAW_JSON}")


if __name__ == "__main__":
    main()
