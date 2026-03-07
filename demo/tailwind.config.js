const nightwind = require("../src/index.js");

module.exports = {
    darkMode: "class",
    content: ["./demo/index.html"],
    theme: {
        nightwind: {
            colorClasses: [
                "gradient",
                "ring",
                "ring-offset",
                "divide",
                "placeholder",
            ],
            transitionDuration: "300ms",
            transitionClasses: "full",
            typography: true,
            colors: {
                rose: "blue",
                white: "gray.900",
                black: "gray.50",
                primary: {
                    default: "indigo",
                    500: "#6366f1",
                }
            },
        },
        extend: {
            colors: {
                primary: {
                    50: "#e0e7ff",
                    100: "#c7d2fe",
                    200: "#a5b4fc",
                    300: "#818cf8",
                    400: "#6366f1",
                    500: "#4f46e5",
                    600: "#4338ca",
                    700: "#3730a3",
                    800: "#312e81",
                    900: "#1e1b4b",
                },
            },
        },
    },
    variants: {
        nightwind: ["hover", "focus", "active", "group-hover"],
    },
    plugins: [
        require("@tailwindcss/typography"),
        nightwind,
    ],
};
