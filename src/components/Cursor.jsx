import { useEffect, useRef } from 'react'
import Tyre from './Tyre.jsx'
import { reducedMotion } from '../lib/scroll.js'

// The pointer is a tyre. It rolls as it moves, squashes on click, leaves faint tread
// marks when it moves fast, and swells with a label over anything you can act on.
// Mouse and trackpad only; touch screens and reduced-motion users keep the normal pointer.

const RADIUS = 20 // px, matches the .tyre size in CSS

export default function Cursor() {
  const tyre = useRef(null)
  const wheel = useRef(null)
  const label = useRef(null)
  const skid = useRef(null)

  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return
    const root = document.documentElement
    const el = tyre.current
    const canvas = skid.current
    const ctx = canvas.getContext('2d')
    const target = { x: innerWidth / 2, y: innerHeight / 2 }
    const at = { ...target }
    let angle = 0
    let ink = 0 // frames of tread marks still fading
    let raf = 0
    let shown = false

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      target.x = e.clientX; target.y = e.clientY
      if (!shown) { shown = true; at.x = target.x; at.y = target.y; el.classList.add('is-on'); root.classList.add('has-tyre') }
      const t = e.target
      const act = t.closest?.('a, button, label, summary')
      const tagged = t.closest?.('[data-cursor]')
      const text = t.closest?.('input:not([type="range"]), textarea')
      const own = tagged && (!act || act === tagged || act.contains(tagged))
      const area = own && !act && tagged.dataset.cursorArea !== undefined // a whole region, not a control
      el.classList.toggle('is-hot', Boolean(act || (own && !area)) && !text)
      el.classList.toggle('is-text', Boolean(text))
      const word = (!text && own && tagged.dataset.cursor) || ''
      if (label.current.textContent !== word) label.current.textContent = word
      el.classList.toggle('has-label', Boolean(word))
    }
    const onDown = () => el.classList.add('is-down')
    const onUp = () => el.classList.remove('is-down')
    const onLeave = () => { shown = false; el.classList.remove('is-on') }

    const loop = () => {
      const px = at.x, py = at.y
      at.x += (target.x - at.x) * 0.24
      at.y += (target.y - at.y) * 0.24
      const dx = at.x - px, dy = at.y - py
      const speed = Math.hypot(dx, dy)

      // Roll: the wheel turns by the distance it has covered.
      angle += ((Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) : Math.sign(dy)) * speed) / RADIUS
      el.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`
      wheel.current.style.transform = `rotate(${angle}rad)`

      // Tread marks: two dashed lines either side of the path, stronger the faster it goes.
      if (speed > 5 && shown) {
        const nx = -dy / speed, ny = dx / speed
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = `rgba(13, 14, 15, ${Math.min(0.2, speed * 0.008)})`
        ctx.lineWidth = 3
        ctx.setLineDash([3, 3])
        for (const side of [-7, 7]) {
          ctx.beginPath()
          ctx.moveTo(px + nx * side, py + ny * side)
          ctx.lineTo(at.x + nx * side, at.y + ny * side)
          ctx.stroke()
        }
        ink = 90
      }
      if (ink > 0) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.07)'
        ctx.fillRect(0, 0, innerWidth, innerHeight)
        if (--ink === 0) ctx.clearRect(0, 0, innerWidth, innerHeight)
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('resize', size)
    root.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('resize', size)
      root.removeEventListener('mouseleave', onLeave)
      root.classList.remove('has-tyre')
    }
  }, [])

  return (
    <>
      <canvas ref={skid} className="skid" aria-hidden="true" />
      <div ref={tyre} className="tyre" aria-hidden="true">
        <Tyre innerRef={wheel} className="tyre__wheel" />
        <span ref={label} className="tyre__label" />
      </div>
    </>
  )
}
