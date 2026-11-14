import { useEffect, useRef, useState } from 'react'
import Logo from './Logo.jsx'
import { stage } from '../three/rig.js'
import { pauseScroll, reducedMotion, resumeScroll } from '../lib/scroll.js'

// Covers the page until the 3D scene has drawn its first frame, then lifts.
export default function Preloader({ onDone }) {
  const [state, setState] = useState(reducedMotion ? 'gone' : 'loading')
  const count = useRef(null)

  useEffect(() => {
    if (reducedMotion) { stage.go = true; onDone(); return }
    pauseScroll()
    document.documentElement.classList.add('is-loading')
    window.scrollTo(0, 0)
    const started = performance.now()
    let done = false
    let timers = []

    const finish = () => {
      if (done) return
      done = true
      if (count.current) count.current.textContent = '100'
      setState('leaving')
      timers.push(
        setTimeout(() => {
          stage.go = true
          document.documentElement.classList.remove('is-loading')
          resumeScroll()
          onDone()
        }, 350),
        setTimeout(() => setState('gone'), 1100),
      )
    }

    // The counter follows the clock, not the frame rate: it runs to 88 in about a second,
    // then waits for the 3D models before finishing. Fifteen seconds is the limit.
    const tick = setInterval(() => {
      const t = performance.now() - started
      const ready = stage.ready && t > 700
      const value = ready ? 100 : Math.min(88, 88 * (1 - Math.pow(1 - Math.min(1, t / 1100), 3)))
      if (count.current && !done) count.current.textContent = String(Math.round(value)).padStart(3, '0')
      if (ready) finish()
    }, 40)
    const limit = setTimeout(finish, 15000)

    return () => { clearInterval(tick); clearTimeout(limit); timers.forEach(clearTimeout) }
  }, [onDone])

  if (state === 'gone') return null
  return (
    <div className={`preloader ${state === 'leaving' ? 'is-leaving' : ''}`} aria-hidden="true">
      <Logo />
      <div className="preloader__foot mono">
        <span>24-hour towing · India</span>
        <span ref={count}>000</span>
      </div>
    </div>
  )
}
