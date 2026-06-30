# zhangms1709.github.io

Personal website of Mason Zhang. Static HTML/CSS/JS hosted on GitHub Pages at
[zhangms1709.github.io](https://zhangms1709.github.io).

## Layout

```
.
├── index.html                      # Home page
├── 404.html                        # GitHub Pages 404 fallback
├── scripts/
│   ├── site-head.js                # <site-head> — head meta/og/canonical
│   ├── site-nav.js                 # <site-nav> — shared top nav
│   ├── slideshow.js                # Home-page slideshow
│   └── card-grid.js                # Renders [data-cards] grids on blog/portfolio
├── styles/
│   ├── style.css                   # Source of truth (Tailwind input)
│   ├── output.css                  # Built file — every page links to this
│   ├── media-queries.css           # Width-based mobile tweaks
│   └── slider.css                  # Styles for slider/ sandbox (see known quirks)
├── pages/
│   ├── blog/                       # Blog index (card grid)
│   ├── portfolio/                  # Projects + essays
│   ├── quotes/                     # Favorite quotes
│   ├── daodejing/
│   │   ├── index.html              # Interactive Dao De Jing reader
│   │   ├── reader.js               # Reader logic (extracted from inline)
│   │   ├── chapters.js             # 81 chapters of zh + en + title
│   │   └── dict.js                 # Per-character pinyin + definition map
│   └── {control,world,frege,forster,robot,deepfake}/   # Individual blog posts
├── files/                          # PDFs, video clips linked from the site
├── images/                         # All photos / illustrations
├── tools/
│   ├── check_html.py               # Structural HTML sanity check
│   └── check_paths.py              # Case-sensitive local-link checker
├── tailwind.config.js
├── package.json
└── .github/workflows/check.yml     # CI: links, HTML, linters, path case
```

## Local development

You only need Node.js 20+.

```bash
npm install            # one-time
npm run watch:css      # rebuild styles/output.css on change
npm run serve          # http://localhost:8080
```

`styles/output.css` is the file every HTML page actually links to. It is
generated from `styles/style.css` by Tailwind. If you edit `style.css` and
forget to rebuild, CI will fail with a diff — run `npm run build:css` and
commit the result.

## Checks

```bash
npm run lint           # html-validate + stylelint + eslint
npm run format:check   # prettier
python tools/check_paths.py    # case-sensitive local-link audit
python tools/check_html.py     # one <head>, one <body>, every <img> has alt
```

CI runs all of these on every push and pull request — see
`.github/workflows/check.yml`.

## Shared components

### `<site-head>` (in `<head>`)

`scripts/site-head.js` injects the boilerplate head tags every page needs
(stylesheet link, favicon, canonical, OG/Twitter meta, description). Each
page sets a static `<title>` (so search crawlers see it before JS runs) and
includes:

```html
<head>
    <title>Page Title | Mason Zhang</title>
    <script src="/scripts/site-head.js"></script>
    <site-head title="Page Title" slug="pages/slug/" type="article"></site-head>
</head>
```

The script loads without `defer` so it runs synchronously during head parsing
and inserts its tags before the parser continues into `<body>`. No FOUC,
canonical/OG tags land in document order.

Attributes:

- `title` — Page title. Used for `og:title`. Defaults to `"Mason Zhang"`.
- `slug` — Path under the site root, e.g. `"pages/blog/"`. Used to build
  `canonical` + `og:url`. Empty string for the home page.
- `description` — Optional. Falls back to a generic site description.
- `type` — Optional `og:type`. Defaults to `"website"`; use `"article"` on
  blog posts.

### `<site-nav>` (top of `<body>`)

```html
<site-nav active="blog"></site-nav>
```

`active` is one of `home | portfolio | quotes | blog` and decides which link
gets `aria-current="page"`.

### `<div class="card-grid">` (blog + portfolio)

`scripts/card-grid.js` renders any element matching `[data-cards]` from a
window-scoped array of card objects. Each card is `{ href, img, title, tags }`.
Cards always render at a uniform height (fixed `aspect-ratio: 16 / 10` on the
image area, fixed `min-height` on the title area) so different image
proportions or title lengths don't desync the grid.

```html
<div class="card-grid" data-cards="POSTS"></div>
<script>
  const POSTS = [
    { href: "/pages/control/", img: "/images/tracks.jpeg",
      title: "The Control Condition", tags: ["Ethics", "Consciousness"] },
    /* ... */
  ];
</script>
<script src="/scripts/card-grid.js" defer></script>
```

`title` may contain HTML (e.g. `<i>Sophist</i>`) — it's inserted as-is. Tags
are HTML-escaped.

### `.blog-post` body class

Every blog post page sets `<body class="blog-post">` and wraps its prose in
`<main id="write" class="portfolio"><div class="content">…</div></main>`.
That triggers the centered, indented prose styling defined in `style.css`.

### Spacers

Use `<div class="spacer" aria-hidden="true"></div>` (or `spacer-lg`) for
vertical breathing room. Don't use `<p>&nbsp;</p>` — it shows up in screen
readers and bloats the DOM.

## Conventions

- **Fonts.** Body text uses Calibri (with Segoe UI / Tahoma / Verdana
  fallbacks). Headings + nav use Courier New for a typewriter feel.
- **Images.** Add `loading="lazy"` and an `alt` attribute. Use
  `class="hero-img"` if you want the default 40vh hero sizing; without it
  images render at their natural size.
- **No inline `style="…"`.** All styling lives in `styles/style.css` (or a
  page-scoped `<style>` block when the page has truly unique layout, e.g.
  `pages/daodejing/`).
- **GitHub Pages is case-sensitive.** `images/Foo.png` and `images/foo.png`
  are different files in production even though Windows lets you reach the
  same file with either. `tools/check_paths.py` catches mismatches.

## Known quirks

- `slider/index.html` is an old, broken sandbox page — kept out of all
  checks and not linked from anywhere. Delete if you don't want it.
- The favicon is hosted on `cdn.glitch.com`. Moving it into the repo would
  be safer long-term.
