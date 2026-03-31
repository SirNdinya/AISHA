"use client"

import { ThemeProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import * as React from "react"

export interface ColorModeProps extends ThemeProviderProps { }

export function ColorModeProviderWrapper(props: React.PropsWithChildren<ColorModeProps>) {
    return (
        <ThemeProvider attribute="class" disableTransitionOnChange {...props}>
            {props.children}
        </ThemeProvider>
    )
}

export type ColorMode = "light" | "dark"

export function useColorMode() {
    const { resolvedTheme, setTheme } = useTheme()
    const toggleColorMode = () => {
        setTheme(resolvedTheme === "light" ? "dark" : "light")
    }
    return {
        colorMode: resolvedTheme as ColorMode,
        setColorMode: setTheme,
        toggleColorMode,
    }
}
