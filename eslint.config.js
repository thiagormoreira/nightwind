const jestPlugin = require("eslint-plugin-jest");

module.exports = [
    jestPlugin.configs["flat/recommended"],
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "commonjs",
            globals: {
                require: true,
                module: true,
                window: true,
                document: true,
                console: true,
                __dirname: true
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "jest/expect-expect": "warn"
        }
    }
];
