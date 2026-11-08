import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const text = 'One call. One fixed price. A verified driver who keeps you posted until you are moving again, whether you are on the Bandra–Worli Sea Link at midnight or a ghat road with no signal.'

export default function Statement() {
  const root = useRef()
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.statement__w', {
        opacity: 1, stagger: 0.08, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'bottom 55%', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <section className="statement" ref={root}>
      <div className="wrap">
        <p className="eyebrow" data-reveal>Why Towwala</p>
        <p className="statement__text">
          {text.split(' ').map((w, i) => <span key={i} className="statement__w">{w} </span>)}
        </p>
      </div>
    </section>
  )
}
