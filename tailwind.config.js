/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./*.html",
        "./pages/**/*.html",
        "./slider/**/*.html",
        "./script.js",
        "./pages/**/*.js",
        "./slider/**/*.js",
    ],
    theme: {
        extend: {
            colors: {
                accent: "#34ade6",
                "accent-soft": "#4e92df",
            },
        },
    },
    plugins: [],
};
