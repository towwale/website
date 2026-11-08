import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { stats } from '../config.js'

export default function Numbers() {
  const root = useRef()
  useEffect(() => {
    const ctx = gsap.context(() => {
      root.current.querySelectorAll('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count)
        const o = { v: 0 }
        gsap.to(o, {
          v: end, duration: 1.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => { el.textContent = Math.round(o.v) },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section className="numbers" ref={root}>
      <div className="wrap numbers__grid">
        {stats.map((s) => (
          <div key={s.label} className="numbers__item" data-reveal>
            <strong>
              {s.prefix}<span data-count={s.value}>{s.value}</span><small>{s.suffix}</small>
            </strong>
            <p>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
