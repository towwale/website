import { useEffect, useRef } from 'react'
import { onFrame } from '../lib/scroll.js'
import { business } from '../config.js'

const TEXT = `A breakdown is stressful enough. So our side is simple. You send your location. We send the price. Then a truck is on its way, day or night, across ${business.region}.`

// One long sentence that inks itself in, word by word, as it is scrolled through.
export default function Statement() {
  const root = useRef(null)
  const words = useRef([])

  useEffect(() => onFrame(() => {
    const r = root.current.getBoundingClientRect()
    const vh = window.innerHeight
    if (r.bottom < 0 || r.top > vh) return
    const t = (vh * 0.86 - r.top) / (r.height + vh * 0.34)
    const n = words.current.length
    words.current.forEach((el, i) => {
      const on = Math.min(1, Math.max(0, t * (n + 6) - i))
      el.style.opacity = 0.12 + on * 0.88
    })
  }), [])

  return (
    <section className="statement" id="call" ref={root} aria-label="How we work">
      <div className="wrap">
        <p className="kicker mono">A call comes in</p>
        <p className="statement__text">
          {TEXT.split(' ').map((w, i) => <span key={i} ref={(el) => { words.current[i] = el }}>{w} </span>)}
        </p>
      </div>
    </section>
  )
}
