import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import Magnetic from './Magnetic.jsx'
import Tyre from './Tyre.jsx'
import { business, services, hasPhone } from '../config.js'
import { reducedMotion } from '../lib/scroll.js'
import { useRequest, whatsappUrl } from '../lib/request.jsx'

const WORDS = ['24 hours', 'Price first', 'Any garage', 'Flatbed', 'Day or night']

// The pile of tags and tyres in the footer is a small physics scene: they drop in when the
// footer comes into view, and can be grabbed, thrown and knocked about. Tapping a service
// tag starts a booking for it. Without motion (or before it loads) they sit in a plain row.
function usePile(pit, onPick) {
  useEffect(() => {
    const root = pit.current
    if (!root || reducedMotion) return
    let dispose = () => {}
    let started = false
    let gone = false

    const start = async () => {
      const Matter = (await import('matter-js')).default
      if (gone) return
      const { Engine, Bodies, Body, Composite, Constraint } = Matter
      // Going live lifts the tags out of the page flow; measure them after that.
      root.classList.add('is-live')
      const items = [...root.querySelectorAll('[data-body]')].filter((el) => el.offsetWidth > 0)
      const sizes = items.map((el) => [el.offsetWidth, el.offsetHeight])
      let W = root.clientWidth, H = root.clientHeight

      const engine = Engine.create()
      engine.gravity.y = 1.1
      const wall = (x, y, w, h) => Bodies.rectangle(x, y, w, h, { isStatic: true })
      const floor = wall(W / 2, H + 40, W * 3, 80)
      const left = wall(-40, H / 2, 80, H * 6)
      const right = wall(W + 40, H / 2, 80, H * 6)
      Composite.add(engine.world, [floor, left, right])

      const bodies = items.map((el, i) => {
        const [w, h] = sizes[i]
        const x = Math.min(W - w / 2 - 12, Math.max(w / 2 + 12, W * (0.12 + 0.76 * ((i * 0.618) % 1))))
        const y = -80 - i * 70
        const opts = { restitution: 0.42, friction: 0.5, frictionAir: 0.012, angle: (Math.random() - 0.5) * 0.9 }
        const body = el.dataset.body === 'circle'
          ? Bodies.circle(x, y, w / 2, { ...opts, restitution: 0.62 })
          : Bodies.rectangle(x, y, w, h, { ...opts, chamfer: { radius: h / 2 - 1 } })
        body.plugin.el = el; body.plugin.w = w; body.plugin.h = h
        return body
      })
      Composite.add(engine.world, bodies)

      // Grab and throw.
      let grab = null
      const point = (e) => { const r = root.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
      const onDown = (e) => {
        const el = e.target.closest('[data-body]')
        const at = point(e)
        if (!el) {
          // A knock on the floor: everything nearby jumps away.
          if (e.target.closest('a, button')) return
          for (const b of bodies) {
            const dx = b.position.x - at.x, dy = b.position.y - at.y, d = Math.hypot(dx, dy)
            if (d < 320) Body.applyForce(b, b.position, { x: (dx / (d || 1)) * 0.035 * b.mass, y: ((dy / (d || 1)) - 0.9) * 0.035 * b.mass })
          }
          return
        }
        const body = bodies[items.indexOf(el)]
        const link = Constraint.create({ pointA: at, bodyB: body, pointB: { x: at.x - body.position.x, y: at.y - body.position.y }, stiffness: 0.18, damping: 0.12, length: 0 })
        Composite.add(engine.world, link)
        grab = { el, link, at, t: performance.now(), moved: 0 }
        el.setPointerCapture?.(e.pointerId)
        el.classList.add('is-held')
      }
      const onMove = (e) => {
        if (!grab) return
        const at = point(e)
        grab.moved += Math.hypot(at.x - grab.link.pointA.x, at.y - grab.link.pointA.y)
        grab.link.pointA = at
      }
      const onUp = () => {
        if (!grab) return
        Composite.remove(engine.world, grab.link)
        grab.el.classList.remove('is-held')
        const tap = grab.moved < 8 && performance.now() - grab.t < 400
        const service = grab.el.dataset.service
        grab = null
        if (tap && service) onPick(service)
      }
      root.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)

      const onResize = () => {
        W = root.clientWidth; H = root.clientHeight
        Body.setPosition(floor, { x: W / 2, y: H + 40 })
        Body.setPosition(right, { x: W + 40, y: H / 2 })
      }
      window.addEventListener('resize', onResize)

      let visible = true
      const seen = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      seen.observe(root)
      let raf = 0, last = performance.now()
      const tick = (now) => {
        raf = requestAnimationFrame(tick)
        const dt = Math.min(32, now - last); last = now
        if (!visible) return
        Engine.update(engine, dt)
        for (const b of bodies) {
          // Anything flung out of the pit is dropped back in from the top.
          if (b.position.y > H + 300 || b.position.x < -300 || b.position.x > W + 300) {
            Body.setPosition(b, { x: W * (0.2 + Math.random() * 0.6), y: -100 }); Body.setVelocity(b, { x: 0, y: 0 })
          }
          b.plugin.el.style.transform = `translate3d(${b.position.x - b.plugin.w / 2}px, ${b.position.y - b.plugin.h / 2}px, 0) rotate(${b.angle}rad)`
        }
      }
      raf = requestAnimationFrame(tick)

      dispose = () => {
        cancelAnimationFrame(raf); seen.disconnect()
        root.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        window.removeEventListener('resize', onResize)
        items.forEach((el) => { el.style.transform = '' })
        root.classList.remove('is-live')
      }
    }

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) { started = true; io.disconnect(); start() }
    }, { threshold: 0.3 })
    io.observe(root)
    return () => { gone = true; io.disconnect(); dispose() }
  }, [pit, onPick])
}

