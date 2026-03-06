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
                            500: "#ef4444",
                        },
                        blue: {
                            500: "#3b82f6",
                        }
                    },
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

describe("nightwind dark override prefix", () => {
    it("should allow dark: prefix to override automatic inversion", async () => {
        const css = await generateCss('<div class="bg-blue-500 dark:bg-red-500"></div>')
        expect(css).toContain(".dark .bg-blue-500")
        expect(css).toContain(".dark .dark\\:bg-red-500")
        expect(css).toContain("background-color: rgb(239 68 68 / var(--tw-bg-opacity, 1))")
    })

    it("should effectively override even when important is true", async () => {
        const css = await generateCss('<div class="bg-blue-500 dark:bg-red-500"></div>', {
            important: true
        })
        expect(css).toContain(".dark .bg-blue-500")
        expect(css).toMatch(/\.dark .dark\\:bg-red-500/)
        expect(css).toContain("background-color: rgb(239 68 68 / var(--tw-bg-opacity, 1)) !important")
    })
})
