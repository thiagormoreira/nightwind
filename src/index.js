const plugin = require("tailwindcss/plugin")

const nightwind = plugin(
  function ({ addBase, addComponents, addUtilities, theme, variants, config }) {
    const darkSelector = ".dark"
    const fixedElementClass = `.${theme("nightwind.fixedClass", "nightwind-prevent")}`
    const fixedBlockClass = `.${theme("nightwind.fixedBlockClass", "nightwind-prevent-block")}`
    const transitionConfig = theme("nightwind.transitionClasses", "default")
    const colors = theme("colors")
    const colorClasses = []
    const transitionClasses = []
    const typographyValues = {}
    const typographyClasses = []
    const colorVariants = ["hover"]
    const prefixes = ["text", "bg", "border", "ring", "ring-offset", "divide", "placeholder", "outline", "decoration", "accent", "caret", "fill", "stroke", "shadow", "from", "via", "to"]
    const weights = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
    let importantSelector = ""
    let importantProperty = ""

    if (variants("nightwind")) {
      typeof variants("nightwind") === "object" ? colorVariants.push(...variants("nightwind")) : colorVariants.push(variants("nightwind"))
    } else if (variants("nightwind.variants")) {
      typeof variants("nightwind.variants") === "object" ? colorVariants.push(...variants("nightwind.variants")) : colorVariants.push(variants("nightwind.variants"))
    }

    if (theme("nightwind.colorClasses")) {
      typeof theme("nightwind.colorClasses") === "object" ? prefixes.push(...theme("nightwind.colorClasses")) : prefixes.push(theme("nightwind.colorClasses"))
      if (theme("nightwind.colorClasses").includes("gradient")) {
        // Gradient already handled in default prefixes now, but keeping for compatibility
        if (!prefixes.includes("from")) prefixes.push(...["from", "via", "to"])
      }
    }

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
      if (h.length == 4) {
        let rh = h[1] + h[1], gh = h[2] + h[2], bh = h[3] + h[3]
        var r = parseInt(rh, 16), g = parseInt(gh, 16), b = parseInt(bh, 16)
      } else if (h.length == 7) {
        var r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
      } else return h
      return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`
    }

    const hexToTailwind = (hex) => {
      let colorCode = ""
      if (hex != "inherit" && hex != "current" && hex != "transparent") {
        Object.keys(colors).forEach((col) => {
          if (typeof theme(`colors.${col}`) === "string") {
            if (hex === theme(`colors.${col}`)) colorCode = col
          } else if (typeof theme(`colors.${col}`) === "object") {
            Object.keys(theme(`colors.${col}`)).forEach((wei) => {
              if (hex === theme(`colors.${col}.${wei}`)) colorCode = col + "-" + wei
            })
          }
        })
      } else colorCode = hex
      return colorCode
    }

    const invertColor = (colorClass) => {
      if (colorClass.includes("white") || colorClass.includes("black")) {
        return {
          colorValue: colorClass.includes("white") ? (theme("nightwind.colors.white") ? (theme("colors." + theme("nightwind.colors.white")) || theme("nightwind.colors.white")) : "#000") : (theme("nightwind.colors.black") ? (theme("colors." + theme("nightwind.colors.black")) || theme("nightwind.colors.black")) : "#fff"),
          defaultColorValue: colorClass.includes("white") ? theme("colors.white") : theme("colors.black"),
        }
      }
      if (colorClass === "inherit" || colorClass === "transparent" || colorClass === "current") return { colorValue: colorClass, defaultColorValue: colorClass }

      const colorValues = colorClass.split("-")
      const weight = colorValues.pop()
      const color = colorValues.pop()
      const defaultValue = theme(`colors.${color}.${weight}`)
      if (!defaultValue) return { colorValue: null, defaultColorValue: null }

      let invertWeightIndex = 9 - weights.indexOf(Number(weight))
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
        const colorMap = theme(`nightwind.colors.${color}`)
        colorValue = theme(`colors.${colorMap}.${invertWeight}`) || theme(`colors.${colorMap}`) || theme(`colors.${color}.${invertWeight}`) || colorMap
      }

      return { colorValue, defaultColorValue: defaultValue }
    }

    // Generate transition classes
    let transitionDurationValue = "400ms"
    if (theme("nightwind.transitionDuration") === false || theme("transitionDuration.nightwind") === false) {
      transitionDurationValue = ""
    } else if (typeof theme("nightwind.transitionDuration") === "string") {
      transitionDurationValue = theme("nightwind.transitionDuration")
    } else if (typeof theme("transitionDuration.nightwind") === "string") {
      transitionDurationValue = theme("transitionDuration.nightwind")
    }

    if (transitionDurationValue) {
      const transitionPrefixes = []
      if (transitionConfig === "full") transitionPrefixes.push(...prefixes)
      else if (typeof transitionConfig === "object" || (typeof transitionConfig === "string" && prefixes.includes(transitionConfig))) {
        typeof transitionConfig === "object" ? transitionPrefixes.push(...transitionConfig) : transitionPrefixes.push(transitionConfig)
      } else transitionPrefixes.push("text", "bg", "border")

      Object.keys(colors).forEach((color) => {
        transitionPrefixes.forEach((prefix) => {
          if (prefix === "from" || prefix === "via" || prefix === "to") return
          if (color == "transparent" || color == "current" || color == "white" || color == "black") {
            const tc = {
              [`${config("important") ? importantSelector : ""}.nightwind .${prefix}-${color}`]: { transitionDuration: transitionDurationValue, transitionProperty: theme("transitionProperty.colors"), transitionTimingFunction: "ease-in-out" },
              [`${config("important") ? importantSelector : ""}.nightwind .dark\\:${prefix}-${color}`]: { transitionDuration: transitionDurationValue, transitionProperty: theme("transitionProperty.colors"), transitionTimingFunction: "ease-in-out" },
            }
            transitionClasses.push(tc)
          } else {
            weights.forEach((weight) => {
              const tc = {
                [`${config("important") ? importantSelector : ""}.nightwind .${prefix}-${color}-${weight}`]: { transitionDuration: transitionDurationValue, transitionProperty: theme("transitionProperty.colors"), transitionTimingFunction: "ease-in-out" },
                [`${config("important") ? importantSelector : ""}.nightwind .dark\\:${prefix}-${color}-${weight}`]: { transitionDuration: transitionDurationValue, transitionProperty: theme("transitionProperty.colors"), transitionTimingFunction: "ease-in-out" },
              }
              transitionClasses.push(tc)
            })
          }
        })
      })
    }

    // Compose colors
    prefixes.forEach((prefix) => {
      Object.keys(colors).forEach((color) => {
        if (color == "white" || color == "black") {
          colorClasses.push(`${prefix}-${color}`)
          colorVariants.forEach(v => colorClasses.push(`${v}\\:${prefix}-${color}`))
        } else if (typeof colors[color] === "object") {
          weights.forEach((weight) => {
            colorClasses.push(`${prefix}-${color}-${weight}`)
            colorVariants.forEach(v => colorClasses.push(`${v}\\:${prefix}-${color}-${weight}`))
          })
        }
      })
    })

    const nightwindClasses = colorClasses.map((colorClass) => {
      let pseudoVariant = ""
      colorVariants.forEach((v) => { if (colorClass.includes(v)) pseudoVariant = (v == "last" || v == "first") ? ":" + v + "-child" : (v == "odd") ? ":nth-child(odd)" : (v == "even") ? ":nth-child(2n)" : (v == "group-hover") ? "" : ":" + v })

      const invertResults = invertColor(colorClass)
      let colorValue = invertResults.colorValue
      let defaultColorValue = invertResults.defaultColorValue
      if (!colorValue) return null

      let cleanClass = colorClass.replace(/\\/g, "")

      const generateClass = (prefix, property, selectorSuffix = "") => {
        const twOpacityVar = `var(--tw-${prefix}, 1)`
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${selectorSuffix}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${selectorSuffix}`
        return {
          [selector]: { [property]: hexToRGB(colorValue, twOpacityVar) + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}${selectorSuffix}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}${selectorSuffix}`]: { [property]: hexToRGB(defaultColorValue, twOpacityVar) + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}${selectorSuffix}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}${selectorSuffix}`]: { [property]: hexToRGB(defaultColorValue, twOpacityVar) + importantProperty }
        }
      }

      if (colorClass.includes("ring-offset-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "--tw-ring-offset-color": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "--tw-ring-offset-color": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "--tw-ring-offset-color": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("ring-")) return generateClass("ring-opacity", "--tw-ring-color")
      if (colorClass.includes("divide-")) {
        const twOpacityVar = `var(--tw-divide-opacity, 1)`
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant} > :not([hidden]) ~ :not([hidden]), ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant} > :not([hidden]) ~ :not([hidden])`
        return {
          [selector]: { borderColor: hexToRGB(colorValue, twOpacityVar) + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass} > :not([hidden]) ~ :not([hidden]), ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass} > :not([hidden]) ~ :not([hidden])`]: { borderColor: hexToRGB(defaultColorValue, twOpacityVar) + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant} > :not([hidden]) ~ :not([hidden]), ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant} > :not([hidden]) ~ :not([hidden])`]: { borderColor: hexToRGB(defaultColorValue, twOpacityVar) + importantProperty }
        }
      }
      if (colorClass.includes("placeholder-")) {
        const twOpacityVar = `var(--tw-placeholder-opacity, 1)`
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}::placeholder, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}::placeholder`
        return {
          [selector]: { color: hexToRGB(colorValue, twOpacityVar) + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}::placeholder, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}::placeholder`]: { color: hexToRGB(defaultColorValue, twOpacityVar) + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}::placeholder, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}::placeholder`]: { color: hexToRGB(defaultColorValue, twOpacityVar) + importantProperty }
        }
      }
      if (colorClass.includes("text-")) return generateClass("text-opacity", "color")
      if (colorClass.includes("bg-")) return generateClass("bg-opacity", "backgroundColor")
      if (colorClass.includes("border-")) return generateClass("border-opacity", "borderColor")
      if (colorClass.includes("ring-")) return generateClass("ring-opacity", "--tw-ring-color")
      if (colorClass.includes("outline-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "outlineColor": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "outlineColor": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "outlineColor": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("decoration-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "textDecorationColor": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "textDecorationColor": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "textDecorationColor": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("accent-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "accentColor": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "accentColor": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "accentColor": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("caret-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "caretColor": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "caretColor": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "caretColor": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("fill-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "fill": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "fill": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "fill": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("stroke-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "stroke": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "stroke": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "stroke": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("shadow-")) {
        const selector = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [selector]: { "--tw-shadow-color": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "--tw-shadow-color": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "--tw-shadow-color": defaultColorValue + importantProperty }
        }
      }
      if (colorClass.includes("from-")) {
        const s = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [s]: { "--tw-gradient-from": colorValue + importantProperty, "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${hexToRGB(colorValue, "0")})` + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "--tw-gradient-from": defaultColorValue + importantProperty, "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${hexToRGB(defaultColorValue, "0")})` + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "--tw-gradient-from": defaultColorValue + importantProperty, "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to, ${hexToRGB(defaultColorValue, "0")})` + importantProperty }
        }
      }
      if (colorClass.includes("via-")) {
        const s = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [s]: { "--tw-gradient-stops": `var(--tw-gradient-from), ${colorValue}, var(--tw-gradient-to, ${hexToRGB(colorValue, "0")})` + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "--tw-gradient-stops": `var(--tw-gradient-from), ${defaultColorValue}, var(--tw-gradient-to, ${hexToRGB(defaultColorValue, "0")})` + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "--tw-gradient-stops": `var(--tw-gradient-from), ${defaultColorValue}, var(--tw-gradient-to, ${hexToRGB(defaultColorValue, "0")})` + importantProperty }
        }
      }
      if (colorClass.includes("to-")) {
        const s = `${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}`
        return {
          [s]: { "--tw-gradient-to": colorValue + importantProperty },
          [`${importantSelector}${darkSelector} .${colorClass}${pseudoVariant}${fixedElementClass}, ${importantSelector}${darkSelector} [class*="${cleanClass}/"]${pseudoVariant}${fixedElementClass}`]: { "--tw-gradient-to": defaultColorValue + importantProperty },
          [`${importantSelector}${darkSelector} ${fixedBlockClass} .${colorClass}${pseudoVariant}, ${importantSelector}${darkSelector} ${fixedBlockClass} [class*="${cleanClass}/"]${pseudoVariant}`]: { "--tw-gradient-to": defaultColorValue + importantProperty }
        }
      }
      return null
    }).filter(Boolean)

    if (theme("nightwind.typography")) {
      Object.keys(theme("typography") || {}).forEach((modifier) => {
        const css = theme(`typography.${modifier}.css`) || []
        css.forEach(n => {
          Object.keys(n).forEach(classname => {
            const colorProp = Object.keys(n[classname]).find(p => p.includes("color") || p.includes("Color"))
            if (colorProp) {
              const colorVal = hexToTailwind(n[classname][colorProp])
              if (!typographyValues[modifier]) typographyValues[modifier] = {}
              if (!typographyValues[modifier][classname]) typographyValues[modifier][classname] = {}
              typographyValues[modifier][classname][colorProp] = colorVal
            }
          })
        })
      })

      Object.keys(typographyValues).forEach((modifier) => {
        Object.keys(typographyValues[modifier]).forEach((classname) => {
          Object.keys(typographyValues[modifier][classname]).forEach((property) => {
            const invertResults = invertColor(typographyValues[modifier][classname][property])
            const colorValue = invertResults.colorValue || typographyValues[modifier][classname][property]
            const defaultColorValue = invertResults.defaultColorValue
            const s = `${importantSelector}${darkSelector} .${classname}${modifier !== "DEFAULT" ? `-${modifier}` : ""}`
            typographyClasses.push({ [s]: { [property]: colorValue }, [`${s}${fixedElementClass}`]: { [property]: defaultColorValue } })
          })
        })
      })
    }

    addComponents(nightwindClasses)
    addComponents(typographyClasses)
    theme("nightwind.importantNode") ? addComponents(transitionClasses) : addUtilities(transitionClasses)
  },
  { theme: { extend: { transitionDuration: { 0: "0ms" } } } }
)

module.exports = nightwind
