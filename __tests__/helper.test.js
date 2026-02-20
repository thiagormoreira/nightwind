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
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    window.localStorage = originalLocalStorage
    jest.clearAllMocks()
  })

  describe("init()", () => {
    it("should return the initialization script logic", () => {
      const script = helper.init()
      expect(typeof script).toBe("string")
      expect(script).toContain("getInitialColorMode")
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

    it("should add nightwind transition class", () => {
      helper.toggle()
      expect(document.documentElement.classList.contains("nightwind")).toBe(
        true
      )
    })
  })

  describe("enable()", () => {
    it("should enable 'dark' mode", () => {
      helper.enable(true)
      expect(document.documentElement.classList.contains("dark")).toBe(true)
      expect(window.localStorage.getItem("nightwind-mode")).toBe("dark")
    })

    it("should enable 'light' mode", () => {
      document.documentElement.classList.add("dark")
      helper.enable(false)
      expect(document.documentElement.classList.contains("light")).toBe(true)
      expect(document.documentElement.classList.contains("dark")).toBe(false)
      expect(window.localStorage.getItem("nightwind-mode")).toBe("light")
    })
  })
})
