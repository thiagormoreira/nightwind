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
    ).process("@tailwind utilities; @tailwind components;", {
        from: undefined,
    })
    return result.css
}

describe("nightwind coverage tests", () => {
    it("should handle var() in processColor", async () => {
        const css = await generateCss('<div class="bg-[var(--my-color)]"></div>')
        expect(css).not.toContain("background-color: rgb")
    })

    it("should handle empty value in processColor coverage", async () => {
        // bg-[] results in an empty string value
        const css = await generateCss('<div class="bg-[]"></div>')
        expect(css).toContain(".bg-\\[\\]")
    })

    it("should handle 8-digit hex colors", async () => {
        const css = await generateCss('<div class="bg-[#ff0000ff]"></div>')
        expect(css).toContain("background-color: rgb(0, 255, 255)")
    })

    it("should handle 4-digit hex colors", async () => {
        const css = await generateCss('<div class="bg-[#f00f]"></div>')
        expect(css).toContain("background-color: rgb(0, 255, 255)")
    })

    it("should handle invalid hex length (2, 5, 7)", async () => {
        const css = await generateCss(`
      <div class="bg-[#ff]"></div>
      <div class="bg-[#12345]"></div>
      <div class="bg-[#1234567]"></div>
    `)
        expect(css).toContain("background-color: #ff")
        expect(css).toContain("background-color: #12345")
        expect(css).toContain("background-color: #1234567")
    })

    it("should handle non-hex/non-rgb strings in matchUtilities", async () => {
        // hits if (invertedValue === value) return null
        const css = await generateCss('<div class="bg-[transparent]"></div>')
        expect(css).not.toContain(".dark")
    })

    it("should handle arbitrary values with @media strategy", async () => {
        const css = await generateCss('<div class="bg-[#000000]"></div>', {
            darkMode: "media"
        })
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        expect(css).toContain("background-color: rgb(255, 255, 255)")
    })

    it("should handle missing weight-shifted colors", async () => {
        const css = await generateCss('<div class="bg-primary-500"></div>', {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            500: "#ff0000"
                        }
                    }
                }
            }
        })
        expect(css).toContain("background-color: rgba(0, 255, 255, var(--tw-bg-opacity, 1))")
    })

    it("should handle @media strategy", async () => {
        const css = await generateCss('<div class="bg-red-500"></div>', {
            darkMode: "media"
        })
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        expect(css).toMatch(/background-color: (rgba\(7, 142, 142, var\(--tw-bg-opacity, 1\)\)|rgb\(7 142 142 \/ var\(--tw-bg-opacity, 1\)\))/)
    })

    it("should handle @media strategy with extra variants (coverage focus)", async () => {
        const css = await generateCss('<div class="group-hover:bg-red-500"></div>', {
            darkMode: "media"
        })
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        expect(css).toMatch(/\.group:hover \.group-hover\\:bg-red-500/)
    })

    it("should handle typography with object (non-array) theme", async () => {
        const css = await generateCss('<div class="prose"></div>', {
            theme: {
                extend: {
                    typography: {
                        DEFAULT: {
                            css: {
                                "--tw-prose-body": "#000000"
                            }
                        }
                    }
                }
            }
        })
        expect(css).toContain("--tw-prose-body: rgb(255, 255, 255)")
    })

    it("should handle typography with @media strategy", async () => {
        const css = await generateCss('<div class="prose"></div>', {
            darkMode: "media",
            theme: {
                extend: {
                    typography: {
                        DEFAULT: {
                            css: {
                                "--tw-prose-body": "#000000"
                            }
                        }
                    }
                }
            }
        })
        expect(css).toContain("@media (prefers-color-scheme: dark)")
        expect(css).toContain("--tw-prose-body: rgb(255, 255, 255)")
    })

    it("should handle nested objects in typography theme (recursion)", async () => {
        const css = await generateCss('<div class="prose"></div>', {
            theme: {
                extend: {
                    typography: {
                        DEFAULT: {
                            css: {
                                p: {
                                    "--tw-prose-body": "#000000"
                                }
                            }
                        }
                    }
                }
            }
        })
        expect(css).toContain("--tw-prose-body: rgb(255, 255, 255)")
    })

    it("should handle RGB with numeric alpha (branch coverage)", async () => {
        const css = await generateCss('<div class="bg-[rgb(0,0,0,0.5)]"></div>')
        expect(css).toMatch(/rgba\(255, 255, 255, 0.5\)/)
    })

    it("should handle nightwind.typography = false", async () => {
        const css = await generateCss('<div class="prose"></div>', {
            theme: {
                extend: {
                    nightwind: {
                        typography: false
                    }
                }
            }
        })
        expect(css).not.toContain("--tw-prose-body")
    })

    it("should handle darkMode variants (class array coverage)", async () => {
        const css1 = await generateCss('<div class="bg-red-500"></div>', {
            darkMode: ["class"]
        })
        expect(css1).toContain(".dark .bg-red-500")

        const css2 = await generateCss('<div class="bg-red-500"></div>', {
            darkMode: ["class", ".custom-dark"]
        })
        expect(css2).toContain(".custom-dark .bg-red-500")
    })

    it("should handle arbitrary hex that is in theme", async () => {
        const css = await generateCss('<div class="bg-[#ef4444]"></div>')
        expect(css).not.toContain(".dark .bg-\\[\\#ef4444\\]")
    })

    it("should handle typography with various css branch options", async () => {
        const css = await generateCss('<div class="prose"></div>', {
            theme: {
                extend: {
                    typography: {
                        DEFAULT: {
                            css: [
                                { "--tw-prose-body": "#000", "font-weight": "bold" },
                                null
                            ]
                        }
                    }
                }
            }
        })
        expect(css).toContain("--tw-prose-body: rgb(255, 255, 255)")
        expect(css).not.toContain("font-weight: rgb")
    })

    it("should handle non-string color in theme (corner case)", async () => {
        const css = await generateCss('<div class="bg-weird"></div>', {
            theme: {
                extend: {
                    colors: {
                        weird: 123
                    }
                }
            }
        })
        expect(css).not.toContain(".dark .bg-weird")
    })
})
