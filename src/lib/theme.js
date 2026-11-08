import { useSyncExternalStore } from 'react'

// Light/dark theme. The first paint is set by an inline script in index.html.
const KEY = 'towwala-theme'
const COLORS = { dark: '#06080b', light: '#f6f3ec' }
const listeners = new Set()

const read = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

function apply(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme])
  listeners.forEach((l) => l())
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme) } catch { /* private mode */ }
  apply(theme)
}

// Follow the system setting until the visitor picks a theme themselves.
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    let saved = null
    try { saved = localStorage.getItem(KEY) } catch { /* ignore */ }
    if (!saved) apply(e.matches ? 'light' : 'dark')
  })
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useTheme = () => useSyncExternalStore(subscribe, read, () => 'dark')
