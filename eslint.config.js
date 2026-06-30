/*
 * ESLint flat config — applies to client-side scripts in script.js and scripts/.
 * The daodejing pages use globals injected by inline <script> tags, so we
 * declare those explicitly to avoid no-undef noise.
 */

import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: ["node_modules/**", "styles/output.css", "**/*.min.js"],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                Typed: "readonly",
                DDJ_DICT: "readonly",
                DDJ_CHAPTERS: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-console": "off",
            eqeqeq: ["error", "always"],
            "prefer-const": "warn",
        },
    },
];
