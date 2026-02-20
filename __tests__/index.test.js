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
              50: "#fef2f2",
              300: "#fca5a5",
              600: "#dc2626",
              900: "#7f1d1d",
            },
            blue: {
              300: "#93c5fd",
              500: "#3b82f6",
              600: "#2563eb",
            },
          },
          nightwind: {
            opacityClasses: ["10", "40", "50", "60", "80"],
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

describe("nightwind plugin", () => {
  it("should invert background classes", async () => {
    const css = await generateCss('<div class="bg-red-600"></div>')
    expect(css).toContain(".dark .bg-red-600")
    // For tailwind 3.x with JIT, it generates the specific utility and the dark version
  })

  it("should invert text classes", async () => {
    const css = await generateCss('<div class="text-blue-300"></div>')
    expect(css).toContain(".dark .text-blue-300")
  })

  it("should handle white and black backgrounds", async () => {
    const css = await generateCss('<div class="bg-white text-black"></div>')
    expect(css).toContain(".dark .bg-white")
    expect(css).toContain(".dark .text-black")
  })

  it("should generate prevent switch classes", async () => {
    const css = await generateCss(
      '<div class="bg-red-600 nightwind-prevent"></div>'
    )
    expect(css).toContain(".nightwind-prevent")
  })

  it("should handle opacity modifiers appropriately", async () => {
    const css = await generateCss('<div class="bg-red-600/50 border-blue-500/10"></div>')
    expect(css).toContain(".dark .bg-red-600\\/50")
    expect(css).toContain("rgba(252, 165, 165, 0.5)")
    expect(css).toContain(".dark .border-blue-500\\/10")
    expect(css).toContain("rgba(96, 165, 250, 0.1)")
  })

  it("should handle custom flat colors", async () => {
    const css = await generateCss(`
      <div class="bg-custom-hex/40 text-custom-var/60 border-custom-rgb/80"></div>
    `, {
      theme: {
        extend: {
          colors: {
            "custom-hex": "#1a2b3c",
            "custom-var": "var(--my-color)",
            "custom-rgb": "rgb(10 20 30)",
          },
        },
        nightwind: {
          opacityClasses: ["40", "60", "80"],
        }
      }
    })
    expect(css).toContain(".dark .bg-custom-hex\\/40")
    expect(css).toContain(".dark .text-custom-var\\/60")
    expect(css).toContain(".dark .border-custom-rgb\\/80")
  })
})
