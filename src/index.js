const plugin = require("tailwindcss/plugin")

/**
 * Parses a color string (Hex, RGB, RGBA) and optionally inverts it.
 * Supports CSS Color Level 4 and returns comma-separated format for tests.
 */
const processColor = (value, shouldInvert = true) => {
  if (!value) return value
  if (value.includes("var(")) return value

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

    if (hex.length !== 6) return value

    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else {
    const rgbMatch = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+([\d.%]+))?\)/)
    if (!rgbMatch) return value

    r = parseInt(rgbMatch[1])
    g = parseInt(rgbMatch[2])
    b = parseInt(rgbMatch[3])

    if (rgbMatch[4]) {
      const alphaVal = rgbMatch[4]
      if (alphaVal.endsWith("%")) {
        a = (parseFloat(alphaVal) / 100).toFixed(3)
      } else {
        a = parseFloat(alphaVal)
      }
    }
  }

  if (shouldInvert) {
    r = 255 - r
    g = 255 - g
    b = 255 - b
  }

  return a == 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`
}

const nightwind = plugin(
  function ({ addBase, addComponents, matchUtilities, theme, config }) {
    const darkModeConfig = config("darkMode", "class")
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
      const isStandard = colorValue && typeof colorValue === "object"
      const weightsToProcess = isStandard ? Object.keys(colorValue) : ["DEFAULT"]

      weightsToProcess.forEach(weight => {
        const colorPath = isStandard ? `${colorName}.${weight}` : colorName
        const resolvedValue = theme(`colors.${colorPath}`)
        if (typeof resolvedValue !== "string") return

        themeColorValues[resolvedValue.toLowerCase()] = true

        let invertedValue = resolvedValue
        if (isStandard && !isNaN(weight)) {
          const weightNum = Number(weight)
          const weightIndex = weights.indexOf(weightNum)
          if (weightIndex !== -1) {
            invertedValue = theme(`colors.${colorName}.${weights[9 - weightIndex]}`) || resolvedValue
          }
        }
        const inverted = processColor(invertedValue, true)

        Object.entries(colorUtilities).forEach(([prefix, { prop, opacityVar }]) => {
          const baseClass = weight === "DEFAULT" ? `${prefix}-${colorName}` : `${prefix}-${colorName}-${weight}`
          const escapedBase = baseClass.replace(/:/g, "\\:").replace(/\//g, "\\/")

          variantsList.forEach(v => {
            const selector = v === "" ? `.${escapedBase}` : `.${v}\\:${escapedBase}:${v}`
            let val = inverted
            if (opacityVar) val = inverted.replace("rgb(", "rgba(").replace(")", `, var(${opacityVar}, 1))`)
            nightwindClasses[`${darkSelector} ${selector}`] = { [prop]: val + importantSuffix }
            nightwindClasses[`${selector}.${fixedElementClass}, .${fixedBlockClass} ${selector}`] = { [prop]: processColor(resolvedValue, false) + importantSuffix }
          })

          if (!darkSelector.startsWith("@media")) {
            const darkManualSelector = `.dark\\:${escapedBase}`
            let darkManualValue = processColor(resolvedValue, false)
            if (opacityVar) darkManualValue = darkManualValue.replace("rgb(", "rgba(").replace(")", `, var(${opacityVar}, 1))`)
            manualOverrides[`${darkSelector} ${darkManualSelector}`] = { [prop]: darkManualValue + importantSuffix }
          }

          const extras = [
            { s: `.group:hover .group-hover\\:${escapedBase}` },
            { s: `.peer:focus ~ .peer-focus\\:${escapedBase}` }
          ]
          extras.forEach(({ s }) => {
            let val = inverted
            if (opacityVar) val = inverted.replace("rgb(", "rgba(").replace(")", `, var(${opacityVar}, 1))`)
            if (darkSelector.startsWith("@media")) {
              nightwindClasses[darkSelector] = nightwindClasses[darkSelector] || {}
              nightwindClasses[darkSelector][s] = { [prop]: val + importantSuffix }
            } else {
              nightwindClasses[`${darkSelector} ${s}`] = { [prop]: val + importantSuffix }
            }
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
      const typographyTheme = theme("typography.DEFAULT.css", {})
      const darkTypographyVars = {}
      const extractColors = (obj) => {
        Object.entries(obj || {}).forEach(([key, val]) => {
          if (typeof val === "string") {
            if (val.startsWith("#") || val.startsWith("rgb")) {
              if (key.startsWith("--tw-prose-")) {
                darkTypographyVars[key] = processColor(val, true)
              }
            }
          } else if (val && typeof val === "object") {
            extractColors(val)
          }
        })
      }
      if (Array.isArray(typographyTheme)) {
        typographyTheme.forEach(extractColors)
      } else {
        extractColors(typographyTheme)
      }
      if (Object.keys(darkTypographyVars).length > 0) {
        const typographyStyles = { [proseSelector]: darkTypographyVars }
        if (darkSelector.startsWith("@media")) {
          addComponents({ [darkSelector]: typographyStyles })
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
