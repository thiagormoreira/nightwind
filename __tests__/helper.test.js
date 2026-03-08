/** @jest-environment jsdom */
let helper

describe("nightwind/helper", () => {
  let originalMatchMedia
  let originalLocalStorage

  beforeEach(() => {
    jest.resetModules()
    helper = require("../helper.js")

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
      configurable: true,
    })
    Object.defineProperty(window, "matchMedia", {
      value: matchMediaMock,
      writable: true,
      configurable: true,
    })

    document.documentElement.className = ""
    document.documentElement.style.cssText = ""

    // Mock View Transitions API
    document.startViewTransition = jest.fn().mockImplementation((fn) => {
      fn()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
      }
    })

    // Reset configuration (force 600ms)
    helper.configure({ animation: { duration: 600 } })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    window.localStorage = originalLocalStorage
    jest.restoreAllMocks()
  })

  describe("init()", () => {
    it("should return a script string", () => {
      const script = helper.init()
      expect(typeof script).toBe("string")
      expect(script).toContain("function()")
    })
  })

  describe("configure()", () => {
    it("should update transition duration", () => {
      helper.configure({ transition: { duration: 500 } })
      expect(document.documentElement.style.getPropertyValue("--nightwind-transition-duration")).toBe("500ms")
    })
  })

  describe("enable()", () => {
    it("should add dark class and save to localStorage", () => {
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

  describe("toggle()", () => {
    it("should toggle between light and dark", () => {
      helper.toggle()
      expect(document.documentElement.classList.contains("dark")).toBe(true)
      helper.toggle()
      expect(document.documentElement.classList.contains("dark")).toBe(false)
    })
  })

  describe("_animate() - Reveal", () => {
    it("should apply reveal classes and CSS vars", () => {
      helper.toggle({ animation: "reveal", direction: "right" })
      expect(document.documentElement.classList.contains("reveal-right")).toBe(true)
      expect(document.documentElement.style.getPropertyValue("--nw-anim-duration")).toBe("600ms")
    })

    it("should swap direction if reverse: true and enabling light mode", () => {
      // Enabling light mode (dark=false)
      helper.enable(false, { animation: "reveal", direction: "left", reverse: true })
      expect(document.documentElement.classList.contains("reveal-right")).toBe(true)
    })

    it("should NOT invert direction if reverse: true but enabling dark mode", () => {
      // Enabling dark mode (dark=true)
      helper.enable(true, { animation: "reveal", direction: "left", reverse: true })
      expect(document.documentElement.classList.contains("reveal-left")).toBe(true)
    })
  })

  describe("_animate() - Ripple", () => {
    it("should fallback to fade if no event is provided", () => {
      helper.toggle({ animation: "ripple" })
      expect(document.startViewTransition).toHaveBeenCalled()
      expect(document.documentElement.classList.contains("ripple-transition")).toBe(false)
    })

    it("should expand even if dark=false if reverse: false (default)", async () => {
      const mockEvent = { clientX: 100, clientY: 100 }
      document.documentElement.animate = jest.fn().mockReturnValue({ finished: Promise.resolve() })

      helper.enable(false, { animation: "ripple", event: mockEvent, reverse: false })

      await Promise.resolve()

      const animateCall = document.documentElement.animate.mock.calls[0]
      expect(animateCall[0][0].clipPath).toContain("0%") // Expands from 0%
      expect(animateCall[1].pseudoElement).toBe("::view-transition-new(root)")
    })

    it("should contract in ripple if dark=false and reverse=true", async () => {
      const mockEvent = { clientX: 100, clientY: 100 }
      document.documentElement.animate = jest.fn().mockReturnValue({ finished: Promise.resolve() })

      helper.enable(false, { animation: "ripple", event: mockEvent, reverse: true })

      await Promise.resolve()

      const animateCall = document.documentElement.animate.mock.calls[0]
      expect(animateCall[0][1].clipPath).toContain("0%") // Contracts to 0% (second keyframe)
      expect(animateCall[1].pseudoElement).toBe("::view-transition-old(root)")
    })
  })

  describe("_animate() - Generics", () => {
    it("should apply generic animation class (zoom)", () => {
      helper.toggle({ animation: "zoom" })
      expect(document.documentElement.classList.contains("zoom")).toBe(true)
    })

    it("should apply generic animation class (blur)", () => {
      helper.toggle({ animation: "blur" })
      expect(document.documentElement.classList.contains("blur")).toBe(true)
    })

    it("should apply generic animation class (zoom) with reverse", () => {
      // Simulate dark being true initially, then toggle to false
      document.documentElement.classList.add("dark")
      helper.toggle({ animation: "zoom", reverse: true })
      expect(document.documentElement.classList.contains("zoom")).toBe(true)
    })
  })

  describe("fallback", () => {
    it("should use beforeTransition if startViewTransition is missing", () => {
      delete document.startViewTransition
      const beforeTransitionSpy = jest.spyOn(helper, "beforeTransition")
      helper.toggle()
      expect(beforeTransitionSpy).toHaveBeenCalled()
      expect(document.documentElement.classList.contains("dark")).toBe(true)
    })

    it("should use beforeTransition if animation is 'none'", () => {
      const beforeTransitionSpy = jest.spyOn(helper, "beforeTransition")
      helper.toggle({ animation: "none" })
      expect(beforeTransitionSpy).toHaveBeenCalled()
    })
  })
})
