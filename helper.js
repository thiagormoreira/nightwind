const DEFAULT_CONFIG = {
  animation: {
    default: 'fade',
    duration: 600,
    easing: 'cubic-bezier(0.7, 0, 0.3, 1)',
    reverse: false,
    slide: { direction: 'left' },
  },
  transition: {
    duration: 400,
    easing: 'ease-in-out',
  },
  persistence: true,
  storageKey: 'nightwind-mode',
}

let _config = { ...DEFAULT_CONFIG }

module.exports = {

  // ─── Inicialização ──────────────────────────────────────────────
  init: () => {
    return `(function(){function f(){const p=window.localStorage.getItem('nightwind-mode');if(p)return p;return window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}if(f()==='dark')document.documentElement.classList.add('dark')})()`
  },

  // ─── Configuração ────────────────────────────────────────────────
  configure: (userConfig = {}) => {
    _config = deepMerge(DEFAULT_CONFIG, userConfig)
    const root = document.documentElement
    root.style.setProperty("--nw-anim-duration", `${_config.animation.duration}ms`)
    root.style.setProperty("--nw-anim-easing", _config.animation.easing)
    root.style.setProperty("--nightwind-transition-duration", `${_config.transition.duration}ms`)
  },

  // ─── Helper de transição ─────────────────────────────────────────
  beforeTransition: () => {
    const doc = document.documentElement
    doc.classList.add("nightwind")
    const duration =
      parseFloat(getComputedStyle(doc).getPropertyValue("--nightwind-transition-duration")) || 400
    setTimeout(() => {
      doc.classList.remove("nightwind")
    }, duration + 20)
  },

  // ─── Toggle principal ────────────────────────────────────────────
  toggle: (options = {}) => {
    const isDark = document.documentElement.classList.contains("dark")
    module.exports.enable(!isDark, options)
  },

  // ─── Enable específico ───────────────────────────────────────────
  enable: (dark, options = {}) => {
    const applyChange = () => {
      const doc = document.documentElement
      doc.classList.toggle("dark", dark)
      doc.classList.toggle("light", !dark)
      if (_config.persistence) {
        localStorage.setItem(_config.storageKey, dark ? "dark" : "light")
      }
    }

    module.exports._animate(applyChange, options, dark)
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
      module.exports.beforeTransition()
      applyChange()
      return
    }

    // ── Fade ──────────────────────────────────────────────────────
    if (animation === "fade") {
      document.startViewTransition(applyChange)
      return
    }

    // ── Slide ─────────────────────────────────────────────────────
    if (animation === "slide") {
      const direction = getDirection()
      const cls = `slide-${direction}`

      doc.style.setProperty("--nw-anim-duration", `${duration}ms`)
      doc.style.setProperty("--nw-anim-easing", easing)

      doc.classList.add(cls)
      const transition = document.startViewTransition(applyChange)
      transition.finished.finally(() => doc.classList.remove(cls))
      return
    }

    // ── Reveal (Slide sem mover conteúdo) ────────────────────────
    if (animation === "reveal") {
      const direction = getDirection()
      const cls = `reveal-${direction}`

      doc.style.setProperty("--nw-anim-duration", `${duration}ms`)
      doc.style.setProperty("--nw-anim-easing", easing)

      doc.classList.add(cls)
      const transition = document.startViewTransition(applyChange)
      transition.finished.finally(() => doc.classList.remove(cls))
      return
    }

    // ── Ripple ────────────────────────────────────────────────────
    if (animation === "ripple") {
      if (!event) {
        document.startViewTransition(applyChange)
        return
      }

      const { clientX: x, clientY: y } = event
      // Se reverse=true: dark=true expa, dark=false enco. Se reverse=false: sempre expa.
      const isExpand = reverse ? dark : true

      doc.classList.add("ripple-transition")
      if (!isExpand) doc.classList.add("ripple-reverse")

      const transition = document.startViewTransition(applyChange)

      transition.finished.finally(() => {
        doc.classList.remove("ripple-transition")
        doc.classList.remove("ripple-reverse")
      })

      transition.ready.then(() => {
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
        const fromCircle = `circle(0px at ${x}px ${y}px)`
        const toCircle = `circle(${radius}px at ${x}px ${y}px)`

        doc.animate(
          {
            clipPath: isExpand ? [fromCircle, toCircle] : [toCircle, fromCircle],
          },
          {
            duration,
            easing,
            fill: "forwards",
            pseudoElement: isExpand ? "::view-transition-new(root)" : "::view-transition-old(root)",
          }
        )
      })
      return
    }
  },
}



// ─── Utilitário de merge profundo ──────────────────────────────────
function deepMerge(base, override) {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key])
    ) {
      result[key] = deepMerge(base[key] ?? {}, override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}

