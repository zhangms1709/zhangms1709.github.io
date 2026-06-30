/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./*.html",
        "./pages/**/*.html",
        "./scripts/**/*.js",
        "./pages/**/*.js",
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
