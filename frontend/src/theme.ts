import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
    theme: {
        tokens: {
            colors: {
                brand: {
                    50: { value: "#e6f6ff" },
                    100: { value: "#b3e0ff" },
                    200: { value: "#80cbff" },
                    300: { value: "#4db5ff" },
                    400: { value: "#1a9fff" },
                    500: { value: "#0088cc" }, // Primary Brand Color
                    600: { value: "#006aa6" },
                    700: { value: "#004d80" },
                    800: { value: "#002f59" },
                    900: { value: "#001233" },
                },
                accent: {
                    500: { value: "#ffb400" }, // Gold/Amber for actions
                },
                surface: {
                    light: { value: "#ffffff" },
                    dark: { value: "#1a202c" },
                    muted: { value: "#f7fafc" },
                }
            },
            fonts: {
                heading: { value: "'Outfit', sans-serif" },
                body: { value: "'Inter', sans-serif" },
            },
        },
        semanticTokens: {
            colors: {
                text: {
                    default: { value: "{colors.gray.800}" },
                    _dark: { value: "{colors.gray.100}" }
                },
                bg: {
                    default: { value: "{colors.surface.light}" },
                    _dark: { value: "{colors.surface.dark}" }

                }
            }
        }
    },
    globalCss: {
        "html, body": {
            margin: 0,
            padding: 0,
            backgroundColor: "bg",
            color: "text",
            fontFamily: "body",
            height: "100%",
            width: "100%",
        },
    },
})

export const system = createSystem(defaultConfig, config)
