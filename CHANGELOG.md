# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.6.1](https://github.com/thiagormoreira/nightwind/compare/v2.5.5...v2.6.1) (2026-03-07)

### Changed
- **Semantic Color Inversion**: Colors are now inverted by lightness (HSL) instead of full spectrum (RGB), preserving hue and saturation. A red alert stays red in dark mode — just darker. Legacy behavior available via `invertMode: 'spectrum'` config option.

### [2.5.5](https://github.com/thiagormoreira/nightwind/compare/v2.5.4...v2.5.5) (2026-03-07)

### [2.5.4](https://github.com/thiagormoreira/nightwind/compare/v2.5.3...v2.5.4) (2026-03-07)

### [2.5.3](https://github.com/thiagormoreira/nightwind/compare/v2.5.2...v2.5.3) (2026-03-07)

### [2.5.2](https://github.com/thiagormoreira/nightwind/compare/v2.5.1...v2.5.2) (2026-03-07)

### [2.5.1](https://github.com/thiagormoreira/nightwind/compare/v2.5.0...v2.5.1) (2026-03-07)

## [2.5.0](https://github.com/thiagormoreira/nightwind/compare/v2.4.1...v2.5.0) (2026-03-07)

### Added
- **View Transitions API Support**: Integrated native browser View Transitions API for cinematic theme switching.
- **Cinematic Ripple Effect**: Added an optional 'ripple' animation that expands from the user's click point.
- **Toggle Animation Options**: Refactored `nightwind.toggle()` and `nightwind.enable()` to accept `animation: 'fade' | 'ripple' | 'none'`.
- **Advanced Transition Orchestration**: Implemented zero-conflict logic that deactivates CSS transitions during View Transitions for perfect visual snapshots.

### Fixed
- **API Reference Bug**: Corrected global View Transition API reference from `documentElement` to `document`.
- **Double-call Bug**: Refactored internal architecture to prevent redundant transition triggers in fallback mode.
- **Backward Compatibility**: Guaranteed 100% stable fallbacks for browsers without View Transition support.

### Fixed
- **Branch Coverage**: Achieved 100% Branch Coverage by refactoring `@media` initialization logic and handling remaining edge cases in theme colors and typography.
- **Improved Stability**: Reinforced type checking for non-string values across all color utilities.

## [2.4.0](https://github.com/thiagormoreira/nightwind/compare/v2.3.0...v2.4.0) (2026-03-07)

### Added
- **Modern Color Support**: Full support for CSS Color Level 4, including `oklch()`, `hsl()`, and `hsla()`.
- **Advanced HSL Inversion**: Semantic inversion for HSL colors that preserves Hue/Matiz and inverts only Lightness.
- **Universal Angle Units**: Support for `deg`, `grad`, `rad`, and `turn` in HSL hue definitions.
- **Gradient JIT Support**: Robust inversion of arbitrary gradient values with automatic legacy-to-modern syntax normalization to prevent invalid CSS.
- **Future-Proofing (Tailwind v4)**: Removed legacy `opacityVar` dependency, aligning with Tailwind v4's high-performance color engine.

### Changed
- **Performance Optimization**: Implemented extreme hoisting of style objects and color parsing outside critical loops.
- **Functional Normalization (Option B)**: Enforced functional format return (`rgb()`, `hsl()`) for all colors to ensure stability across JIT utilites.
- **Alpha Consistency**: Uniform alpha channel normalization across RGB, HSL, and OKLCH (0-1 float range).
- **Format Preservation**: Preservation of original formatting (spaces vs commas) for HSL/OKLCH when inversion is not required.

### Fixed
- **Gradient Alpha Bug**: Resolved double-alpha issues and fixed percentage-based alpha support in gradients.
- **Dead Code Cleanup**: Removed unused `themeColorValues` logic and internal redundancies.
- **Structural CSS Issues**: Fixed incorrect positioning of `fixedElementClass` and resolved `@media` flat-key selector bugs.
- **Typography Sync**: Corrected HSL detection and inversion within typography selectors.


