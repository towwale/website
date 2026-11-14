import Lenis from 'lenis'
import { stage } from '../three/rig.js'

// One loop drives everything tied to scroll: smooth scrolling, the story position that the
// 3D stage follows, and any component that subscribes with onFrame().

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis = null
let started = false
const listeners = new Set()

// The page sections in story order: selector, the scene it starts at, how many scenes it spans.
const STOPS = [
  ['#top', 0, 1], ['#call', 1, 1], ['#how-it-loads', 2, 2], ['#pricing', 4, 1], ['#services', 5, 1],
  ['#areas', 6, 1], ['#faq', 7, 1], ['#delivered', 8, 1], ['#booking', 9, 1], ['#end', 10, 1],
]
let stops = null

// Story position from scroll: the scene whose section is crossing the top of the screen,
// plus how far through it we are.
function measure() {
  if (!stops || !stops[0][0]?.isConnected) stops = STOPS.map(([sel, from, len]) => [document.querySelector(sel), from, len])
  let u = 0
  for (const [el, from, len] of stops) {
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.top > 0) break
    u = from + len * Math.min(1, -r.top / Math.max(1, r.height))
  }
  stage.u = u
}

export function initScroll() {
  if (started) return
  started = true

  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 })
  }

  const tick = (time) => {
    lenis?.raf(time)
    measure()
    listeners.forEach((fn) => fn(stage.u))
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    stage.mouseX = (e.clientX / window.innerWidth) * 2 - 1
    stage.mouseY = (e.clientY / window.innerHeight) * 2 - 1
  }, { passive: true })

  // In-page links glide instead of jumping.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]')
    if (!link) return
    const id = link.getAttribute('href')
    const target = id.length > 1 ? document.querySelector(id) : null
    if (!target) return
    e.preventDefault()
    scrollToElement(target)
  })
}

export function scrollToElement(target, { offset = -72 } = {}) {
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 })
  else target.scrollIntoView({ block: 'start' })
}

export const pauseScroll = () => lenis?.stop()
export const resumeScroll = () => lenis?.start()

// Run fn(storyPosition) every frame. Returns an unsubscribe function.
export function onFrame(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
