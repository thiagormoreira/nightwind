/** @jest-environment jsdom */
const helper = require("../helper.js")

describe("nightwind/helper", () => {
  let originalMatchMedia
  let originalLocalStorage

  beforeEach(() => {
    // Mock for localStorage
    const localStorageMock = (() => {
      let store = {}
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
          store[key] = value.toString()
        },
        clear: () => {
          store = {}
        },
      }
    })()

    // Mock for matchMedia
    const matchMediaMock = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    originalMatchMedia = window.matchMedia
    originalLocalStorage = window.localStorage

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    })
    Object.defineProperty(window, "matchMedia", {
      value: matchMediaMock,
      writable: true,
    })

    document.documentElement.className = ""
    document.documentElement.style = ""

    // Reset configuration
    helper.configure({})

    // Mock View Transitions API
    document.startViewTransition = jest.fn().mockImplementation((fn) => {
      fn()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
      }
    })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    window.localStorage = originalLocalStorage
    delete document.startViewTransition
    jest.clearAllMocks()
  })

  describe("configure()", () => {
    it("should merge user config with defaults", () => {
      helper.configure({
        animation: { duration: 800 },
        persistence: false
      })
      // Internal check via side effects (CSS variables)
      expect(document.documentElement.style.getPropertyValue('--nw-anim-duration')).toBe('800ms')
      expect(document.documentElement.style.getPropertyValue('--nightwind-transition-duration')).toBe('400ms')
    })
  })

  describe("init()", () => {
    it("should return the initialization script logic", () => {
      const script = helper.init()
      expect(typeof script).toBe("string")
      expect(script).toContain("nightwind-mode")
    })
  })

  describe("toggle()", () => {
    it("should toggle to 'dark' when current is not 'dark'", () => {
      helper.toggle()
      expect(document.documentElement.classList.contains("dark")).toBe(true)
      expect(window.localStorage.getItem("nightwind-mode")).toBe("dark")
    })

    it("should toggle to 'light' when current is 'dark'", () => {
      document.documentElement.classList.add("dark")
      helper.toggle()
      expect(document.documentElement.classList.contains("dark")).toBe(false)
      expect(window.localStorage.getItem("nightwind-mode")).toBe("light")
    })

    it("should use default animation (fade)", () => {
      helper.toggle()
      expect(document.startViewTransition).toHaveBeenCalled()
    })
  })

  describe("enable()", () => {
    it("should enable 'dark' mode", () => {
      helper.enable(true)
      expect(document.documentElement.classList.contains("dark")).toBe(true)
      expect(window.localStorage.getItem("nightwind-mode")).toBe("dark")
    })

    it("should respect persistence: false", () => {
      helper.configure({ persistence: false })
      helper.enable(true)
      expect(window.localStorage.getItem("nightwind-mode")).toBeNull()
    })
  })

  describe("_animate() - Slide", () => {
    it("should apply slide classes and CSS vars", () => {
      helper.toggle({ animation: 'slide', direction: 'top', duration: 300 })
      expect(document.documentElement.classList.contains('slide-top')).toBe(true)
      expect(document.documentElement.style.getPropertyValue('--nw-anim-duration')).toBe('300ms')
    })

    it("should support all directions", () => {
      ['left', 'right', 'top', 'bottom'].forEach(dir => {
        document.documentElement.className = ""
        helper.toggle({ animation: 'slide', direction: dir })
        expect(document.documentElement.classList.contains(`slide-${dir}`)).toBe(true)
      })
    })
  })

  describe("_animate() - Reveal", () => {
    it("should apply reveal classes and CSS vars", () => {
      helper.toggle({ animation: 'reveal', direction: 'right' })
      expect(document.documentElement.classList.contains('reveal-right')).toBe(true)
      expect(document.documentElement.style.getPropertyValue('--nw-anim-duration')).toBe('600ms')
    })

    it("should invert direction if reverse: true and enabling light mode", () => {
      // Enabling light mode (dark=false)
      helper.enable(false, { animation: 'reveal', direction: 'left', reverse: true })
      expect(document.documentElement.classList.contains('reveal-right')).toBe(true)
    })

    it("should NOT invert direction if reverse: true but enabling dark mode", () => {
      // Enabling dark mode (dark=true)
      helper.enable(true, { animation: 'reveal', direction: 'left', reverse: true })
      expect(document.documentElement.classList.contains('reveal-left')).toBe(true)
    })
  })

  describe("_animate() - Ripple", () => {
    it("should fallback to fade if no event is provided", () => {
      helper.toggle({ animation: 'ripple' })
      expect(document.startViewTransition).toHaveBeenCalled()
      expect(document.documentElement.classList.contains('ripple-transition')).toBe(false)
    })

    it("should expand even if dark=false if reverse: false (default)", async () => {
      const mockEvent = { clientX: 100, clientY: 100 }
      document.documentElement.animate = jest.fn().mockReturnValue({ finished: Promise.resolve() })

      helper.enable(false, { animation: 'ripple', event: mockEvent, reverse: false })

      await Promise.resolve()

      const animateCall = document.documentElement.animate.mock.calls[0]
      expect(animateCall[0].clipPath[0]).toContain('0px') // Still expands
      expect(animateCall[1].pseudoElement).toBe('::view-transition-new(root)')
    })

    it("should contract in ripple if dark=false and reverse=true", async () => {
      const mockEvent = { clientX: 100, clientY: 100 }
      document.documentElement.animate = jest.fn().mockReturnValue({ finished: Promise.resolve() })

      helper.enable(false, { animation: 'ripple', event: mockEvent, reverse: true })

      await Promise.resolve()

      const animateCall = document.documentElement.animate.mock.calls[0]
      expect(animateCall[0].clipPath[1]).toContain('0px') // Contracts to 0
      expect(animateCall[1].pseudoElement).toBe('::view-transition-old(root)')
    })
  })

  describe("fallback", () => {
    it("should use beforeTransition if startViewTransition is missing", () => {
      delete document.startViewTransition
      const spy = jest.spyOn(helper, 'beforeTransition')
      helper.toggle()
      expect(spy).toHaveBeenCalled()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      spy.mockRestore()
    })

    it("should use beforeTransition if animation is 'none'", () => {
      const spy = jest.spyOn(helper, 'beforeTransition')
      helper.toggle({ animation: 'none' })
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})

