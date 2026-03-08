const plugin = require("tailwindcss/plugin")

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [
    Math.round(h * 360),
    parseFloat((s * 100).toFixed(1)),
    parseFloat((l * 100).toFixed(1))
  ]
}

/**
 * Parses a color string (Hex, RGB, RGBA, OKLCH, HSL, HSLA) and optionally inverts it.
 */
const processColor = (value, shouldInvert = true, invertMode = "lightness") => {
  if (!value || typeof value !== "string") return value
  const trimmed = value.trim()
  if (trimmed.includes("var(")) return value

  const lowTrimmed = trimmed.toLowerCase()

  if (lowTrimmed.includes("oklch")) {
    if (lowTrimmed.includes("none") || !shouldInvert) return trimmed
    const parts = trimmed.match(/[\d.%]+/g)
    if (!parts || parts.length < 3) return value
    const l = parts[0]
    const lVal = parseFloat(l.endsWith("%")
      ? (100 - parseFloat(l)).toFixed(1)
      : (1 - parseFloat(l)).toFixed(3)
    )
    let res = `oklch(${lVal}${l.endsWith("%") ? "%" : ""} ${parts[1]} ${parts[2]}`
    if (parts[3]) res += ` / ${parts[3]}`
    return res + ")"
  }

  const hslMatch = trimmed.match(/hsla?\(([\d.]+(?:deg|grad|rad|turn)?)[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[,\s\/]+([\d.%]+))?\s*\)/)
  if (hslMatch) {
    if (!shouldInvert) return trimmed
    const h = hslMatch[1]
    const l = parseFloat((100 - parseFloat(hslMatch[3])).toFixed(1))
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
      a = parseFloat((parseInt(hex[3] + hex[3], 16) / 255).toFixed(3))
      hex = hex.slice(0, 3).split("").map(c => c + c).join("")
    } else if (hex.length === 8) {
      a = parseFloat((parseInt(hex.slice(6, 8), 16) / 255).toFixed(3))
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
    if (invertMode === "spectrum") {
      r = 255 - r; g = 255 - g; b = 255 - b
    } else {
      const [h, s, l] = rgbToHsl(r, g, b)
      const invertedL = parseFloat((100 - l).toFixed(1))
      return a !== 1
        ? `hsl(${h} ${s}% ${invertedL}% / ${a})`
        : `hsl(${h} ${s}% ${invertedL}%)`
    }
  }
  return a === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a})`
}

const nightwind = plugin(
  function ({ addBase, addComponents, matchUtilities, theme, config }) {
    const darkModeConfig = config("darkMode", "class")
    const isDarkModeSelector = Array.isArray(darkModeConfig) ? darkModeConfig[0] === "class" : darkModeConfig === "class"
    const darkSelector = isDarkModeSelector
      ? (Array.isArray(darkModeConfig) ? darkModeConfig[1] || ".dark" : ".dark")
      : "@media (prefers-color-scheme: dark)"

    const fixedElementClass = theme("nightwind.fixedClass", "nightwind-prevent")
    const fixedBlockClass = theme("nightwind.fixedBlockClass", "nightwind-prevent-block")
    const transitionDurationValue = theme("nightwind.transitionDuration") === false
      ? false
      : (theme("nightwind.transitionDuration") || "400ms")
    const invertMode = theme("nightwind.invertMode", "lightness")

    // ── transitionClasses ──────────────────────────────────────────────────
    const transitionClasses = theme("nightwind.transitionClasses")
    const transitionPropMap = {
      bg: "background-color",
      text: "color",
      border: "border-color",
      ring: "--tw-ring-color",
      "ring-offset": "--tw-ring-offset-color",
      shadow: "--tw-shadow-color",
      outline: "outline-color",
      decoration: "text-decoration-color",
      accent: "accent-color",
      caret: "caret-color",
      fill: "fill",
      stroke: "stroke",
    }
    const transitionProperty = Array.isArray(transitionClasses) && transitionClasses.length > 0
      ? transitionClasses.map(c => transitionPropMap[c] || c).join(", ")
      : theme("transitionProperty.colors")

    if (transitionDurationValue !== false && transitionDurationValue !== "false") {
      addBase({ ":root": { "--nightwind-transition-duration": transitionDurationValue } })
      addComponents({
        ".nightwind, .nightwind *": {
          "transition-duration": "var(--nightwind-transition-duration)",
          "transition-property": transitionProperty,
          "transition-timing-function": "ease-in-out",
        },
      })
    }

    // ── colorUtilities ─────────────────────────────────────────────────────
    const allColorUtilities = {
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

    const enabledColorClasses = theme("nightwind.colorClasses")
    const colorUtilities = Array.isArray(enabledColorClasses)
      ? Object.fromEntries(
        Object.entries(allColorUtilities).filter(([k]) =>
          enabledColorClasses.includes(k) ||
          (enabledColorClasses.includes("gradient") && ["from", "via", "to"].includes(k))
        )
      )
      : allColorUtilities

    // ── variants ───────────────────────────────────────────────────────────
    const configVariants = theme("nightwind.variants")
    const variantsList = Array.isArray(configVariants)
      ? (configVariants.includes("") ? configVariants : ["", ...configVariants])
      : ["", "hover", "focus", "active", "focus-within", "focus-visible", "disabled"]

    const importantSuffix = config("important") === true ? " !important" : ""

    // ── colorScale ─────────────────────────────────────────────────────────
    const weights = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    const colorScaleConfig = theme("nightwind.colorScale", {})
    const presetScales = {
      reduced: { 50: 900, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 400, 700: 300, 800: 200, 900: 100 }
    }
    const colorScale = colorScaleConfig.preset
      ? (presetScales[colorScaleConfig.preset] || {})
      : colorScaleConfig

    // ── nightwind.colors ───────────────────────────────────────────────────
    const nightwindColors = theme("nightwind.colors") || {}

    const colors = theme("colors") || {}
    const isMediaStrategy = darkSelector.startsWith("@media")

    // Acumulador único — Solução 4 (uma única chamada addComponents)
    const allClasses = {}
    if (isMediaStrategy) allClasses[darkSelector] = {}

    const getGradientValue0 = (val) => {
      if (!val) return val
      const normalized = val.replace(/,\s*/g, " ")
      return normalized.includes("/")
        ? normalized.replace(/\/\s*[\d.%\w]+\s*\)$/, "/ 0)")
        : normalized.replace(/\)$/, " / 0)")
    }

    // ── helper: adiciona seletor ao acumulador ─────────────────────────────
    const addDark = (selector, styles) => {
      if (isMediaStrategy) {
        allClasses[darkSelector][selector] = styles
      } else {
        allClasses[selector] = styles
      }
    }

    const addFixed = (selector, styles) => {
      allClasses[selector] = styles
    }

    // ── loop principal ─────────────────────────────────────────────────────
    Object.entries(colors).forEach(([colorName, colorValue]) => {
      const isStandard = colorValue && typeof colorValue === "object"
      const weightsToProcess = isStandard ? Object.keys(colorValue) : ["DEFAULT"]

      weightsToProcess.forEach(weight => {
        const colorPath = isStandard ? `${colorName}.${weight}` : colorName
        const resolvedValue = theme(`colors.${colorPath}`)
        if (typeof resolvedValue !== "string") return

        // ── Resolve cor invertida via nightwind.colors + colorScale ──────
        let invertedValue = resolvedValue
        let shouldInvertColor = true

        if (isStandard && !isNaN(weight)) {
          const weightNum = Number(weight)
          const weightIndex = weights.indexOf(weightNum)
          const targetColorName = nightwindColors[colorName] || colorName
          const oppositeWeightNum = colorScale[weightNum]
            ?? (weightIndex !== -1 ? weights[weights.length - 1 - weightIndex] : weightNum)

          if (oppositeWeightNum !== weightNum || targetColorName !== colorName) {
            const oppositeColor = theme(`colors.${targetColorName}.${oppositeWeightNum}`)
            if (oppositeColor && typeof oppositeColor === "string") {
              invertedValue = oppositeColor
              shouldInvertColor = false
            }
          }
        } else if (nightwindColors[colorName]) {
          // Mapeamento de cor individual (ex: white: "gray.900")
          const mappedColor = theme(`colors.${nightwindColors[colorName]}`)
          if (mappedColor && typeof mappedColor === "string") {
            invertedValue = mappedColor
            shouldInvertColor = false
          }
        }

        // ── Solução 1: processColor hoistado, calculado UMA vez por peso ─
        const inverted = processColor(invertedValue, shouldInvertColor, invertMode)
        const fixedValue = processColor(resolvedValue, false, invertMode)   // reutilizado abaixo como `res`
        const gradientValue0 = getGradientValue0(inverted)
        const fixedGradientValue0 = getGradientValue0(fixedValue)

        // ── Solução 2: seletores agrupados por variante ──────────────────
        Object.entries(colorUtilities).forEach(([prefix, { prop, suffix }]) => {
          const baseClass = weight === "DEFAULT"
            ? `${prefix}-${colorName}`
            : `${prefix}-${colorName}-${weight}`
          const escapedBase = baseClass.replace(/:/g, "\\:").replace(/\//g, "\\/")
          const sfx = suffix || ""

          // Agrupa todos os seletores dark de todas as variantes em um único key
          const darkSelectorParts = variantsList.map(v => {
            const baseSelector = v === "" ? `.${escapedBase}` : `.${v}\\:${escapedBase}:${v}`
            return isMediaStrategy
              ? baseSelector + sfx
              : `${darkSelector} ${baseSelector + sfx}`
          })
          addDark(darkSelectorParts.join(", "), { [prop]: inverted + importantSuffix })

          // group-hover / peer-focus
          const extras = [
            `.group:hover .group-hover\\:${escapedBase}`,
            `.peer:focus ~ .peer-focus\\:${escapedBase}`
          ]
          const extraDarkParts = extras.map(s =>
            isMediaStrategy ? s + sfx : `${darkSelector} ${s + sfx}`
          )
          addDark(extraDarkParts.join(", "), { [prop]: inverted + importantSuffix })

          // fixed (nightwind-prevent) — UMA entrada, fora do loop de variantes
          addFixed(
            `.${escapedBase}.${fixedElementClass}${sfx}, .${fixedBlockClass} .${escapedBase}${sfx}`,
            { [prop]: fixedValue + importantSuffix }
          )

          // manual dark: override (dark:bg-X)
          if (!isMediaStrategy) {
            const manualSelector = `${darkSelector} .dark\\:${escapedBase}${sfx}`
            allClasses[manualSelector] = { [prop]: fixedValue + importantSuffix }
          }
        })

        // ── Gradientes ───────────────────────────────────────────────────
        const gradientDefs = {
          from: {
            dark: {
              "--tw-gradient-from": inverted,
              "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${gradientValue0})`
            },
            fixed: {
              "--tw-gradient-from": fixedValue,
              "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${fixedGradientValue0})`
            }
          },
          via: {
            dark: { "--tw-gradient-stops": `var(--tw-gradient-from), ${inverted}, var(--tw-gradient-to, ${gradientValue0})` },
            fixed: { "--tw-gradient-stops": `var(--tw-gradient-from), ${fixedValue}, var(--tw-gradient-to, ${fixedGradientValue0})` }
          },
          to: {
            dark: { "--tw-gradient-to": inverted },
            fixed: { "--tw-gradient-to": fixedValue }
          }
        }

        Object.entries(gradientDefs).forEach(([prefix, { dark: darkStyles, fixed: fixedStyles }]) => {
          const baseClass = weight === "DEFAULT" ? `${prefix}-${colorName}` : `${prefix}-${colorName}-${weight}`
          const escapedBase = baseClass.replace(/:/g, "\\:").replace(/\//g, "\\/")

          // Agrupa todas as variantes em um seletor só
          const darkSelectorParts = variantsList.map(v => {
            const sel = v === "" ? `.${escapedBase}` : `.${v}\\:${escapedBase}:${v}`
            return isMediaStrategy ? sel : `${darkSelector} ${sel}`
          })
          addDark(darkSelectorParts.join(", "), darkStyles)

          // fixed
          addFixed(
            `.${escapedBase}.${fixedElementClass}, .${fixedBlockClass} .${escapedBase}`,
            fixedStyles
          )

          // manual override
          if (!isMediaStrategy) {
            allClasses[`${darkSelector} .dark\\:${escapedBase}`] = fixedStyles
          }
        })
      })
    })

    // ── Solução 4: uma única chamada addComponents ─────────────────────────
    addComponents(allClasses)

    // ── matchUtilities (valores arbitrários) ───────────────────────────────
    Object.entries(colorUtilities).forEach(([prefix, { prop, suffix }]) => {
      matchUtilities(
        {
          [prefix]: (value) => {
            if (typeof value !== "string") return null
            const invertedValue = processColor(value, true, invertMode)
            if (invertedValue === value) return null
            const sfx = suffix || ""
            const styles = {}
            if (isMediaStrategy) styles[darkSelector] = { [`&${sfx}`]: { [prop]: invertedValue } }
            else styles[`${darkSelector} &${sfx}`] = { [prop]: invertedValue }
            styles[`&.${fixedElementClass}${sfx}, .${fixedBlockClass} &${sfx}`] = { [prop]: value }
            return styles
          },
        },
        { values: {}, type: "color" }
      )
    })

    // ── Gradient matchUtilities ────────────────────────────────────────────
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
            const inv = processColor(value, true, invertMode)
            if (inv === value) return null
            const inv0 = getGradientValue0(inv)
            const styles = {}
            if (isMediaStrategy) styles[darkSelector] = { "&": buildStyles(inv, inv0) }
            else styles[`${darkSelector} &`] = buildStyles(inv, inv0)
            const resVal = processColor(value, false, invertMode)
            styles[`&.${fixedElementClass}, .${fixedBlockClass} &`] = buildStyles(resVal, getGradientValue0(resVal))
            return styles
          },
        },
        { values: {}, type: "color" }
      )
    })

    // ── Typography ─────────────────────────────────────────────────────────
    if (theme("nightwind.typography") !== false) {
      const proseSelector = theme("nightwind.typographySelector", ".prose")
      const typographyTheme = theme("typography.DEFAULT.css", {})
      const darkTypographyVars = {}
      const extractColors = (obj) => {
        Object.entries(obj || {}).forEach(([key, val]) => {
          if (typeof val === "string") {
            const t = val.trim().toLowerCase()
            if (t.startsWith("#") || t.startsWith("rgb") || t.includes("oklch") || t.includes("hsl")) {
              if (key.startsWith("--tw-prose-")) darkTypographyVars[key] = processColor(val, true, invertMode)
            }
          } else if (val && typeof val === "object") extractColors(val)
        })
      }
      if (Array.isArray(typographyTheme)) typographyTheme.forEach(extractColors)
      else extractColors(typographyTheme)
      if (Object.keys(darkTypographyVars).length > 0) {
        if (isMediaStrategy) addComponents({ [darkSelector]: { [proseSelector]: darkTypographyVars } })
        else addComponents({ [`${darkSelector} ${proseSelector}`]: darkTypographyVars })
      }
    }
  },
  { theme: { extend: { transitionDuration: { nightwind: "400ms" } } } }
)

nightwind.processColor = processColor
module.exports = nightwind
