module.exports = {
  testEnvironment: "jsdom",
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["src/index.js"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 99,
      statements: 99,
    },
  },
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
}
