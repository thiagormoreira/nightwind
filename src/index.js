const plugin = require("tailwindcss/plugin")

/**
 * Parses a color string (Hex, RGB, RGBA, OKLCH, HSL, HSLA) and optionally inverts it.
 */
const processColor = (value, shouldInvert = true) => {
  if (!value || typeof value !== "string") return value
  const trimmed = value.trim()
  if (trimmed.includes("var(")) return value

  const lowTrimmed = trimmed.toLowerCase()

  if (lowTrimmed.includes("oklch")) {
    if (lowTrimmed.includes("none") || !shouldInvert) return trimmed
    const parts = trimmed.match(/[\d.%]+/g)
    if (!parts || parts.length < 3) return value
    let l = parts[0]
    let lVal = parseFloat(l)
    let isPercent = l.endsWith("%")

    // Normalize lVal based on percentage or range
    lVal = parseFloat(isPercent
      ? (100 - lVal).toFixed(1)
      : (1 - lVal).toFixed(3)
    )

    let res = `oklch(${lVal}${isPercent ? "%" : ""} ${parts[1]} ${parts[2]}`
    if (parts[3]) res += ` / ${parts[3]}`
    res += ")"
    return res
  }

  const hslMatch = trimmed.match(/hsla?\(([\d.]+(?:deg|grad|rad|turn)?)[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[,\s\/]+([\d.%]+))?\s*\)/)
  if (hslMatch) {
    if (!shouldInvert) return trimmed
    let h = hslMatch[1]
    let l = parseFloat(hslMatch[3])
    l = parseFloat((100 - l).toFixed(1))
    const s = hslMatch[2]
    let alpha = hslMatch[4]
    if (alpha) {
      alpha = alpha.endsWith("%")
        ? parseFloat((parseFloat(alpha) / 100).toFixed(3))
        : parseFloat(alpha)
    }
    return alpha !== undefined
      ? `hsl(${h} ${s}% ${l}% / ${alpha})`
      : `hsl(${h} ${s}% ${l}%)`
  }

  let r, g, b, a = 1
  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1)
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("")
    if (hex.length === 4) {
      const alphaVal = (parseInt(hex[3] + hex[3], 16) / 255).toFixed(3)
      a = parseFloat(alphaVal)
      hex = hex.slice(0, 3).split("").map(c => c + c).join("")
    } else if (hex.length === 8) {
      const alphaVal = (parseInt(hex.slice(6, 8), 16) / 255).toFixed(3)
      a = parseFloat(alphaVal)
      hex = hex.slice(0, 6)
    }
    if (hex.length !== 6) return value
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else {
    const rgbMatch = trimmed.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+([\d.%]+))?\s*\)/)
    if (!rgbMatch) return value
    r = parseInt(rgbMatch[1])
    g = parseInt(rgbMatch[2])
    b = parseInt(rgbMatch[3])
    if (rgbMatch[4]) {
      const alphaVal = rgbMatch[4]
      a = alphaVal.endsWith("%")
        ? parseFloat((parseFloat(alphaVal) / 100).toFixed(3))
        : parseFloat(alphaVal)
    }
  }

  if (shouldInvert) {
    r = 255 - r
    g = 255 - g
    b = 255 - b
  }
  return a === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a})`
}

const nightwind = plugin(
  function ({ addBase, addComponents, matchUtilities, theme, config }) {
    const darkModeConfig = config("darkMode", "class")
    const isDarkModeSelector = Array.isArray(darkModeConfig) ? darkModeConfig[0] === "class" : darkModeConfig === "class"
    const darkSelector = isDarkModeSelector ? (Array.isArray(darkModeConfig) ? darkModeConfig[1] || ".dark" : ".dark") : "@media (prefers-color-scheme: dark)"

    const fixedElementClass = theme("nightwind.fixedClass", "nightwind-prevent")
    const fixedBlockClass = theme("nightwind.fixedBlockClass", "nightwind-prevent-block")
    const transitionDurationValue = theme("nightwind.transitionDuration") === false ? false : (theme("nightwind.transitionDuration") || "400ms")

    if (transitionDurationValue !== false && transitionDurationValue !== "false") {
      addBase({ ":root": { "--nightwind-transition-duration": transitionDurationValue } })
      addComponents({
        ".nightwind, .nightwind *": {
          "transition-duration": "var(--nightwind-transition-duration)",
          "transition-property": theme("transitionProperty.colors"),
          "transition-timing-function": "ease-in-out",
        },
      })
    }

    const colorUtilities = {
      bg: { prop: "background-color" },
      text: { prop: "color" },
      border: { prop: "border-color" },
      ring: { prop: "--tw-ring-color" },
      "ring-offset": { prop: "--tw-ring-offset-color" },
      outline: { prop: "outline-color" },
      decoration: { prop: "text-decoration-color" },
      accent: { prop: "accent-color" },
      caret: { prop: "caret-color" },
      fill: { prop: "fill" },
      stroke: { prop: "stroke" },
      shadow: { prop: "--tw-shadow-color" },
      divide: { prop: "border-color", suffix: " > :not([hidden]) ~ :not([hidden])" },
      placeholder: { prop: "color", suffix: "::placeholder" },
    }

    const weights = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    const variantsList = ["", "hover", "focus", "active", "focus-within", "focus-visible", "disabled"]
    const importantSuffix = config("important") === true ? " !important" : ""

    const colors = theme("colors") || {}
    const nightwindClasses = {}
    if (darkSelector.startsWith("@media")) nightwindClasses[darkSelector] = {}
    const manualOverrides = {}

    const getGradientValue0 = (val) => {
      if (!val) return val
      // Normalize legacy syntax (commas) to modern syntax (spaces) for consistency
      const normalized = val.replace(/,\s*/g, " ")
      return /\//.test(normalized)
        ? normalized.replace(/\/[\s\d.%]+\)$/, "/ 0)")
        : normalized.replace(/\)$/, " / 0)")
    }

    Object.entries(colors).forEach(([colorName, colorValue]) => {
      const isStandard = colorValue && typeof colorValue === "object"
      const weightsToProcess = isStandard ? Object.keys(colorValue) : ["DEFAULT"]

      weightsToProcess.forEach(weight => {
        const colorPath = isStandard ? `${colorName}.${weight}` : colorName
        const resolvedValue = theme(`colors.${colorPath}`)
        if (typeof resolvedValue !== "string") return

        let invertedValue = resolvedValue
        let shouldInvertColor = true
        if (isStandard && !isNaN(weight)) {
          const weightNum = Number(weight)
          const weightIndex = weights.indexOf(weightNum)
          if (weightIndex !== -1) {
            const oppositeWeightNum = weights[weights.length - 1 - weightIndex]
            if (oppositeWeightNum !== weightNum) {
              const oppositeColor = theme(`colors.${colorName}.${oppositeWeightNum}`)
              if (oppositeColor && typeof oppositeColor === "string") {
                invertedValue = oppositeColor
                shouldInvertColor = false
              }
            }
          }
        }
        const inverted = processColor(invertedValue, shouldInvertColor)
        const fixedValue = processColor(resolvedValue, false)

        // Standard Utilities
        Object.entries(colorUtilities).forEach(([prefix, { prop, suffix }]) => {
          const baseClass = weight === "DEFAULT" ? `${prefix}-${colorName}` : `${prefix}-${colorName}-${weight}`
          const escapedBase = baseClass.replace(/:/g, "\\:").replace(/\//g, "\\/")
          const sfx = suffix || ""

          variantsList.forEach(v => {
            const baseSelector = v === "" ? `.${escapedBase}` : `.${v}\\:${escapedBase}:${v}`
            const selector = baseSelector + sfx

            if (darkSelector.startsWith("@media")) {
              nightwindClasses[darkSelector][selector] = { [prop]: inverted + importantSuffix }
            } else {
              nightwindClasses[`${darkSelector} ${selector}`] = { [prop]: inverted + importantSuffix }
            }
            nightwindClasses[`${baseSelector}.${fixedElementClass}${sfx}, .${fixedBlockClass} ${baseSelector}${sfx}`] = { [prop]: fixedValue + importantSuffix }
          })

          if (!darkSelector.startsWith("@media")) {
            const baseSelector = `.dark\\:${escapedBase}`
            const selector = baseSelector + sfx
            manualOverrides[`${darkSelector} ${selector}`] = { [prop]: fixedValue + importantSuffix }
          }

          const extras = [
            { s: `.group:hover .group-hover\\:${escapedBase}` },
            { s: `.peer:focus ~ .peer-focus\\:${escapedBase}` }
          ]
          extras.forEach(({ s }) => {
            const fullS = s + sfx
            if (darkSelector.startsWith("@media")) {
              nightwindClasses[darkSelector][fullS] = { [prop]: inverted + importantSuffix }
            } else {
              nightwindClasses[`${darkSelector} ${fullS}`] = { [prop]: inverted + importantSuffix }
            }
            nightwindClasses[`${s}.${fixedElementClass}${sfx}, .${fixedBlockClass} ${s}${sfx}`] = { [prop]: fixedValue + importantSuffix }
          })
        })

        // Gradients
        const gPrefixes = ["from", "via", "to"]
        const gradientValue0 = getGradientValue0(inverted)
        const res = processColor(resolvedValue, false)
        const res0 = getGradientValue0(res)

        gPrefixes.forEach(prefix => {
          const baseClass = weight === "DEFAULT" ? `${prefix}-${colorName}` : `${prefix}-${colorName}-${weight}`
          const escapedBase = baseClass.replace(/:/g, "\\:").replace(/\//g, "\\/")

          let styles = {}
          let fixedStyles = {}

          if (prefix === "from") {
            styles = {
              "--tw-gradient-from": inverted,
              "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${gradientValue0})`
            }
            fixedStyles = {
              "--tw-gradient-from": res,
              "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${res0})`
            }
          } else if (prefix === "via") {
            styles = {
              "--tw-gradient-stops": `var(--tw-gradient-from), ${inverted}, var(--tw-gradient-to, ${gradientValue0})`
            }
            fixedStyles = {
              "--tw-gradient-stops": `var(--tw-gradient-from), ${res}, var(--tw-gradient-to, ${res0})`
            }
          } else {
            styles = { "--tw-gradient-to": inverted }
            fixedStyles = { "--tw-gradient-to": res }
          }

          variantsList.forEach(v => {
            const baseSelector = v === "" ? `.${escapedBase}` : `.${v}\\:${escapedBase}:${v}`
            if (darkSelector.startsWith("@media")) {
              nightwindClasses[darkSelector][baseSelector] = styles
            } else {
              nightwindClasses[`${darkSelector} ${baseSelector}`] = styles
            }
            nightwindClasses[`${baseSelector}.${fixedElementClass}, .${fixedBlockClass} ${baseSelector}`] = fixedStyles
          })

          // Manual Override for gradients
          if (!darkSelector.startsWith("@media")) {
            const manualSelector = `.dark\\:${escapedBase}`
            manualOverrides[`${darkSelector} ${manualSelector}`] = fixedStyles
          }
        })
      })
    })

    addComponents(nightwindClasses)
    if (Object.keys(manualOverrides).length > 0) addComponents(manualOverrides)

    // Match Utilities
    Object.entries(colorUtilities).forEach(([prefix, { prop, suffix }]) => {
      matchUtilities(
        {
          [prefix]: (value) => {
            if (typeof value !== "string") return null
            const invertedValue = processColor(value, true)
            if (invertedValue === value) return null
            const styles = {}
            const sfx = suffix || ""

            if (darkSelector.startsWith("@media")) styles[darkSelector] = { [`&${sfx}`]: { [prop]: invertedValue } }
            else styles[`${darkSelector} &${sfx}`] = { [prop]: invertedValue }
            styles[`&.${fixedElementClass}${sfx}, .${fixedBlockClass} &${sfx}`] = { [prop]: value }
            return styles
          },
        },
        { values: {}, type: "color" }
      )
    })

    // Gradient Match Utilities
    const gradientMatchConfig = {
      from: (val, val0) => ({
        "--tw-gradient-from": val,
        "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${val0})`
      }),
      via: (val, val0) => ({
        "--tw-gradient-stops": `var(--tw-gradient-from), ${val}, var(--tw-gradient-to, ${val0})`
      }),
      to: (val) => ({ "--tw-gradient-to": val }),
    }

    Object.entries(gradientMatchConfig).forEach(([prefix, buildStyles]) => {
      matchUtilities(
        {
          [prefix]: (value) => {
            if (typeof value !== "string") return null
            const inv = processColor(value, true)
            if (inv === value) return null
            const inv0 = getGradientValue0(inv)
            const styles = {}
            if (darkSelector.startsWith("@media")) styles[darkSelector] = { "&": buildStyles(inv, inv0) }
            else styles[`${darkSelector} &`] = buildStyles(inv, inv0)

            const resVal = processColor(value, false)
            const resVal0 = getGradientValue0(resVal)
            styles[`&.${fixedElementClass}, .${fixedBlockClass} &`] = buildStyles(resVal, resVal0)

            return styles
          },
        },
        { values: {}, type: "color" }
      )
    })

    if (theme("nightwind.typography") !== false) {
      const proseSelector = theme("nightwind.typographySelector", ".prose")
      const typographyTheme = theme("typography.DEFAULT.css", {})
      const darkTypographyVars = {}
      const extractColors = (obj) => {
        Object.entries(obj || {}).forEach(([key, val]) => {
          if (typeof val === "string") {
            const t = val.trim().toLowerCase()
            if (t.startsWith("#") || t.startsWith("rgb") || t.includes("oklch") || t.includes("hsl")) {
              if (key.startsWith("--tw-prose-")) darkTypographyVars[key] = processColor(val, true)
            }
          } else if (val && typeof val === "object") extractColors(val)
        })
      }
      if (Array.isArray(typographyTheme)) typographyTheme.forEach(extractColors)
      else extractColors(typographyTheme)
      if (Object.keys(darkTypographyVars).length > 0) {
        if (darkSelector.startsWith("@media")) addComponents({ [darkSelector]: { [proseSelector]: darkTypographyVars } })
        else addComponents({ [`${darkSelector} ${proseSelector}`]: darkTypographyVars })
      }
    }
  },
  { theme: { extend: { transitionDuration: { nightwind: "400ms" } } } }
)

nightwind.processColor = processColor
module.exports = nightwind
