import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Shared state the 3D scene reads every frame.
export const heroState = { progress: 0, mouseX: 0, mouseY: 0 }

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis = null

export function initScroll() {
  if (lenis || reducedMotion) return lenis
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // Smooth-scroll in-page links.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute('href')
    const el = id.length > 1 && document.querySelector(id)
    if (!el) return
    e.preventDefault()
    lenis.scrollTo(el, { offset: id === '#top' ? 0 : -60 })
  })

  window.addEventListener('pointermove', (e) => {
    heroState.mouseX = (e.clientX / window.innerWidth) * 2 - 1
    heroState.mouseY = (e.clientY / window.innerHeight) * 2 - 1
  }, { passive: true })

  return lenis
}

export const getLenis = () => lenis
