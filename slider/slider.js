// Manual slideshow: prev/next buttons and dot indicators.
(() => {
    const slides = () => document.querySelectorAll('.mySlides');
    const dots = () => document.querySelectorAll('.dot');
    let current = 1;

    const show = (n) => {
        const s = slides();
        const d = dots();
        if (s.length === 0) return;
        if (n > s.length) current = 1;
        else if (n < 1) current = s.length;
        else current = n;
        s.forEach((el) => { el.style.display = 'none'; });
        d.forEach((el) => { el.classList.remove('active'); });
        s[current - 1].style.display = 'block';
        if (d[current - 1]) d[current - 1].classList.add('active');
    };

    window.plusSlides = (delta) => show(current + delta);
    window.currentSlide = (n) => show(n);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => show(1));
    } else {
        show(1);
    }
})();
