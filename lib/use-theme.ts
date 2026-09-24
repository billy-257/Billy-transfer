"use client"

import { useCallback, useEffect, useState } from "react"

export type Theme = "dark" | "light"

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

// Light/dark theme controlled by a `light` class on <html>. The initial class
// is applied by an inline script in the root layout to avoid a flash.
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    setThemeState(currentTheme())
  }, [])

  const setTheme = useCallback((t: Theme) => {
    const root = document.documentElement
    if (t === "light") root.classList.add("light")
    else root.classList.remove("light")
    root.style.colorScheme = t
    try {
      localStorage.setItem("billy-theme", t)
    } catch {
      /* ignore */
    }
    setThemeState(t)
  }, [])

  const toggle = useCallback(() => {
    setTheme(currentTheme() === "light" ? "dark" : "light")
  }, [setTheme])

  return { theme, setTheme, toggle }
}