## [2.3.0](https://github.com/thiagormoreira/nightwind/compare/v2.2.1...v2.3.0) (2026-02-22)


### Features

* add support for dark: prefix as a developer override ([722e820](https://github.com/thiagormoreira/nightwind/commit/722e8209374d648c22b5bee5b35f9180f03eefa5))

### [2.2.1](https://github.com/thiagormoreira/nightwind/compare/v2.2.0...v2.2.1) (2026-02-21)

## [2.2.0](https://github.com/thiagormoreira/nightwind/compare/v2.1.1...v2.2.0) (2026-02-21)


### Features

* add standard-version for automated release management. ([6675b2c](https://github.com/thiagormoreira/nightwind/commit/6675b2c65282df80067f362bc077934b7e6ed35d))

## [2.1.0] - 2026-02-20

### Added
- **Hybrid Performance Optimization**: Implemented a hybrid approach combining optimized static generation for standard colors/weights with `matchUtilities` for arbitrary values, ensuring 100% reliability for variants like `hover`, `group-hover`, and `peer-focus`.
- **Arbitrary Color Support**: Automatic dark mode inversion for arbitrary color values (e.g., `bg-[#ffffff]`, `text-[rgb(0,0,0)]`).
- **ESLint Browser Support**: Added proper global definitions for `helper.js` in `eslint.config.js`.

### Changed
- **Performance Pre-calculation**: Optimized the plugin logic to pre-calculate color mappings and rules, significantly reducing PostCSS processing time during Tailwind JIT.
- **Transition Synchronization**: The plugin now injects `--nightwind-transition-duration` into `:root` (default `400ms`) for perfect sync with the transition helper.

### Fixed
- **Variant Reliability**: Fixed issues with `matchComponents` shadowing core utilities, restoring correct variant handling in dark mode.
- **Linting Errors**: Resolved all `no-undef` and `no-unused-vars` errors in `src/index.js` and `helper.js`.
- **Helper Compatibility**: Restored toggling of the `light` class in `helper.js` for backward compatibility with custom CSS workflows.

## [2.0.2] - 2026-02-20

### Added
- **Default Variants**: Added out-of-the-box support for `focus`, `active`, `focus-within`, `focus-visible`, and `disabled`.
- **Selection Prefix**: Added support for `selection` utility inversion.

### Fixed
- **Variant Selector Precision**: Implemented strict variant matching to prevent false positives in color names (e.g., `hoverred` no longer triggers `:hover`).
- **Group & Peer Variants**: Resolved issues with `group-*` and `peer-*` variants, ensuring correct selector generation for nested and sibling elements.

## [2.0.1] - 2026-02-20

### Changed
- **Node.js Requirement**: Minimum Node.js version updated to `v20.12.0` (dropping support for Node 18).

### Fixed
- **ESLint Compatibility**: Resolved `TypeError: util.styleText is not a function` in ESLint 10 by upgrading the project's runtime requirements.

## [2.0.0] - 2026-02-20

### Added
- **Universal Opacity Support**: Dynamic CSS attribute selectors ([class*=".../"]) now support ANY opacity modifier (including arbitrary values like `bg-red-500/[0.3]`) with zero performance overhead.
- **100% Color Utility Coverage**: Added support for `outline-`, `decoration-`, `accent-`, `caret-`, `fill-`, `stroke-`, and `shadow-color` (via `--tw-shadow-color`).
- **Enhanced Transitions**: Default transition duration increased to `400ms` with `ease-in-out` for a smoother theme-switching experience.

### Fixed
- **PostCSS Performance**: Resolved Out-Of-Memory (OOM) errors and hangs caused by static opacity combinatorial explosion.
- **Color Inversion Precision**: Improved `white`/`black` inversion when modifiers are present.
- **Utility Conflicts**: Fixed detection logic for overlapping utilities like `ring-` and `ring-offset-`.

## [1.3.0] - 2026-02-20

### Changed
- **Maintenance**: General refactoring and cleanup of `src/index.js`.
- **CI/CD**: Improved GitHub Actions workflows and testing environment consistency.

## [1.2.0] - 2026-02-20

### Added
- **Testing Infrastructure**: Initial setup of the Jest test suite for color inversion logic.
- **Helper Refinement**: Initial refactor of `helper.js` for better browser compatibility.

## [1.1.13] - 2023-02-21

### Fixed

- support for tailwind v3

## [1.1.12] - 2021-06-24

### Added

- enable() function in helpers to selectively enable dark/light mode
- beforeTransition() function in helpers, fixing unwanted transitions as a side-effect of having nightwind class at html tag.

### Fixed

- added tailwindcss as peerDependency

Huge thanks to @jaulz, @Djiit and @josephbuchma for the contributions for this release!

## [1.1.11] - 2021-04-01

### Added

- Support for CSS variables

## [1.1.10] - 2021-03-29

### Added

- 'nightwind-prevent-block' class
- fixedBlockClass Nightwind configuration option
- transitionClasses Nightwind configuration option

### Changed

- Nightwind by default now generates transition classes only for 'text', 'bg' and 'border' color classes.

## [1.1.9] - 2021-03-29

### Changed

- Nightwind configuration option 'importantSibling' into 'importantNode'

## [1.1.8] - 2021-03-29

### Added

- Support for [important TailwindCSS configuration](https://tailwindcss.com/docs/configuration#important)
- Configuration option 'importantSibling' in nightwind config

## [1.1.7] - 2021-03-27

### Added

- Support for [tailwindcss-jit](https://github.com/tailwindlabs/tailwindcss-jit)

### Fixed

- Bug where tailwindcss-typography nightwind classes were not correctly generated, when using tailwindcss-jit

## [1.1.6] - 2021-02-17

### Fixed

- Bug where sometimes color classes with 'inherit' or 'transparent' were not rendered correctly in dark mode

## [1.1.5] - 2021-02-15

### Added

- Support for [tailwindcss-typography](https://github.com/tailwindlabs/tailwindcss-typography) official TailwindCSS plugin

### Fixed

- Support for 'group-focus' variant

## [1.1.4] - 2021-01-24

### Changed

- New 'variants', 'colorClasses' and 'transitionDuration' configuration in tailwind.config.js (with backward compatibility)

### Fixed

- 'group-hover' classes not being correctly generated

## [1.1.3] - 2021-01-21

### Removed

- Duplicated Nightwind transition classes from gradient classes

## [1.1.2] - 2021-01-20

### Fixed

- Priority of gradient classes generated by Nightwind, which may not appear correctly in some cases

## [1.1.1] - 2021-01-18

### Fixed

- Variants not being correctly applied to nightwind classes

## [1.1.0] - 2021-01-17

### Added

- Custom color scale configuration

## [1.0.9] - 2021-01-16

### Added

- The 'nightwind-prevent' class

## [1.0.8] - 2020-12-29

### Added

- Support for 'first', 'last', 'even' and 'odd' child variants

## [1.0.7] - 2020-12-24

### Fixed

- Solved light flicker and added dark mode persistence in helper functions

## [1.0.6] - 2020-12-22

### Changed

- New color inversion: now all colors get switched, also -50

## [1.0.5] - 2020-12-22

### Added

- Hybrid color mappings

### Changed

- Color mapping now use 'nightwind' instead of 'dark' in tailwind.config.js

## [1.0.4] - 2020-12-22

### Added

- Color mappings

## [1.0.3] - 2020-11-20

### Added

- Tailwind 2.0 support
- Support for inversion of -50 color weights
- Support for gradients in automatic dark mode
- Support for 'ring' color classes
- Support for 'ring-offset' color classes

## [1.0.2] - 2020-11-14

### Fixed

- Fixed opacity not being added in nightwind color classes

## [1.0.1] - 2020-11-11

### Added

- Automatic dark mode support for custom classes

### Changed

- Overrides now use the TailwindCSS dark: variant

## [1.0.0] - 2020-11-09

### Added

- Automatic dark mode
- Support for custom colors
- Variants support
- Overrides
- Helper functions
