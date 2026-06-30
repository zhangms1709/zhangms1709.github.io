/*
 * site-head.js — <site-head> custom element.
 *
 * Renders the duplicated SEO/social tags every page needs: canonical URL,
 * Open Graph + Twitter meta, favicon, description. Each page sets:
 *
 *     <site-head title="Blog" slug="pages/blog/"
 *                description="…optional override…"></site-head>
 *
 * The following MUST stay static in <head> (this element does not generate
 * them) because they have to be parsed before any JS runs:
 *   - <meta charset="utf-8">          (must be in first 1024 bytes)
 *   - <meta name="viewport" …>        (used by mobile during initial render)
 *   - <title>                          (search crawlers may not run JS)
 *   - <link rel="stylesheet" …>       (avoid FOUC)
 *
 * Attributes:
 *   - title       Page title (used for og:title only — <title> stays static)
 *   - slug        Path under site root, e.g. "pages/blog/" or "" for home
 *   - description Optional. Falls back to a generic site description.
 *   - type        Optional og:type. Defaults to "website"; use "article".
 */

const SITE_ORIGIN = "https://zhangms1709.github.io";
const FAVICON_URL =
    "https://cdn.glitch.com/0bbec082-7d40-4980-a895-a6a1b6e627ab%2FScreen%20Shot%202563-12-30%20at%201.32.15%20PM.ico?v=1609353311347";
const DEFAULT_DESCRIPTION = "Personal website of Mason Zhang.";

class SiteHead extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute("title") || "Mason Zhang";
        const description = this.getAttribute("description") || DEFAULT_DESCRIPTION;
        const slug = (this.getAttribute("slug") || "").replace(/^\/+/, "");
        const ogType = this.getAttribute("type") || "website";
        const url = `${SITE_ORIGIN}/${slug}`;

        const tags = [
            tag("meta", { name: "description", content: description }),
            tag("link", { rel: "canonical", href: url }),
            tag("meta", { property: "og:title", content: title }),
            tag("meta", { property: "og:description", content: description }),
            tag("meta", { property: "og:url", content: url }),
            tag("meta", { property: "og:type", content: ogType }),
            tag("meta", { name: "twitter:card", content: "summary_large_image" }),
            tag("link", { rel: "shortcut icon", href: FAVICON_URL }),
        ];

        const fragment = document.createDocumentFragment();
        for (const el of tags) fragment.appendChild(el);
        // Append to <head> rather than insertBefore + remove(): cleaner for the
        // parser's open-elements stack, and the spec head ordering is loose
        // for these tags (canonical/og/meta have no rendering side effects).
        document.head.appendChild(fragment);
    }
}

function tag(name, attrs) {
    const el = document.createElement(name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

customElements.define("site-head", SiteHead);
