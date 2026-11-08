import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { reducedMotion } from '../lib/scroll.js'

export default function Preloader({ onDone }) {
  const root = useRef()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reducedMotion) { onDone(); return }
    document.documentElement.classList.add('is-loading')
    const state = { v: 0 }
    const tl = gsap.timeline()
    tl.to(state, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => setCount(Math.round(state.v)) })
      .to('.preloader__bar span', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to('.preloader__word span', { yPercent: -110, duration: 0.6, ease: 'power3.in', stagger: 0.03 }, '+=0.1')
      .add(() => { document.documentElement.classList.remove('is-loading'); onDone() }, '-=0.2')
      .to(root.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.3')
      .set(root.current, { display: 'none' })
    return () => tl.kill()
  }, [onDone])

  if (reducedMotion) return null
  return (
    <div ref={root} className="preloader" aria-hidden="true">
      <div className="preloader__word">
        {'Towwala'.split('').map((c, i) => <span key={i} className={i < 3 ? 'brand__tow' : 'brand__wala'}>{c}</span>)}
      </div>
      <div className="preloader__foot">
        <span>Roadside assistance · India</span>
        <span className="preloader__count">{String(count).padStart(3, '0')}</span>
      </div>
      <div className="preloader__bar"><span /></div>
    </div>
  )
}
