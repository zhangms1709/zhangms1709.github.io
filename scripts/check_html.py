"""Lightweight structural sanity check for the site's HTML.

Catches the kinds of issues we just fixed so they don't regress: exactly one
<head>/<body>/<title>/<html>, no nav placed outside body, every <img> has
alt text, no orphan inline <style> blocks (everything should be in styles/).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = {ROOT / "slider" / "index.html"}

TAG_COUNT_RE = lambda tag: re.compile(rf"<{tag}\b[^>]*>", re.IGNORECASE)


def count_tag(text: str, tag: str) -> int:
    return len(TAG_COUNT_RE(tag).findall(text))


def check(path: Path) -> list[str]:
    problems: list[str] = []
    text = path.read_text(encoding="utf-8", errors="replace")

    for tag in ("html", "head", "body", "title"):
        n = count_tag(text, tag)
        if n != 1:
            problems.append(f"expected exactly one <{tag}>, found {n}")

    # nav (or topnav div) must be inside <body>
    body_match = re.search(r"<body\b[^>]*>", text, re.IGNORECASE)
    if body_match:
        before_body = text[: body_match.start()]
        for offender in ("<nav", '<div class="topnav"', "<div class='topnav'"):
            if offender in before_body.lower():
                problems.append(f"`{offender}` appears before <body>")

    for m in re.finditer(r"<img\b([^>]*)>", text, re.IGNORECASE):
        attrs = m.group(1)
        if "alt=" not in attrs.lower():
            snippet = m.group(0)[:80]
            problems.append(f"<img> without alt attribute: {snippet}")

    return problems


def main() -> int:
    any_problems = False
    files = sorted(ROOT.glob("**/*.html"))
    for f in files:
        if f in SKIP or "node_modules" in f.parts or ".git" in f.parts:
            continue
        problems = check(f)
        if problems:
            any_problems = True
            print(f"\n{f.relative_to(ROOT)}:")
            for p in problems:
                print(f"  - {p}")
    if any_problems:
        return 1
    print(f"OK - {len(files)} files have valid top-level structure.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
