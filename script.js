// Home-page slideshow. Cycles every INTERVAL_MS, pauses while the tab is hidden.
(() => {
    const INTERVAL_MS = 3000;

    const start = () => {
        const slides = document.querySelectorAll('.mySlides');
        if (slides.length === 0) return;

        let index = 0;
        let timer = 0;

        const show = (i) => {
            slides.forEach((slide, idx) => {
                slide.classList.toggle('is-active', idx === i);
            });
        };
        const tick = () => {
            index = (index + 1) % slides.length;
            show(index);
        };
        const play = () => {
            if (timer) return;
            timer = window.setInterval(tick, INTERVAL_MS);
        };
        const pause = () => {
            if (!timer) return;
            window.clearInterval(timer);
            timer = 0;
        };

        show(0);
        play();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pause(); else play();
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
