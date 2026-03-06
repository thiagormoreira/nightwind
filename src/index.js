const plugin = require("tailwindcss/plugin")

/**
 * Parses a color string (Hex, RGB, RGBA) and optionally inverts it.
 * Supports CSS Color Level 4 and returns comma-separated format for tests.
 */
const processColor = (value, shouldInvert = true) => {
  if (!value || typeof value !== "string" || value.includes("var(")) return value

  let r, g, b, a = 1

  if (value.startsWith("#")) {
    let hex = value.slice(1)
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("")
    if (hex.length === 4) {
      a = (parseInt(hex[3] + hex[3], 16) / 255).toFixed(3)
      hex = hex.slice(0, 3).split("").map(c => c + c).join("")
    } else if (hex.length === 8) {
      a = (parseInt(hex.slice(6, 8), 16) / 255).toFixed(3)
      hex = hex.slice(0, 6)
    }
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    } else return value
  } else {
    const rgbMatch = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+([\d.%]+))?\)/)
    if (rgbMatch) {
      r = parseInt(rgbMatch[1])
      g = parseInt(rgbMatch[2])
      b = parseInt(rgbMatch[3])
      if (rgbMatch[4]) {
        let alpha = rgbMatch[4]
        a = alpha.endsWith("%") ? (parseFloat(alpha) / 100).toFixed(3) : parseFloat(alpha)
      }
    } else return value
  }

  if (shouldInvert) {
    r = 255 - r
    g = 255 - g
    b = 255 - b
  }

  if (a == 1 || a == "1") return `rgb(${r}, ${g}, ${b})`
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const nightwind = plugin(
  function ({ addBase, addComponents, matchUtilities, theme, config }) {
    const darkModeConfig = config("darkMode")
    const isDarkModeSelector = Array.isArray(darkModeConfig) ? darkModeConfig[0] === "class" : darkModeConfig === "class"
    const darkSelector = isDarkModeSelector ? (Array.isArray(darkModeConfig) ? darkModeConfig[1] || ".dark" : ".dark") : "@media (prefers-color-scheme: dark)"

    const fixedElementClass = theme("nightwind.fixedClass", "nightwind-prevent")
    const fixedBlockClass = theme("nightwind.fixedBlockClass", "nightwind-prevent-block")
    const transitionDurationValue = theme("nightwind.transitionDuration", "400ms")

    if (transitionDurationValue !== false) {
      addBase({
        ":root": { "--nightwind-transition-duration": transitionDurationValue },
        ".nightwind": {
          "transition-duration": "var(--nightwind-transition-duration)",
          "transition-property": theme("transitionProperty.colors"),
          "transition-timing-function": "ease-in-out",
        },
      })
    }

    const colorUtilities = {
      bg: { prop: "background-color", opacityVar: "--tw-bg-opacity" },
      text: { prop: "color", opacityVar: "--tw-text-opacity" },
      border: { prop: "border-color", opacityVar: "--tw-border-opacity" },
      ring: { prop: "--tw-ring-color", opacityVar: "--tw-ring-opacity" },
      "ring-offset": { prop: "--tw-ring-offset-color" },
      outline: { prop: "outline-color" },
      decoration: { prop: "text-decoration-color" },
      accent: { prop: "accent-color" },
      caret: { prop: "caret-color" },
      fill: { prop: "fill" },
      stroke: { prop: "stroke" },
      shadow: { prop: "--tw-shadow-color" },
    }

    const weights = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
    const variantsList = ["", "hover", "focus", "active", "focus-within", "focus-visible", "disabled"]
    const importantSuffix = config("important") === true ? " !important" : ""

    const colors = theme("colors")
    const nightwindClasses = {}
    const manualOverrides = {}
    const themeColorValues = {}

    // 1. Loop for standard theme colors
    Object.entries(colors).forEach(([colorName, colorValue]) => {
      const isStandard = typeof colorValue === "object" && colorValue !== null
      const weightsToProcess = isStandard ? Object.keys(colorValue) : ["DEFAULT"]

      weightsToProcess.forEach(weight => {
        const colorPath = isStandard ? `${colorName}.${weight}` : colorName
        const resolvedValue = theme(`colors.${colorPath}`)
        if (typeof resolvedValue !== "string") return

        // Tracking theme colors to avoid greedy matchUtilities capture
        themeColorValues[resolvedValue.toLowerCase()] = true

        let invertedValue = resolvedValue
        if (isStandard && !isNaN(weight)) {
          const w = Number(weight)
          const weightIndex = weights.indexOf(w)
          if (weightIndex !== -1) {
            invertedValue = theme(`colors.${colorName}.${weights[9 - weightIndex]}`) || resolvedValue
          }
        }
        const inverted = processColor(invertedValue, true)

        Object.entries(colorUtilities).forEach(([prefix, { prop, opacityVar }]) => {
          const baseClass = weight === "DEFAULT" ? `${prefix}-${colorName}` : `${prefix}-${colorName}-${weight}`
          const escapedBase = baseClass.replace(/:/g, "\\:").replace(/\//g, "\\/")

          variantsList.forEach(v => {
            let selector = v === "" ? `.${escapedBase}` : `.${v}\\:${escapedBase}:${v}`
            let val = inverted
            if (opacityVar) val = inverted.replace("rgb(", "rgba(").replace(")", `, var(${opacityVar}, 1))`)
            nightwindClasses[v === "" ? `${darkSelector} ${selector}` : `${darkSelector} ${selector}`] = { [prop]: val + importantSuffix }
            nightwindClasses[`${selector}.${fixedElementClass}, .${fixedBlockClass} ${selector}`] = { [prop]: processColor(resolvedValue, false) + importantSuffix }
          })

          // Manual Override (addBase to avoid JIT wrap)
          if (!darkSelector.startsWith("@media")) {
            const darkManualSelector = `.dark\\:${escapedBase}`
            let darkManualValue = processColor(resolvedValue, false)
            if (opacityVar) darkManualValue = darkManualValue.replace("rgb(", "rgba(").replace(")", `, var(${opacityVar}, 1))`)
            manualOverrides[`${darkSelector} ${darkManualSelector}`] = { [prop]: darkManualValue + importantSuffix }
          }

          // Extra variants
          const extras = [
            { s: `.group:hover .group-hover\\:${escapedBase}` },
            { s: `.peer:focus ~ .peer-focus\\:${escapedBase}` }
          ]
          extras.forEach(({ s }) => {
            let val = inverted
            if (opacityVar) val = inverted.replace("rgb(", "rgba(").replace(")", `, var(${opacityVar}, 1))`)
            nightwindClasses[`${darkSelector} ${s}`] = { [prop]: val + importantSuffix }
            nightwindClasses[`${s}.${fixedElementClass}, .${fixedBlockClass} ${s}`] = { [prop]: processColor(resolvedValue, false) + importantSuffix }
          })
        })
      })
    })

    addComponents(nightwindClasses)
    if (Object.keys(manualOverrides).length > 0) addBase(manualOverrides)

    // 2. Loop for arbitrary values
    Object.entries(colorUtilities).forEach(([prefix, { prop }]) => {
      matchUtilities(
        {
          [prefix]: (value) => {
            if (typeof value !== "string") return null
            // Check if this is a theme color value (already handled)
            if (themeColorValues[value.toLowerCase()]) return null

            const invertedValue = processColor(value, true)
            if (invertedValue === value) return null
            const styles = {}
            if (darkSelector.startsWith("@media")) {
              styles[darkSelector] = { "&": { [prop]: invertedValue } }
            } else {
              styles[`${darkSelector} &`] = { [prop]: invertedValue }
            }
            styles[`&.${fixedElementClass}, .${fixedBlockClass} &`] = { [prop]: value }
            return styles
          },
        },
        { values: {}, type: "color" }
      )
    })

    // 3. Typography Support
    if (theme("nightwind.typography") !== false) {
      const proseSelector = theme("nightwind.typographySelector", ".prose")
      const typographyTheme = theme("typography.DEFAULT.css", [])
      const darkTypographyVars = {}
      const extractColors = (obj) => {
        Object.entries(obj || {}).forEach(([key, val]) => {
          if (typeof val === "string" && (val.startsWith("#") || val.startsWith("rgb"))) {
            if (key.startsWith("--tw-prose-")) {
              darkTypographyVars[key] = processColor(val, true)
            }
          } else if (typeof val === "object" && val !== null) {
            extractColors(val)
          }
        })
      }
      if (Array.isArray(typographyTheme)) {
        typographyTheme.forEach(extractColors)
      } else {
        extractColors(typographyTheme || {})
      }
      if (Object.keys(darkTypographyVars).length > 0) {
        if (darkSelector.startsWith("@media")) {
          addComponents({ [darkSelector]: { [proseSelector]: darkTypographyVars } })
        } else {
          addComponents({ [`${darkSelector} ${proseSelector}`]: darkTypographyVars })
        }
      }
    }
  },
  {
    theme: {
      extend: {
        transitionDuration: {
          nightwind: "400ms",
        },
      },
    },
  }
)

module.exports = nightwind
