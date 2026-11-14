import { useEffect, useState } from 'react'
import { reducedMotion } from './scroll.js'

// Mark elements as they enter the viewport so CSS can animate them in.
// Content stays visible without JS: the hidden state only applies once <html> has the "js" class.
export function useReveal(ready) {
  useEffect(() => {
    if (!ready) return
    const els = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window) || reducedMotion) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ready])
}

// Which of the given section ids is currently in the middle of the screen.
export function useActiveSection(ids) {
  const [active, setActive] = useState('')
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-45% 0px -50% 0px' })
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [ids])
  return active
}

// True while the element with this id is on screen.
export function useOnScreen(id, initial = true) {
  const [on, setOn] = useState(initial)
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [id])
  return on
}
