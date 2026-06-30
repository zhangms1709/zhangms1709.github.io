"""Static path checker for the site.

Mirrors what GitHub Pages does on Linux: case-sensitive lookup of every local
href/src referenced by any HTML or CSS file. Exits 1 on any miss so it can run
in CI.
"""
import os
import re
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_GLOB = "**/*.html"
CSS_GLOB = "**/*.css"

# href/src in HTML, and url(...) in CSS.
HREF_RE = re.compile(r"""(?:href|src)\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
URL_RE = re.compile(r"""url\(\s*['"]?([^)'"]+)['"]?\s*\)""", re.IGNORECASE)
CSS_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)

# These are pages we know are broken and the user told us to leave alone.
SKIP_FILES = {ROOT / "slider" / "index.html"}


def is_local(target: str) -> bool:
    if not target:
        return False
    if target.startswith(("#", "mailto:", "tel:", "javascript:")):
        return False
    parsed = urllib.parse.urlparse(target)
    if parsed.scheme in {"http", "https", "data"}:
        return False
    return True


def resolve(source: Path, target: str) -> Path:
    target = urllib.parse.unquote(target.split("#")[0].split("?")[0])
    if not target:
        return source
    if target.startswith("/"):
        return (ROOT / target.lstrip("/")).resolve()
    return (source.parent / target).resolve()


def case_exact_exists(path: Path) -> bool:
    """Exists on disk with the exact case spelling. Windows-safe."""
    if not path.exists():
        return False
    try:
        path.relative_to(ROOT)
    except ValueError:
        return path.exists()
    # Walk up: each component must appear with exact case in its parent dir.
    parts = path.relative_to(ROOT).parts
    current = ROOT
    for part in parts:
        try:
            siblings = os.listdir(current)
        except OSError:
            return False
        if part not in siblings:
            return False
        current = current / part
    return True


def candidates_for(target_path: Path) -> list[Path]:
    """A URL like /pages/blog/ should resolve to /pages/blog/index.html on Pages."""
    if target_path.is_dir() or str(target_path).endswith(os.sep):
        return [target_path / "index.html"]
    return [target_path]


def extract_targets(text: str, in_css: bool) -> list[str]:
    targets = []
    for m in HREF_RE.finditer(text):
        targets.append(m.group(1))
    if in_css:
        for m in URL_RE.finditer(text):
            targets.append(m.group(1))
    # url(...) inside HTML <style> blocks too:
    for m in URL_RE.finditer(text):
        targets.append(m.group(1))
    return targets


def main() -> int:
    misses: list[tuple[Path, str, str]] = []
    files = list(ROOT.glob(HTML_GLOB)) + list(ROOT.glob(CSS_GLOB))
    for source in files:
        if source in SKIP_FILES:
            continue
        if "node_modules" in source.parts or ".git" in source.parts:
            continue
        text = source.read_text(encoding="utf-8", errors="replace")
        text = CSS_COMMENT_RE.sub("", text)
        text = HTML_COMMENT_RE.sub("", text)
        for target in extract_targets(text, source.suffix == ".css"):
            if not is_local(target):
                continue
            resolved = resolve(source, target)
            ok = False
            reason = "not found"
            for cand in candidates_for(resolved):
                if case_exact_exists(cand):
                    ok = True
                    break
                if cand.exists():  # exists but different case
                    reason = f"case mismatch ({cand} exists with different case on disk)"
            if not ok:
                misses.append((source.relative_to(ROOT), target, reason))

    if misses:
        print(f"FAIL — {len(misses)} broken local reference(s):\n")
        for src, target, reason in misses:
            print(f"  {src} -> {target}  ({reason})")
        return 1
    print(f"OK — checked {len(files)} files, all local references resolve case-exactly.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
