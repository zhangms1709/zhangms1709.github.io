// Typing animation for the page title. Falls back to plain text if Typed.js fails to load.
(() => {
    const start = () => {
        const el = document.getElementById('element');
        if (!el) return;
        if (typeof window.Typed !== 'function') return;
        new window.Typed('#element', {
            strings: ['On the creation of digital worlds (6/21)'],
            typeSpeed: 50,
        });
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
