const _config = {
  animation: {
    default: "fade",
    duration: 600,
    easing: "cubic-bezier(0.7, 0, 0.3, 1)",
    reverse: false,
    slide: {
      direction: "left",
    },
  },
  transition: {
    duration: 400,
    easing: "ease-in-out",
  },
  persistence: true,
  storageKey: "nightwind-mode",
}

const DEFAULT_CONFIG = {
  animation: {
    default: "fade",
    duration: 600,
    easing: "cubic-bezier(0.7, 0, 0.3, 1)",
    reverse: false,
    slide: {
      direction: "left",
    },
  },
  transition: {
    duration: 400,
    easing: "ease-in-out",
  },
  persistence: true,
  storageKey: "nightwind-mode",
}

// Deep merge for internal config
const deepMerge = (target, source) => {
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
}

const nightwind = {
  init: () => {
    return `(function() {
      try {
        const config = ${JSON.stringify(DEFAULT_CONFIG)};
        const storageKey = config.storageKey;
        const persistence = config.persistence;
        let dark = false;
        if (persistence) {
          const stored = localStorage.getItem(storageKey);
          if (stored) dark = stored === 'dark';
          else dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        if (dark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })()`
  },

  configure: (userConfig) => {
    deepMerge(_config, userConfig)
    const doc = document.documentElement
    doc.style.setProperty("--nightwind-transition-duration", `${_config.transition.duration}ms`)
    doc.style.setProperty("--nightwind-transition-easing", _config.transition.easing)
  },

  enable: (dark, options = {}) => {
    const applyChange = () => {
      const doc = document.documentElement
      if (dark) {
        doc.classList.add("dark")
        doc.classList.remove("light")
      } else {
        doc.classList.remove("dark")
        doc.classList.add("light")
      }
      if (_config.persistence) {
        localStorage.setItem(_config.storageKey, dark ? "dark" : "light")
      }
    }

    nightwind._animate(applyChange, options, dark)
  },

  toggle: (options = {}) => {
    const dark = !document.documentElement.classList.contains("dark")
    nightwind.enable(dark, options)
  },

  beforeTransition: () => {
    const doc = document.documentElement
    doc.classList.add("nightwind")
    setTimeout(() => {
      doc.classList.remove("nightwind")
    }, _config.transition.duration)
  },

  // ─── Motor de animação ───────────────────────────────────────────
  _animate: (applyChange, options = {}, dark = true) => {
    const doc = document.documentElement
    const animation = options.animation ?? _config.animation.default
    const duration = options.duration ?? _config.animation.duration
    const easing = options.easing ?? _config.animation.easing
    const reverse = options.reverse ?? _config.animation.reverse
    const event = options.event ?? null

    // Helper para inverter direção
    const getDirection = () => {
      const dir = options.direction ?? _config.animation.slide.direction
      if (!reverse || dark) return dir
      const opposites = { left: "right", right: "left", top: "bottom", bottom: "top" }
      return opposites[dir] || dir
    }

    // Sem suporte ou animação desativada
    if (!document.startViewTransition || animation === "none") {
      nightwind.beforeTransition()
      applyChange()
      return
    }

    // Configurar variáveis CSS comuns
    doc.style.setProperty("--nw-anim-duration", `${duration}ms`)
    doc.style.setProperty("--nw-anim-easing", easing)

    // ── Fade ──────────────────────────────────────────────────────
    if (animation === "fade") {
      doc.classList.add("fade")
      const transition = document.startViewTransition(applyChange)
      transition.finished.finally(() => doc.classList.remove("fade"))
      return
    }

    // ── Directional Animations (Slide, Reveal) ────────────────────
    const directional = ["slide", "reveal"]
    if (directional.includes(animation)) {
      const direction = getDirection()
      const cls = `${animation}-${direction}`
      doc.classList.add(cls)
      const transition = document.startViewTransition(applyChange)
      transition.finished.finally(() => doc.classList.remove(cls))
      return
    }

    // ── Generic Animations (Zoom, Flip, Rotate, Wipe, Iris, etc.) ───
    const generics = ["zoom", "flip", "rotate", "wipe", "iris", "blur", "dissolve", "corner-wipe"]
    if (generics.includes(animation)) {
      doc.classList.add(animation)
      const transition = document.startViewTransition(applyChange)
      transition.finished.finally(() => doc.classList.remove(animation))
      return
    }

    // ── Ripple ────────────────────────────────────────────────────
    if (animation === "ripple") {
      if (!event) {
        document.startViewTransition(applyChange)
        return
      }

      const { clientX: x, clientY: y } = event
      const isExpand = reverse ? dark : true

      doc.classList.add("ripple-transition")
      if (!isExpand) doc.classList.add("ripple-reverse")
      doc.style.setProperty("--nw-ripple-x", `${x}px`)
      doc.style.setProperty("--nw-ripple-y", `${y}px`)

      const transition = document.startViewTransition(applyChange)

      transition.ready.then(() => {
        const keyframes = isExpand
          ? [
            { clipPath: `circle(0% at ${x}px ${y}px)` },
            { clipPath: `circle(150% at ${x}px ${y}px)` },
          ]
          : [
            { clipPath: `circle(150% at ${x}px ${y}px)` },
            { clipPath: `circle(0% at ${x}px ${y}px)` },
          ]

        const pseudo = isExpand ? "::view-transition-new(root)" : "::view-transition-old(root)"
        document.documentElement.animate(keyframes, {
          duration,
          easing,
          fill: "forwards",
          pseudoElement: pseudo,
        })
      })

      transition.finished.finally(() => {
        doc.classList.remove("ripple-transition")
        doc.classList.remove("ripple-reverse")
      })
    }
  },
}

deepMerge(_config, DEFAULT_CONFIG)

module.exports = nightwind
