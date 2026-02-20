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
})
