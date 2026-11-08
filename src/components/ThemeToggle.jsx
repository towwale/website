import { flushSync } from 'react-dom'
import { setTheme, useTheme } from '../lib/theme.js'
import { reducedMotion } from '../lib/scroll.js'

// Sun/moon switch. Where supported, the new theme spreads out in a circle from the button.
export default function ThemeToggle() {
  const theme = useTheme()
  const next = theme === 'light' ? 'dark' : 'light'

  const onClick = (e) => {
    if (!document.startViewTransition || reducedMotion) { setTheme(next); return }
    const r = e.currentTarget.getBoundingClientRect()
    const x = r.left + r.width / 2, y = r.top + r.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const t = document.startViewTransition(() => flushSync(() => setTheme(next)))
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  return (
    <button className="theme-toggle" onClick={onClick} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <g className="theme-toggle__sun">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </g>
        <path className="theme-toggle__moon" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    </button>
  )
}
