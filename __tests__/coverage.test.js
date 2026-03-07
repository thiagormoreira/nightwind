const postcss = require("postcss")
const tailwindcss = require("tailwindcss")
const nightwind = require("../src/index.js")

async function generateCss(html, config = {}) {
    const result = await postcss(
        tailwindcss({
            content: [{ raw: html, extension: "html" }],
            darkMode: config.darkMode || "class",
            plugins: [nightwind],
            ...config,
        })
    ).process("@tailwind base; @tailwind utilities; @tailwind components;", {
        from: undefined,
    })
    return result.css
}

describe("nightwind coverage tests", () => {
    it("should handle var() in processColor", () => {
        expect(nightwind.processColor("var(--test)", true)).toBe("var(--test)")
    })

    it("should handle OKLCH colors and alpha", async () => {
        expect(nightwind.processColor("oklch(0.2 0.1 10)", true)).toBe("oklch(0.8 0.1 10)")
        expect(nightwind.processColor("oklch(0.2 0.1 10 / 0.5)", true)).toBe("oklch(0.8 0.1 10 / 0.5)")
        expect(nightwind.processColor("oklch(20% 0.1 10)", true)).toBe("oklch(80% 0.1 10)")
        expect(nightwind.processColor("rgb(0 0 0 / 50%)", true)).toBe("hsl(0 0% 100% / 0.5)")
        expect(nightwind.processColor(" oklch(0.2 0.1 10) ", false)).toBe("oklch(0.2 0.1 10)")
        expect(nightwind.processColor("oklch(20% 0.1 10)", false)).toBe("oklch(20% 0.1 10)")
    })

    it("should handle HSL colors and alpha", () => {
        expect(nightwind.processColor("hsl(217, 91%, 60%)", true)).toBe("hsl(217 91% 40%)")
        expect(nightwind.processColor("hsla(217deg 91% 60% / 0.5)", true)).toBe("hsl(217deg 91% 40% / 0.5)")
        expect(nightwind.processColor("hsla(0.5turn 50% 50% / 10%)", true)).toBe("hsl(0.5turn 50% 50% / 0.1)")
        expect(nightwind.processColor("hsl(217, 91%, 60%)", false)).toBe("hsl(217, 91%, 60%)")
    })

    it("should handle empty/invalid values in processColor", () => {
        expect(nightwind.processColor(null)).toBe(null)
        expect(nightwind.processColor(123)).toBe(123)
        expect(nightwind.processColor("#ff", true)).toBe("#ff")
        expect(nightwind.processColor("oklch(0.2)", true)).toBe("oklch(0.2)")
        expect(nightwind.processColor("hsl(217)", true)).toBe("hsl(217)")
    })

    it("should handle all hex lengths and normalize alpha", async () => {
        expect(nightwind.processColor("#fff", true)).toBe("hsl(0 0% 0%)")
        expect(nightwind.processColor("#0000", true)).toBe("hsl(0 0% 100% / 0)")
        expect(nightwind.processColor("#00000000", true)).toBe("hsl(0 0% 100% / 0)")
        expect(nightwind.processColor("#ff0000", false)).toBe("rgb(255 0 0)")
    })

    it("should position fixedElementClass correctly with suffixes", async () => {
        const css = await generateCss(`
            <div class="nightwind-prevent divide-red-500 placeholder-red-500"></div>
        `)
        expect(css).toContain(".divide-red-500.nightwind-prevent > :not([hidden]) ~ :not([hidden])")
        expect(css).toContain(".placeholder-red-500.nightwind-prevent::placeholder")
    })

    it("should handle gradients with alpha percent in getGradientValue0", async () => {
        const css = await generateCss(`
            <div class="from-[rgba(0,0,0,0.5)] via-[#ff0000]"></div>
        `)
        expect(css).toContain("--tw-gradient-from: hsl(0 0% 100% / 0.5)")
        expect(css).toContain("var(--tw-gradient-to, hsl(0 100% 50% / 0))")
    })

    it("should handle gradients correctly including JIT and manual overrides", async () => {
        const css = await generateCss(`
            <div class="from-red-500 via-red-500 to-red-500 dark:from-red-500 nightwind-prevent from-[#ff0000]"></div>
        `)
        expect(css).toContain(".dark .from-red-500")
        expect(css).toContain(".dark .dark\\:from-red-500")
        expect(css).toContain(".from-\\[\\#ff0000\\].nightwind-prevent")
    })

    it("should be compatible with dark: variant as manual override", async () => {
        const css = await generateCss(`
            <div class="bg-red-500 dark:bg-blue-500 dark:bg-[#123123]"></div>
        `)
        expect(css).toContain(".dark .bg-red-500")
        expect(css).toContain("rgb(59 130 246")
    })

    it("should be v4 compliant in generated rules", async () => {
        const css = await generateCss('<div class="bg-red-500"></div>')
        expect(css).toContain(".dark .bg-red-500")
        expect(css).toContain("background-color: rgb(239 68 68)")
    })

    it("should cover matchUtilities return null and arbitrary values matching theme", async () => {
        const css = await generateCss('<div class="bg-[transparent] bg-[#ef4444]"></div>')
        expect(css).not.toContain(".dark .bg-\\[transparent\\]")
        expect(css).toContain(".dark .bg-\\[\\#ef4444\\]")
    })

    it("should cover @media strategy and typography", async () => {
        const css = await generateCss('<div class="bg-red-500 prose from-red-500"></div>', {
            darkMode: "media",
            theme: {
                extend: {
                    nightwind: { typography: true },
                    typography: { DEFAULT: { css: { "--tw-prose-body": "hsl(217deg 91% 60%)" } } }
                }
            }
        })
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        expect(css).toContain("--tw-prose-body: hsl(217deg 91% 40%)")
    })

    it("should cover getGradientValue0 legacy normalization", async () => {
        const css = await generateCss('<div class="from-[hsl(217,91%,60%)]"></div>')
        expect(css).toContain("hsl(217 91% 60% / 0)")
    })

    it("should cover typography in class mode for line coverage", async () => {
        const css = await generateCss('<div class="prose"></div>', {
            theme: {
                extend: {
                    nightwind: { typography: true },
                    typography: { DEFAULT: { css: { "--tw-prose-body": "#000" } } }
                }
            }
        })
        expect(css).toContain(".dark .prose")
    })

    it("should cover @media strategy with all utility types", async () => {
        const css = await generateCss(`
            <div class="bg-red-500 from-red-500 via-red-500 to-red-500 group-hover:bg-red-500 bg-[#ffffff] from-[#ff0000] prose"></div>
        `, {
            darkMode: "media",
            theme: {
                extend: {
                    nightwind: { typography: true },
                    typography: { DEFAULT: { css: { "--tw-prose-body": "#000" } } }
                }
            }
        })
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        expect(css).toContain(".group:hover")
        expect(css).toContain("--tw-gradient-from")
        expect(css).toContain("background-color: hsl(0 0% 0%)")
        expect(css).toContain("--tw-prose-body: hsl(0 0% 100%)")
        expect(css).toContain("--tw-gradient-to: hsl(0 0% 100%)")
    })

    it("should cover @media initialization and reuse branches", async () => {
        // Test purely group-hover in @media to hit initialization branch (right side of ||)
        const cssA = await generateCss('<div class="group-hover:bg-red-500 from-red-500"></div>', {
            darkMode: "media"
        })
        expect(cssA).toContain("@media")

        // Test reuse in @media (left side of ||)
        const cssB = await generateCss('<div class="bg-red-500 bg-blue-500 from-red-500 from-blue-500 group-hover:bg-red-500 group-hover:bg-blue-500"></div>', {
            darkMode: "media"
        })
        expect(cssB).toContain("@media")
    })

    it("should cover array-based typography and nested styles with null values", async () => {
        const css = await generateCss('<div class="prose"></div>', {
            theme: {
                extend: {
                    nightwind: { typography: true },
                    typography: {
                        DEFAULT: {
                            css: [
                                { color: "#000", "--tw-prose-body": "#000" },
                                null,
                                { p: { color: "#111" } }
                            ]
                        }
                    }
                }
            }
        })
        expect(css).toContain("--tw-prose-body: hsl(0 0% 100%)")
    })

    it("should cover getGradientValue0 early return with null", () => {
        // This is covered internally, but ensuring it runs
        expect(nightwind.processColor("from-[]", true)).toBe("from-[]")
    })

    it("should cover edge cases in matchUtilities and colors theme", async () => {
        const css = await generateCss('<div class="bg-red-500 from-red-500 bg-non-string from-non-string"></div>', {
            theme: { extend: { colors: { red: { 500: "#f00", 400: "#e00" }, "non-string": 123, empty: "", bad: null } } }
        })
        expect(css).toContain(".dark .bg-red-500")

        const cssNone = await generateCss('<div class="bg-red-500"></div>', {
            theme: { colors: null }
        })
        expect(cssNone).not.toContain(".dark")

        const cssImportant = await generateCss('<div class="group-hover:bg-red-500"></div>', {
            important: true
        })
        expect(cssImportant).toContain("!important")
    })

    it("should cover matchUtilities early returns and invalid types", async () => {
        const css = await generateCss('<div class="bg-[transparent] from-[transparent]"></div>')
        expect(css).not.toContain(".dark .bg-\\[transparent\\]")
        expect(css).not.toContain(".dark .from-\\[transparent\\]")

        let capturedFunctions = {};
        const mockParams = {
            addBase: () => { },
            addComponents: () => { },
            matchUtilities: (utils) => {
                Object.assign(capturedFunctions, utils);
            },
            theme: () => ({}),
            config: () => ({}),
        };
        nightwind.handler(mockParams);
        expect(capturedFunctions.bg(123)).toBeNull();
        expect(capturedFunctions.from(123)).toBeNull();
    })

    it("should cover isDarkModeSelector array branches", async () => {
        const cssArr = await generateCss('<div class="bg-red-500"></div>', {
            darkMode: ["class", ".custom-dark"]
        })
        expect(cssArr).toContain(".custom-dark .bg-red-500")

        const cssArrNoSelector = await generateCss('<div class="bg-red-500"></div>', {
            darkMode: ["class"]
        })
        expect(cssArrNoSelector).toContain(".dark .bg-red-500")
    })

    it("should handle custom transitionDuration", async () => {
        const css = await generateCss('<div class="bg-red-500"></div>', {
            theme: { extend: { nightwind: { transitionDuration: "500ms" } } }
        })
        expect(css).toContain("--nightwind-transition-duration: 500ms")

        const cssFalse = await generateCss('<div class="bg-red-500"></div>', {
            theme: { extend: { nightwind: { transitionDuration: false } } }
        })
        expect(cssFalse).not.toContain("--nightwind-transition-duration")
    })

    it("should add !important to static utilities", async () => {
        const css = await generateCss('<div class="bg-red-500"></div>', {
            important: true
        })
        expect(css).toContain("background-color: rgb(239 68 68) !important")
    })

    it("should cover oklch with absolute values in theme", async () => {
        const css = await generateCss('<div class="bg-custom-500"></div>', {
            theme: { extend: { colors: { custom: { 500: "oklch(0.5 0.2 220)" } } } }
        })
        expect(css).toContain("background-color: oklch(0.5 0.2 220)")
    })
})
