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
        expect(nightwind.processColor("oklch(20% 0.1 10)", true)).toBe("oklch(80% 0.1 10)")
        expect(nightwind.processColor("rgb(0 0 0 / 50%)", true)).toBe("rgb(255 255 255 / 0.5)")
        expect(nightwind.processColor(" oklch(0.2 0.1 10) ", false)).toBe("oklch(0.2 0.1 10)")
        // Verify functional normalization for OKLCH
        expect(nightwind.processColor("oklch(0.2 0.1 10)", false)).toBe("oklch(0.2 0.1 10)")
    })

    it("should handle HSL colors and alpha", () => {
        // Inversion: h = 217 (preserved), l = 100 - 60 = 40
        expect(nightwind.processColor("hsl(217, 91%, 60%)", true)).toBe("hsl(217 91% 40%)")
        expect(nightwind.processColor("hsla(217, 91%, 60%, 0.5)", true)).toBe("hsl(217 91% 40% / 0.5)")
        // Functional normalization for HSL
        expect(nightwind.processColor("hsl(217, 91%, 60%)", false)).toBe("hsl(217 91% 60%)")
    })

    it("should handle empty/invalid values in processColor", () => {
        expect(nightwind.processColor(null)).toBe(null)
        expect(nightwind.processColor(123)).toBe(123)
        expect(nightwind.processColor("#ff", true)).toBe("#ff")
        expect(nightwind.processColor("oklch(0.2)", true)).toBe("oklch(0.2)")
        expect(nightwind.processColor("hsl(217)", true)).toBe("hsl(217)")
    })

    it("should handle all hex lengths and normalize alpha", async () => {
        expect(nightwind.processColor("#fff", true)).toBe("rgb(0 0 0)")
        expect(nightwind.processColor("#0000", true)).toBe("rgb(255 255 255 / 0)")
        expect(nightwind.processColor("#00000000", true)).toBe("rgb(255 255 255 / 0)")
        // RESTORED: Hex NO LONGER returns hex, it returns rgb() for functional consistency
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
        expect(css).toContain("--tw-gradient-from: rgb(255 255 255 / 0.5)")
        expect(css).toContain("rgb(0 255 255)")
        // Verify hex in gradient via Option B restoration
        expect(css).toContain("var(--tw-gradient-to, rgb(255 0 0 / 0))")
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
        // bg-red-500 gets inverted
        expect(css).toContain(".dark .bg-red-500")
        // dark:bg-blue-500 rule
        expect(css).toContain("rgb(59 130 246")
    })

    it("should be v4 compliant in generated rules", async () => {
        const css = await generateCss('<div class="bg-red-500"></div>')
        expect(css).toContain(".dark .bg-red-500")
        expect(css).toContain("background-color: rgb(16 187 187)")
    })

    it("should cover @media strategy and typography", async () => {
        const css = await generateCss('<div class="bg-red-500 prose from-red-500"></div>', {
            darkMode: "media",
            theme: {
                extend: {
                    nightwind: { typography: true },
                    typography: { DEFAULT: { css: { "--tw-prose-body": "hsl(217, 91%, 60%)" } } }
                }
            }
        })
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        // Verify HSL inversion (Hue preserved: 217)
        expect(css).toContain("--tw-prose-body: hsl(217 91% 40%)")
    })
})
