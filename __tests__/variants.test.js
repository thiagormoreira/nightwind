const postcss = require("postcss")
const tailwindcss = require("tailwindcss")
const nightwind = require("../src/index.js")

async function generateCss(html, config = {}) {
    const result = await postcss([
        tailwindcss({
            content: [{ raw: html }],
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        red: {
                            400: "#f87171",
                            600: "#dc2626",
                        },
                        blue: {
                            500: "#3b82f6",
                        },
                        hoverred: {
                            500: "#ef4444",
                        }
                    },
                    nightwind: {
                        variants: ["group-hover", "peer-focus"]
                    }
                },
            },
            plugins: [nightwind],
            ...config,
        }),
    ]).process("@tailwind utilities; @tailwind components;", {
        from: undefined,
    })
    return result.css
}

describe("nightwind variants", () => {
    it("should handle hover variant correctly", async () => {
        const css = await generateCss('<div class="hover:bg-red-600"></div>')
        expect(css).toContain(".dark .hover\\:bg-red-600:hover")
    })

    it("should handle group-hover variant correctly", async () => {
        const css = await generateCss('<div class="group-hover:bg-red-600"></div>')
        expect(css).toContain(".dark .group:hover .group-hover\\:bg-red-600")
    })

    it("should handle peer-focus variant correctly", async () => {
        const css = await generateCss('<div class="peer-focus:text-blue-500"></div>')
        expect(css).toContain(".dark .peer:focus ~ .peer-focus\\:text-blue-500")
    })

    it("should NOT trigger hover on a color name containing hover", async () => {
        const css = await generateCss('<div class="bg-hoverred-500"></div>')
        expect(css).toContain(".dark .bg-hoverred-500")
        expect(css).not.toContain(".dark .bg-hoverred-500:hover")
    })

    it("should support default variants like focus and disabled", async () => {
        const css = await generateCss('<div class="focus:bg-red-600 disabled:opacity-50 disabled:bg-red-400"></div>')
        expect(css).toContain(".dark .focus\\:bg-red-600:focus")
        expect(css).toContain(".dark .disabled\\:bg-red-400:disabled")
    })
})
