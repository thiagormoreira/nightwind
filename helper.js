module.exports = {
  init: () => `(function(){try{var m=localStorage.getItem('nightwind-mode'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',m==='dark'||(!m&&d))}catch(e){}})()`,

  beforeTransition: () => {
    const doc = document.documentElement
    doc.classList.add("nightwind")
    const duration = parseFloat(getComputedStyle(doc).getPropertyValue("--nightwind-transition-duration")) || 400
    setTimeout(() => doc.classList.remove("nightwind"), duration + 20)
  },

  toggle: (options = {}) => {
    const { animation = 'fade', event = null } = options
    const doc = document.documentElement

    // Função pura — SEM lógica de transição aqui dentro
    const applyChange = () => {
      const isDark = doc.classList.toggle('dark')
      doc.classList.toggle('light', !isDark)
      localStorage.setItem('nightwind-mode', isDark ? 'dark' : 'light')
    }

    // Fallback: sem View Transitions ou animação desativada
    if (!document.startViewTransition || animation === 'none') {
      module.exports.beforeTransition() // ← chamado UMA vez, aqui
      applyChange()
      return
    }

    // Ripple
    if (animation === 'ripple' && event) {
      const { clientX: x, clientY: y } = event
      doc.classList.add('ripple-transition')
      const transition = document.startViewTransition(applyChange)
      transition.finished.finally(() => doc.classList.remove('ripple-transition'))
      transition.ready.then(() => {
        const radius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )
        doc.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
        )
      })
      return
    }

    // Fade (default)
    document.startViewTransition(applyChange)
  },

  enable: (dark, options = {}) => {
    const { animation = 'fade' } = options
    const doc = document.documentElement

    const applyChange = () => {
      doc.classList.toggle('dark', dark)
      doc.classList.toggle('light', !dark)
      localStorage.setItem('nightwind-mode', dark ? 'dark' : 'light')
    }

    if (!document.startViewTransition || animation === 'none') {
      module.exports.beforeTransition() // ← UMA vez
      applyChange()
      return
    }

    document.startViewTransition(applyChange)
  },
}
