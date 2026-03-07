const postcss = require("postcss")
const tailwindcss = require("tailwindcss")
const nightwind = require("../src/index.js")

async function generateCss(html, config = {}) {
    const result = await postcss([
        tailwindcss({
            content: [{ raw: html }],
            darkMode: "class",
            plugins: [nightwind],
            theme: {
                extend: {}
            },
            ...config,
        }),
    ]).process("@tailwind utilities;", {
        from: undefined,
    })
    return result.css
}

describe("nightwind arbitrary colors", () => {
    it("should invert arbitrary hex background", async () => {
        const css = await generateCss('<div class="bg-[#ffffff]"></div>')
        expect(css).toContain(".dark .bg-\\[\\#ffffff\\]")
        expect(css).toContain("background-color: rgb(0 0 0)")
    })

    it("should invert arbitrary rgb text", async () => {
        const css = await generateCss('<div class="text-[rgb(0,0,0)]"></div>')
        expect(css).toContain(".dark .text-\\[rgb\\(0\\2c 0\\2c 0\\)\\]")
        expect(css).toContain("color: rgb(255 255 255)")
    })

    it("should invert arbitrary hex border", async () => {
        const css = await generateCss('<div class="border-[#00ff00]"></div>')
        expect(css).toContain(".dark .border-\\[\\#00ff00\\]")
        expect(css).toContain("border-color: rgb(255 0 255)")
    })

    it("should invert arbitrary to gradient", async () => {
        const css = await generateCss('<div class="to-[#ff0000]"></div>')
        expect(css).toContain(".dark .to-\\[\\#ff0000\\]")
        expect(css).toContain("--tw-gradient-to: rgb(0 255 255)")
    })

    it("should invert arbitrary from/via gradient", async () => {
        const css = await generateCss('<div class="from-[#ff0000] via-[#00ff00]"></div>')
        expect(css).toContain("--tw-gradient-from: rgb(0 255 255)")
        expect(css).toContain("--tw-gradient-stops: var(--tw-gradient-from), rgb(255 0 255), var(--tw-gradient-to, rgb(255 0 255 / 0))")
    })
})
