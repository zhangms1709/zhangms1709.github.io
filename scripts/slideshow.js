/*
 * script.js — home-page slideshow.
 *
 * Cycles through every .mySlides element inside .slideshow-container,
 * toggling an `.active` class (styles live in styles/style.css). Pauses
 * automatically when the tab is hidden so the timer doesn't burn battery in
 * a background tab, and resumes on visibility change.
 */

(function () {
    "use strict";

    const SLIDE_INTERVAL_MS = 2000;
    let slides = [];
    let slideIndex = 0;
    let timerId = null;

    function showSlide(index) {
        for (let i = 0; i < slides.length; i += 1) {
            slides[i].classList.toggle("active", i === index);
        }
    }

    function advance() {
        if (slides.length === 0) return;
        slideIndex = (slideIndex + 1) % slides.length;
        showSlide(slideIndex);
    }

    function start() {
        if (timerId !== null || slides.length === 0) return;
        timerId = window.setInterval(advance, SLIDE_INTERVAL_MS);
    }

    function stop() {
        if (timerId === null) return;
        window.clearInterval(timerId);
        timerId = null;
    }

    function init() {
        slides = Array.from(document.getElementsByClassName("mySlides"));
        if (slides.length === 0) return;
        showSlide(0);
        start();
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) stop();
            else start();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
