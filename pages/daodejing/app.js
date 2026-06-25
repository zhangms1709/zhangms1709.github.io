(() => {
    const dict = window.DDJ_DICT || {};
    const chapters = window.DDJ_CHAPTERS || [];
    const tooltip = document.getElementById('ddj-tooltip');
    const body = document.getElementById('ddj-body');
    const toc = document.getElementById('ddj-toc');

    const isHan = (ch) => {
        const c = ch.charCodeAt(0);
        return c >= 0x4E00 && c <= 0x9FFF;
    };

    // pinyin-pro has shipped under several global names across versions.
    const pinyinFn = (() => {
        const candidates = [
            window.pinyinPro && window.pinyinPro.pinyin,
            window['pinyin-pro'] && window['pinyin-pro'].pinyin,
            (window.pinyin && typeof window.pinyin === 'function') ? window.pinyin : null,
            window.pinyin && window.pinyin.pinyin,
        ];
        for (const c of candidates) if (typeof c === 'function') return c;
        return null;
    })();

    const pinyinFor = (ch) => {
        if (!pinyinFn) return '';
        try {
            return pinyinFn(ch, { toneType: 'symbol', type: 'string' });
        } catch (e) {
            return '';
        }
    };

    const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    }[c]));

    const renderZh = (zh) => {
        let out = '';
        for (const ch of zh) {
            if (isHan(ch)) {
                out += `<span class="hz" data-c="${ch}">${ch}</span>`;
            } else if (ch === '\n') {
                out += '<br>';
            } else {
                out += `<span class="ddj-punct">${ch}</span>`;
            }
        }
        return out;
    };

    const renderEn = (en) => {
        const paras = en.split('\n\n');
        return paras.map((p) => {
            if (p.includes('\n')) {
                return `<div class="poem">${escapeHtml(p)}</div>`;
            }
            return `<p>${escapeHtml(p)}</p>`;
        }).join('');
    };

    const positionTooltip = (e) => {
        const pad = 12;
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        let x = e.clientX + pad;
        let y = e.clientY - th - pad;
        if (x + tw > window.innerWidth - 8) x = window.innerWidth - tw - 8;
        if (y < 8) y = e.clientY + pad + 14;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    };

    const showTooltipFor = (el, e) => {
        const ch = el.dataset.c;
        if (!ch) return;
        const py = pinyinFor(ch);
        const def = dict[ch];
        const defHtml = def
            ? `<div class="tt-def">${escapeHtml(def)}</div>`
            : `<div class="tt-def tt-missing">(no definition on file)</div>`;
        tooltip.innerHTML =
            `<span class="tt-char">${ch}</span>` +
            `<span class="tt-pinyin">${py || '—'}</span>` +
            defHtml;
        tooltip.classList.add('show');
        tooltip.setAttribute('aria-hidden', 'false');
        positionTooltip(e);
    };

    const hideTooltip = () => {
        tooltip.classList.remove('show');
        tooltip.setAttribute('aria-hidden', 'true');
    };

    const renderAll = () => {
        toc.innerHTML = chapters.map((c) =>
            `<a href="#ch${c.n}" title="${escapeHtml(c.title)}">${c.n}</a>`
        ).join('');

        body.innerHTML = chapters.map((c) => `
            <section class="ddj-chapter" id="ch${c.n}">
                <div class="ddj-chapter-head">
                    <span class="num">${c.n}.</span>
                    <span class="title">${escapeHtml(c.title)}</span>
                </div>
                <div class="ddj-zh">${renderZh(c.zh)}</div>
                <div class="ddj-en">${renderEn(c.en)}</div>
            </section>
        `).join('');

        body.addEventListener('mouseover', (e) => {
            const el = e.target.closest('.hz');
            if (el) showTooltipFor(el, e);
        });
        body.addEventListener('mousemove', (e) => {
            if (tooltip.classList.contains('show')) positionTooltip(e);
        });
        body.addEventListener('mouseout', (e) => {
            if (e.target.closest('.hz')) hideTooltip();
        });
        body.addEventListener('click', (e) => {
            const el = e.target.closest('.hz');
            if (el) {
                const rect = el.getBoundingClientRect();
                showTooltipFor(el, { clientX: rect.left + 10, clientY: rect.top });
                e.stopPropagation();
            }
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hz')) hideTooltip();
        });
    };

    const start = () => {
        if (!chapters.length) {
            body.innerHTML = '<div class="ddj-status">Could not load chapter data.</div>';
            return;
        }
        renderAll();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
