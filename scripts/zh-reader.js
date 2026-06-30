/*
 * zh-reader.js — shared hover-to-translate Chinese reader.
 *
 * Each page sets two globals before this script loads:
 *   - window.ZH_DICT      character → English gloss map (shared scripts/zh-dict.js)
 *   - window.ZH_CHAPTERS  array of sections, each:
 *         { n, title, zh, en, chapter? }
 *     where `chapter` (optional) is a Chinese book/inner-chapter heading. If
 *     present and different from the previous entry's `chapter`, the reader
 *     renders a centered book-heading and groups the TOC under it.
 *
 * Renders into three elements that must exist on the page:
 *   - #ddj-body     section list
 *   - #ddj-toc      table of contents
 *   - #ddj-tooltip  fixed-position character tooltip
 *
 * Tooltip is wired up via mouse and touch events delegated on #ddj-body.
 */

(function () {
    "use strict";

    // Fall back to the legacy DDJ_* names (used by older cached chapter files)
    // so a stale browser cache can't leave the page on "Could not load chapter
    // data." Either set of globals will work.
    const dict = window.ZH_DICT || window.DDJ_DICT || {};
    const chapters = window.ZH_CHAPTERS || window.DDJ_CHAPTERS || [];
    const tooltip = document.getElementById("ddj-tooltip");
    const body = document.getElementById("ddj-body");
    const toc = document.getElementById("ddj-toc");

    const isHan = (ch) => {
        const c = ch.charCodeAt(0);
        return c >= 0x4e00 && c <= 0x9fff;
    };

    /*
     * pinyin-pro has shipped its function under several global names across
     * versions. Pick the first one that's actually a function.
     */
    const pinyinFn = (() => {
        const cs = [
            window.pinyinPro && window.pinyinPro.pinyin,
            window["pinyin-pro"] && window["pinyin-pro"].pinyin,
            typeof window.pinyin === "function" ? window.pinyin : null,
            window.pinyin && window.pinyin.pinyin,
        ];
        for (const c of cs) if (typeof c === "function") return c;
        return null;
    })();

    /*
     * Return a single pinyin string for one Han character. Forces a string
     * result (some versions of pinyin-pro return an array even when
     * `type: 'string'` is set), single-reading (no polyphone fan-out), and
     * symbol tone marks (ǒ rather than o3).
     */
    function pinyinFor(ch) {
        if (!pinyinFn) return "";
        try {
            const raw = pinyinFn(ch, {
                toneType: "symbol",
                type: "string",
                pattern: "pinyin",
                multiple: false,
                nonZh: "consecutive",
            });
            if (raw == null) return "";
            // Some pinyin-pro builds ignore `type` and return an array.
            if (Array.isArray(raw)) return String(raw[0] || "");
            // Belt-and-braces: if a string with multiple readings sneaks in
            // (separated by space, slash, or comma), keep just the first one.
            return String(raw).split(/[\s/,]+/, 1)[0] || "";
        } catch (_e) {
            return "";
        }
    }

    const escapeHtml = (s) =>
        s.replace(/[&<>"]/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
        })[c]);

    const renderZh = (zh) => {
        let out = "";
        for (const ch of zh) {
            if (isHan(ch)) {
                out += `<span class="hz" data-c="${ch}">${ch}</span>`;
            } else if (ch === "\n") {
                out += "<br>";
            } else {
                out += `<span class="ddj-punct">${ch}</span>`;
            }
        }
        return out;
    };

    const renderEn = (en) =>
        en
            .split("\n\n")
            .map((p) =>
                p.includes("\n")
                    ? `<div class="poem">${escapeHtml(p)}</div>`
                    : `<p>${escapeHtml(p)}</p>`
            )
            .join("");

    function positionTooltip(e) {
        const pad = 12;
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        let x = e.clientX + pad;
        let y = e.clientY - th - pad;
        if (x + tw > window.innerWidth - 8) x = window.innerWidth - tw - 8;
        if (y < 8) y = e.clientY + pad + 14;
        tooltip.style.left = x + "px";
        tooltip.style.top = y + "px";
    }

    function showTooltipFor(el, e) {
        const ch = el.dataset.c;
        if (!ch) return;
        const py = pinyinFor(ch);
        // dict entries may be a plain gloss string, or an object
        //   { def: "...", shuowen: "說文 explanation" }
        // The reader renders both forms with the Shuowen note in its own block.
        const entry = dict[ch];
        let defHtml;
        if (!entry) {
            defHtml = `<div class="tt-def tt-missing">(no definition on file)</div>`;
        } else if (typeof entry === "string") {
            defHtml = `<div class="tt-def">${escapeHtml(entry)}</div>`;
        } else {
            const main = entry.def ? `<div class="tt-def">${escapeHtml(entry.def)}</div>` : "";
            const sw = entry.shuowen
                ? `<div class="tt-shuowen"><span class="tt-shuowen-label">說文</span>${escapeHtml(entry.shuowen)}</div>`
                : "";
            defHtml = main + sw;
        }
        tooltip.innerHTML =
            `<span class="tt-char">${ch}</span>` +
            `<span class="tt-pinyin">${escapeHtml(py) || "—"}</span>` +
            defHtml;
        tooltip.classList.add("show");
        tooltip.setAttribute("aria-hidden", "false");
        positionTooltip(e);
    }

    function hideTooltip() {
        tooltip.classList.remove("show");
        tooltip.setAttribute("aria-hidden", "true");
    }

    function renderAll() {
        // Build TOC. If any entry has a `chapter` field, group by chapter.
        const grouped = chapters.some((c) => c.chapter);
        if (grouped) {
            const groups = [];
            for (const c of chapters) {
                const last = groups[groups.length - 1];
                if (!last || last.chapter !== c.chapter) {
                    groups.push({ chapter: c.chapter, entries: [c] });
                } else {
                    last.entries.push(c);
                }
            }
            toc.innerHTML = groups
                .map(
                    (g) => `
                <div class="ddj-toc-group">
                    <span class="ddj-toc-group-title">${escapeHtml(g.chapter)}</span>
                    ${g.entries
                        .map(
                            (c) =>
                                `<a href="#ch${c.n}" title="${escapeHtml(c.title)}">${c.n}</a>`
                        )
                        .join("")}
                </div>`
                )
                .join("");
        } else {
            toc.innerHTML = chapters
                .map(
                    (c) =>
                        `<a href="#ch${c.n}" title="${escapeHtml(c.title)}">${c.n}</a>`
                )
                .join("");
        }

        // Build body. Insert a book-head divider whenever `chapter` changes.
        let prevChapter = null;
        body.innerHTML = chapters
            .map((c) => {
                let header = "";
                if (c.chapter && c.chapter !== prevChapter) {
                    header = `
                        <h3 class="ddj-book-head">
                            <span class="book-zh">${escapeHtml(c.chapter)}</span>
                            <span class="book-en">${escapeHtml(c.title)}</span>
                        </h3>`;
                    prevChapter = c.chapter;
                }
                const sectionTitle = c.chapter
                    ? `§${c.n}`
                    : escapeHtml(c.title);
                return `
                ${header}
                <section class="ddj-chapter" id="ch${c.n}">
                    <div class="ddj-section-head">
                        <span class="num">${c.n}.</span>
                        <span class="title">${sectionTitle}</span>
                    </div>
                    <div class="ddj-zh">${renderZh(c.zh)}</div>
                    <div class="ddj-en">${renderEn(c.en)}</div>
                </section>`;
            })
            .join("");

        body.addEventListener("mouseover", (e) => {
            const el = e.target.closest(".hz");
            if (el) showTooltipFor(el, e);
        });
        body.addEventListener("mousemove", (e) => {
            if (tooltip.classList.contains("show")) positionTooltip(e);
        });
        body.addEventListener("mouseout", (e) => {
            if (e.target.closest(".hz")) hideTooltip();
        });
        body.addEventListener("click", (e) => {
            const el = e.target.closest(".hz");
            if (el) {
                const rect = el.getBoundingClientRect();
                showTooltipFor(el, { clientX: rect.left + 10, clientY: rect.top });
                e.stopPropagation();
            }
        });
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".hz")) hideTooltip();
        });
    }

    function start() {
        if (!chapters.length) {
            body.innerHTML = '<div class="ddj-status">Could not load chapter data.</div>';
            return;
        }
        renderAll();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
