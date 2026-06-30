/*
 * site-nav.js — <site-nav> custom element.
 *
 * Renders the shared top navigation bar into any page that includes:
 *     <site-nav active="home"></site-nav>
 * The `active` attribute (one of "home", "portfolio", "quotes", "blog") marks
 * the matching link with aria-current="page" so the CSS in styles/style.css
 * can highlight it.
 *
 * The nav is rendered on connectedCallback; if you ever care about avoiding
 * the layout shift this causes, server-render the same markup inline and
 * remove the custom element.
 */

const NAV_LINKS = [
    { key: "home", href: "/", label: "Home" },
    { key: "portfolio", href: "/pages/portfolio/", label: "Portfolio" },
    { key: "quotes", href: "/pages/quotes/", label: "Quotes" },
    { key: "blog", href: "/pages/blog/", label: "Blog" },
];

class SiteNav extends HTMLElement {
    connectedCallback() {
        const active = this.getAttribute("active");
        const links = NAV_LINKS.map(({ key, href, label }) => {
            const current = key === active ? ' aria-current="page"' : "";
            return `<a href="${href}"${current}>${label}</a>`;
        }).join("");
        this.innerHTML = `<nav class="topnav">${links}</nav>`;
    }
}

customElements.define("site-nav", SiteNav);