// Each letter of the wordmark gets heavier as the pointer comes near it.
function useWeightedWord(word) {
  useEffect(() => {
    const el = word.current
    if (!el || reducedMotion || !window.matchMedia('(pointer: fine)').matches) return
    const letters = [...el.children]
    const now = letters.map(() => 300)
    const want = letters.map(() => 300)
    let raf = 0, active = false
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const near = e.clientY > r.top - 220 && e.clientY < r.bottom + 120
      letters.forEach((l, i) => {
        const b = l.getBoundingClientRect()
        const d = Math.abs(e.clientX - (b.left + b.width / 2))
        want[i] = near ? 900 - Math.min(1, d / (r.width * 0.32)) * 600 : 300
      })
      if (!active) { active = true; raf = requestAnimationFrame(loop) }
    }
    const loop = () => {
      let moving = false
      letters.forEach((l, i) => {
        now[i] += (want[i] - now[i]) * 0.14
        if (Math.abs(want[i] - now[i]) > 1) moving = true
        l.style.fontWeight = Math.round(now[i])
      })
      if (moving) raf = requestAnimationFrame(loop); else active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove) }
  }, [word])
}

export default function Footer() {
  const { request } = useRequest()
  const pit = useRef(null)
  const word = useRef(null)
  usePile(pit, request)
  useWeightedWord(word)

  return (
    <footer className="footer" id="end">
      <section className="pit" ref={pit} aria-labelledby="cta-title">
        <div className="wrap pit__copy">
          <p className="kicker mono">Vehicle stopped?</p>
          <h2 id="cta-title" className="pit__title" lang="hi-Latn">
            {business.tagline.split(/(?<=\?)\s/).map((part) => <span key={part}>{part} </span>)}
          </h2>
          <div className="pit__actions">
            <Magnetic><a href="#book" className="btn btn--ink btn--lg" data-cursor="Book">Book a tow <Icon name="arrow" size={16} /></a></Magnetic>
            <Magnetic>
              <a href={whatsappUrl()} className="btn btn--line btn--lg" target="_blank" rel="noopener noreferrer" data-cursor="Chat">
                <Icon name="whatsapp" size={18} /> WhatsApp us
              </a>
            </Magnetic>
          </div>
          <p className="pit__hint mono">Grab a tag and throw it. Tap a service to book it.</p>
        </div>

        <div className="pit__pile">
          {services.map((s) => (
            <button
              key={s.id} type="button" className="tag tag--service" data-body="pill" data-service={s.id} data-cursor="Book"
              onClick={(e) => { if (e.detail === 0 || !pit.current.classList.contains('is-live')) request(s.id) }}
            >
              <Icon name={s.icon} size={20} />{s.title}
            </button>
          ))}
          {WORDS.map((w) => <span key={w} className="tag tag--word mono" data-body="pill" data-cursor="Throw" aria-hidden="true">{w}</span>)}
          {[0, 1, 2].map((i) => <span key={i} className={`tag tag--tyre tag--tyre${i}`} data-body="circle" data-cursor="Roll" aria-hidden="true"><Tyre /></span>)}
        </div>
      </section>

      <p className="footer__word" ref={word} aria-hidden="true">
        {business.name.split('').map((c, i) => <span key={i}>{c}</span>)}
      </p>

      <div className="wrap footer__bar mono">
        <span>© {new Date().getFullYear()} {business.name} · Open 24 hours</span>
        <nav aria-label="Footer">
          <a href="#how-it-loads">How it works</a>
          <a href="#pricing">Charges</a>
          <a href="#services">Services</a>
          <a href="#areas">Areas</a>
          <a href="#faq">Questions</a>
          {hasPhone && <a href={`tel:${business.phone}`}>{business.phoneDisplay}</a>}
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <a href="/licences.html">Licences</a>
        </nav>
        <a href="#top" className="footer__top" data-cursor="Tow me up">Back to top <Icon name="arrow" size={14} /></a>
      </div>
    </footer>
  )
}
