import { useEffect, useRef } from 'react'
import Lines from './Lines.jsx'
import Tyre from './Tyre.jsx'
import { business, cities } from '../config.js'
import { onFrame, reducedMotion } from '../lib/scroll.js'

const half = Math.ceil(cities.length / 2)
const ROWS = [cities.slice(0, half), cities.slice(half)]

// Two bands of place names that roll past each other. They idle slowly and pick up
// speed and direction from the page scroll.
export default function Areas() {
  const rows = useRef(null)

  useEffect(() => {
    const root = rows.current
    if (reducedMotion) { root.classList.add('is-static'); return }
    const bands = [...root.children]
    let widths = []
    const size = () => { widths = bands.map((b) => b.firstElementChild.offsetWidth) }
    size()
    window.addEventListener('resize', size)
    document.fonts?.ready.then(size)

    let visible = false
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '100px' })
    io.observe(root)

    let x = 0, dir = 1, last = window.scrollY, speed = 0
    const off = onFrame(() => {
      const y = window.scrollY
      const v = y - last; last = y
      if (!visible) return
      if (v) dir = Math.sign(v)
      speed += (Math.min(60, Math.abs(v)) - speed) * 0.12
      x += (0.7 + speed * 0.9) * dir
      bands.forEach((b, i) => {
        const w = widths[i] || 1
        const at = (((i ? -x : x) % w) + w) % w
        b.style.transform = `translate3d(${-at}px, 0, 0)`
        b.style.setProperty('--turn', `${(i ? -x : x) * 1.4}deg`)
      })
    })
    return () => { off(); io.disconnect(); window.removeEventListener('resize', size) }
  }, [])

  return (
    <section className="section areas" id="areas" aria-labelledby="areas-title">
      <div className="areas__pin">
      <div className="wrap areas__grid">
        <div>
          <p className="kicker mono" data-reveal>Where we work</p>
          <Lines id="areas-title" className="display-l" rows={['Towing', <span className="plate" key="c">across {business.region}</span>]} />
        </div>
        <div className="areas__body" data-reveal>
          <p>
            {business.name} takes towing and roadside bookings across {business.region}, day and night,
            including the cities and highways listed here.
          </p>
        </div>
      </div>

      <div className="areas__rows" ref={rows}>
        {ROWS.map((row, r) => (
          <div className="areas__band" key={r}>
            {[0, 1, 2].map((copy) => (
              <ul key={copy} aria-hidden={copy ? 'true' : undefined}>
                {row.map((c) => <li key={c}><span>{c}</span><Tyre /></li>)}
              </ul>
            ))}
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
