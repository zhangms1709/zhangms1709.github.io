"""Lightweight structural sanity check for the site's HTML.

Catches the kinds of issues we want to keep out of the codebase: exactly one
<head>/<body>/<title>/<html>, no nav placed outside body, every <img> has
alt text, no orphan inline <style> blocks (everything should be in styles/),
and an h1 is present so heading hierarchy starts at 1.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP: set[Path] = set()


def count_tag(text: str, tag: str) -> int:
    return len(re.findall(rf"<{tag}\b[^>]*>", text, re.IGNORECASE))


def check(path: Path) -> list[str]:
    problems: list[str] = []
    text = path.read_text(encoding="utf-8", errors="replace")

    for tag in ("html", "head", "body", "title"):
        n = count_tag(text, tag)
        if n != 1:
            problems.append(f"expected exactly one <{tag}>, found {n}")

    if count_tag(text, "h1") < 1:
        problems.append("missing <h1> — every page should start its heading hierarchy at h1")

    body_match = re.search(r"<body\b[^>]*>", text, re.IGNORECASE)
    if body_match:
        before_body = text[: body_match.start()].lower()
        for offender in ("<nav", '<div class="topnav"', "<div class='topnav'"):
            if offender in before_body:
                problems.append(f"`{offender}` appears before <body>")

    for m in re.finditer(r"<img\b([^>]*)>", text, re.IGNORECASE):
        attrs = m.group(1)
        if "alt=" not in attrs.lower():
            snippet = m.group(0)[:80]
            problems.append(f"<img> without alt attribute: {snippet}")

    if re.search(r"<style\b[^>]*>", text, re.IGNORECASE):
        problems.append("inline <style> block found — move rules into styles/")

    for m in re.finditer(r"""<a\b[^>]*\btarget=["']_blank["'][^>]*>""", text, re.IGNORECASE):
        anchor = m.group(0)
        if "noopener" not in anchor.lower():
            snippet = anchor[:100]
            problems.append(f"<a target=\"_blank\"> without rel=\"noopener\": {snippet}")

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
    print(f"OK - {len(files)} files pass structural checks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
