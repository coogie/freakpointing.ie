#!/usr/bin/env python3
"""Extract and pretty-print all JSON-LD blocks from a Jekyll-built HTML page.

Usage:
    python3 bin/jsonld-extract.py [path/to/file.html]

Defaults to _site/index.html.
"""
import json
import re
import sys
from pathlib import Path

DEFAULT_PATH = Path("_site/index.html")


def extract(html: str) -> list[dict]:
    blocks = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>',
        html,
        re.DOTALL,
    )
    return [json.loads(b) for b in blocks]


def main() -> int:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    if not path.exists():
        print(f"ERROR: {path} not found. Run bundle exec jekyll build first.")
        return 1
    blocks = extract(path.read_text())
    print(f"Found {len(blocks)} JSON-LD block(s) in {path}\n")
    for i, b in enumerate(blocks):
        kind = b.get("@type", "?")
        ident = b.get("@id", "(no @id)")
        print(f"--- Block {i + 1}: @type={kind} @id={ident} ---")
        print(json.dumps(b, indent=2))
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
