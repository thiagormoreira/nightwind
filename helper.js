module.exports = {
  init: () => `(function(){try{var m=localStorage.getItem('nightwind-mode'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',m==='dark'||(!m&&d))}catch(e){}})()`,

  beforeTransition: () => {
    const doc = document.documentElement
    doc.classList.add("nightwind")
    const duration = parseFloat(getComputedStyle(doc).getPropertyValue("--nightwind-transition-duration")) || 400
    setTimeout(() => doc.classList.remove("nightwind"), duration + 20)
  },

  toggle: () => {
    module.exports.beforeTransition()
    const isDark = document.documentElement.classList.toggle("dark")
    document.documentElement.classList.toggle("light", !isDark)
    localStorage.setItem("nightwind-mode", isDark ? "dark" : "light")
  },

  enable: (dark) => {
    module.exports.beforeTransition()
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.classList.toggle("light", !dark)
    localStorage.setItem("nightwind-mode", dark ? "dark" : "light")
  },
}
