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
        expect(css).toContain("background-color: rgb(0, 0, 0)")
    })

    it("should invert arbitrary rgb text", async () => {
        const css = await generateCss('<div class="text-[rgb(0,0,0)]"></div>')
        expect(css).toContain(".dark .text-\\[rgb\\(0\\2c 0\\2c 0\\)\\]")
        expect(css).toContain("color: rgb(255, 255, 255)")
    })

    it("should invert arbitrary hex border", async () => {
        const css = await generateCss('<div class="border-[#00ff00]"></div>')
        expect(css).toContain(".dark .border-\\[\\#00ff00\\]")
        expect(css).toContain("border-color: rgb(255, 0, 255)")
    })
})
