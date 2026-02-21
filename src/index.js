const plugin = require("tailwindcss/plugin")

const invertColorValue = (value) => {
  if (!value || typeof value !== "string") return value
  if (value.startsWith("#")) {
    let hex = value.slice(1)
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("")
    if (hex.length === 6) {
      const r = 255 - parseInt(hex.slice(0, 2), 16)
      const g = 255 - parseInt(hex.slice(2, 4), 16)
      const b = 255 - parseInt(hex.slice(4, 6), 16)
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (rgbMatch) {
    const r = 255 - parseInt(rgbMatch[1])
    const g = 255 - parseInt(rgbMatch[2])
    const b = 255 - parseInt(rgbMatch[3])
    const a = rgbMatch[4]
    return a ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`
  }
  return value
}

const nightwind = plugin(
  function ({ addBase, addComponents, addUtilities, matchUtilities, theme, variants, config }) {
    const darkSelector = ".dark"
    const fixedElementClass = `${theme("nightwind.fixedClass", "nightwind-prevent")}`
    const fixedBlockClass = `${theme("nightwind.fixedBlockClass", "nightwind-prevent-block")}`
    const transitionConfig = theme("nightwind.transitionClasses", "default")
    const colors = theme("colors")
    const weights = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
    let importantSelector = ""
    let importantProperty = ""

    if (config("important")) {
      if (typeof config("important") === "string") {
        importantSelector = `${config("important")}${theme("nightwind.importantNode") ? "" : " "}`
      }
      if (config("important") === true) {
        importantProperty = " !important"
      }
    }

    function hexToRGB(h, alpha) {
      if (!h || h.includes("var(--")) return h
      let r, g, b
      if (h.length == 4) {
        let rh = h[1] + h[1], gh = h[2] + h[2], bh = h[3] + h[3]
        r = parseInt(rh, 16), g = parseInt(gh, 16), b = parseInt(bh, 16)
      } else if (h.length == 7) {
        r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
      } else return h
      return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`
    }

    const invertColor = (colorClass) => {
      if (colorClass.includes("white") || colorClass.includes("black")) {
        return {
          colorValue: colorClass.includes("white") ? (theme("nightwind.colors.white") ? (theme("colors." + theme("nightwind.colors.white")) || theme("nightwind.colors.white")) : "#000") : (theme("nightwind.colors.black") ? (theme("colors." + theme("nightwind.colors.black")) || theme("nightwind.colors.black")) : "#fff"),
          defaultColorValue: colorClass.includes("white") ? theme("colors.white") : theme("colors.black"),
        }
      }
      if (["inherit", "transparent", "current"].includes(colorClass)) return { colorValue: colorClass, defaultColorValue: colorClass }

      const colorValues = colorClass.split("-")
      const weight = colorValues.pop()
      const color = colorValues.join("-")
      const defaultValue = theme(`colors.${color}.${weight}`)
      if (!defaultValue) return { colorValue: null, defaultColorValue: null }

      let invertWeightIndex = weights.indexOf(Number(weight))
      if (invertWeightIndex === -1) return { colorValue: null, defaultColorValue: null }
      invertWeightIndex = 9 - invertWeightIndex
      let invertWeight = String(weights[invertWeightIndex])

      if (theme("nightwind.colorScale.preset") === "reduced") {
        let ri = 10 - weights.indexOf(Number(weight)); invertWeight = String(weights[ri > 9 ? 9 : ri])
      } else if (theme(`nightwind.colorScale.${weight}`)) {
        invertWeight = String(theme(`nightwind.colorScale.${weight}`))
      }

      let colorValue = theme(`colors.${color}.${invertWeight}`)
      if (theme(`nightwind.colors.${color}.${weight}`)) {
        colorValue = theme(`colors.${theme(`nightwind.colors.${color}.${weight}`)}`) || theme(`nightwind.colors.${color}.${weight}`)
      } else if (theme(`nightwind.colors.${color}`) && typeof theme(`nightwind.colors.${color}`) === "string") {
        const colorMapSetting = theme(`nightwind.colors.${color}`)
        colorValue = theme(`colors.${colorMapSetting}.${invertWeight}`) || theme(`colors.${colorMapSetting}`) || theme(`colors.${color}.${invertWeight}`) || colorMapSetting
      }

      return { colorValue, defaultColorValue: defaultValue }
    }

    let transitionDurationValue = "400ms"
    if (theme("nightwind.transitionDuration") === false || theme("transitionDuration.nightwind") === false) {
      transitionDurationValue = ""
    } else if (typeof theme("nightwind.transitionDuration") === "string") {
      transitionDurationValue = theme("nightwind.transitionDuration")
    } else if (typeof theme("transitionDuration.nightwind") === "string") {
      transitionDurationValue = theme("transitionDuration.nightwind")
    }

    if (transitionDurationValue) {
      addBase({ ":root": { "--nightwind-transition-duration": transitionDurationValue } })
    }

    const prefixes = ["text", "bg", "border", "ring", "ring-offset", "divide", "placeholder", "outline", "decoration", "accent", "caret", "fill", "stroke", "shadow", "from", "via", "to"]
    const variantsList = ["", "hover", "focus", "active", "focus-within", "focus-visible", "disabled", "group-hover", "peer-focus"]

    const properties = {
      text: { prop: "color", opacity: "--tw-text-opacity" },
      bg: { prop: "backgroundColor", opacity: "--tw-bg-opacity" },
      border: { prop: "borderColor", opacity: "--tw-border-opacity" },
      ring: { prop: "--tw-ring-color", opacity: "--tw-ring-opacity" },
      "ring-offset": { prop: "--tw-ring-offset-color" },
      outline: { prop: "outlineColor" },
      decoration: { prop: "textDecorationColor" },
      accent: { prop: "accentColor" },
      caret: { prop: "caretColor" },
      fill: { prop: "fill" },
      stroke: { prop: "stroke" },
      shadow: { prop: "--tw-shadow-color" },
      divide: { prop: "borderColor", suffix: " > :not([hidden]) ~ :not([hidden])", opacity: "--tw-divide-opacity" },
      placeholder: { prop: "color", suffix: "::placeholder", opacity: "--tw-placeholder-opacity" },
      from: { prop: "--tw-gradient-from", stops: true },
      via: { prop: "--tw-gradient-stops", via: true },
      to: { prop: "--tw-gradient-to" }
    }

    const nightwindClasses = {}

    Object.keys(colors).forEach(c => {
      const isStandard = !["transparent", "current", "inherit", "white", "black"].includes(c)
      const weightsToProcess = isStandard ? weights : ["DEFAULT"]

      weightsToProcess.forEach(w => {
        const colorClass = isStandard ? `${c}-${w}` : c
        const invertResults = invertColor(colorClass)
        if (!invertResults.colorValue) return

        prefixes.forEach(p => {
          const config = properties[p]
          if (!config) return
          const val = config.opacity ? hexToRGB(invertResults.colorValue, `var(${config.opacity}, 1)`) : invertResults.colorValue
          const defVal = config.opacity ? hexToRGB(invertResults.defaultColorValue, `var(${config.opacity}, 1)`) : invertResults.defaultColorValue

          variantsList.forEach(v => {
            const baseClass = `${p}-${colorClass}`
            let selector = ""
            if (v === "") selector = `.${baseClass}`
            else if (v.startsWith("group-")) selector = `.group:${v.replace("group-", "")} .${v}\\:${baseClass}`
            else if (v.startsWith("peer-")) selector = `.peer:${v.replace("peer-", "")} ~ .${v}\\:${baseClass}`
            else selector = `.${v}\\:${baseClass}:${v}`

            if (config.suffix) selector += config.suffix

            const s = `${importantSelector}${darkSelector} ${selector}`
            const preventS = `${s}.${fixedElementClass}, ${importantSelector}${darkSelector} .${fixedBlockClass} ${selector}`

            if (config.stops) {
              nightwindClasses[s] = { "--tw-gradient-from": val + importantProperty, "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${hexToRGB(val, "0")})` + importantProperty }
              nightwindClasses[preventS] = { "--tw-gradient-from": defVal + importantProperty, "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${hexToRGB(defVal, "0")})` + importantProperty }
            } else if (config.via) {
              nightwindClasses[s] = { "--tw-gradient-stops": `var(--tw-gradient-from), ${val}, var(--tw-gradient-to, ${hexToRGB(val, "0")})` + importantProperty }
              nightwindClasses[preventS] = { "--tw-gradient-stops": `var(--tw-gradient-from), ${defVal}, var(--tw-gradient-to, ${hexToRGB(defVal, "0")})` + importantProperty }
            } else {
              nightwindClasses[s] = { [config.prop]: val + importantProperty }
              nightwindClasses[preventS] = { [config.prop]: defVal + importantProperty }
            }

            // Transition classes
            if (v === "" && transitionDurationValue && (transitionConfig === "full" || (Array.isArray(transitionConfig) && transitionConfig.includes(p)) || (transitionConfig === "default" && ["text", "bg", "border"].includes(p)))) {
              const transS = `${importantSelector}.nightwind .${baseClass}, ${importantSelector}.nightwind .dark\\:${baseClass}`
              nightwindClasses[transS] = { transitionDuration: transitionDurationValue, transitionProperty: theme("transitionProperty.colors"), transitionTimingFunction: "ease-in-out" }
            }
          })
        })
      })
    })

    addComponents(nightwindClasses)

    // Arbitrary colors support - Dynamic
    const arbitraryPrefixes = {
      text: "color", bg: "backgroundColor", border: "borderColor", ring: "--tw-ring-color", outline: "outlineColor", decoration: "textDecorationColor", accent: "accentColor", caret: "caretColor", fill: "fill", stroke: "stroke"
    }
    Object.keys(arbitraryPrefixes).forEach((prefix) => {
      matchUtilities(
        {
          [prefix]: (value) => {
            if (typeof value !== "string") return null
            const inverted = invertColorValue(value)
            if (inverted === value) return null
            return { [`${darkSelector} &`]: { [arbitraryPrefixes[prefix]]: inverted + importantProperty } }
          },
        },
        { values: {}, type: "color" }
      )
    })

    if (theme("nightwind.typography")) {
      const typographyValues = {}
      Object.keys(theme("typography") || {}).forEach((modifier) => {
        const css = theme(`typography.${modifier}.css`) || []
        css.forEach(n => {
          Object.keys(n).forEach(classname => {
            const colorProp = Object.keys(n[classname]).find(p => p.includes("color") || p.includes("Color"))
            if (colorProp) {
              const invertResults = invertColor(n[classname][colorProp])
              const colorValue = invertResults.colorValue || n[classname][colorProp]
              const defaultColorValue = invertResults.defaultColorValue
              const s = `${importantSelector}${darkSelector} .${classname}${modifier !== "DEFAULT" ? `-${modifier}` : ""}`
              addComponents({ [s]: { [colorProp]: colorValue }, [`${s}.${fixedElementClass}`]: { [colorProp]: defaultColorValue } })
            }
          })
        })
      })
    }
  },
  { theme: { extend: { transitionDuration: { 0: "0ms" } } } }
)

module.exports = nightwind
