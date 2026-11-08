import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { steps } from '../config.js'

export default function Process() {
  const root = useRef()
  const track = useRef()

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const distance = () => track.current.scrollWidth - window.innerWidth
      const tween = gsap.to(track.current, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: () => `+=${distance()}`,
          pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        },
      })
      gsap.to('.process__fill', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: 0.6 },
      })
      return () => tween.kill()
    })
    return () => mm.revert()
  }, [])

  return (
    <section className="process" id="process" ref={root}>
      <div className="process__track" ref={track}>
        <div className="process__intro">
          <p className="eyebrow">How it works</p>
          <h2 className="h2">Four steps.<br /><em>No surprises.</em></h2>
          <p>What happens after you call. No apps to download, no forms, no waiting on hold.</p>
          <div className="process__bar"><span className="process__fill" /></div>
        </div>
        {steps.map((s, i) => (
          <article key={s.title} className="process__step">
            <span className="process__time">{s.time}</span>
            <div>
              <span className="process__idx">Step {i + 1} / {steps.length}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
