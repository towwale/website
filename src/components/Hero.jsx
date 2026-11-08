import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Icon from './Icon.jsx'
import Magnetic from './Magnetic.jsx'
import DispatchCard from './DispatchCard.jsx'
import HeroHeadline from './HeroHeadline.jsx'
import { business } from '../config.js'
import { heroState } from '../lib/scroll.js'
import { useTheme } from '../lib/theme.js'

const HeroScene = lazy(() => import('./HeroScene.jsx'))

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="hero__fallback" /> : this.props.children }
}

export default function Hero({ ready }) {
  const root = useRef()
  const [active, setActive] = useState(true)
  const day = useTheme() === 'light'

  // Pause the 3D render loop when the hero is off screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '100px' })
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  // Scroll progress drives the camera, and the copy hands over to the second caption.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: true,
          onUpdate: (self) => { heroState.progress = self.progress },
        },
      })
        .to('.hero__content', { opacity: 0, y: -80, ease: 'none', duration: 0.35 }, 0)
        .to('.hero__scroll', { opacity: 0, duration: 0.1 }, 0)
        .to('.dispatch', { opacity: 0, y: -40, ease: 'none', duration: 0.3 }, 0)
        .fromTo('.hero__caption', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'none', duration: 0.3 }, 0.45)
        .to('.hero__caption', { opacity: 0, y: -40, ease: 'none', duration: 0.15 }, 0.85)
    }, root)
    return () => ctx.revert()
  }, [])

  // Intro once the preloader is done.
  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('.hero__title .line > span', { yPercent: 115, duration: 1.4, stagger: 0.09 })
        .from('.hero__fade', { opacity: 0, y: 24, duration: 1.1, stagger: 0.08 }, '-=1.0')
    }, root)
    return () => ctx.revert()
  }, [ready])

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero__sticky">
        <div className="hero__canvas">
          <SceneBoundary>
            <Suspense fallback={null}>
              <HeroScene active={active} day={day} />
            </Suspense>
          </SceneBoundary>
        </div>
        <div className="hero__shade" />

        <div className="wrap hero__content">
          <HeroHeadline ready={ready} active={active} />
          <div className="hero__row">
            <p className="hero__fade hero__lead">
              24x7 towing and roadside rescue across India. A fixed price before we move,
              a verified driver with live tracking, and you pay only when the job is done.
            </p>
            <div className="hero__fade hero__ctas">
              <Magnetic>
                <a href={`tel:${business.phone}`} className="btn btn--amber btn--lg" data-cursor="Call">
                  <Icon name="phone" size={20} /> Call {business.phoneDisplay}
                </a>
              </Magnetic>
              <Magnetic>
                <a href="#book" className="btn btn--glass btn--lg">Book online <Icon name="arrow" size={18} /></a>
              </Magnetic>
            </div>
          </div>
        </div>

        <div className="wrap hero__side">
          <DispatchCard />
        </div>

        <div className="wrap hero__caption">
          <p className="eyebrow">The fleet</p>
          <p className="hero__caption-text">Flatbeds for EVs and luxury cars. Wheel-lifts for the city. Cranes for the ghats.</p>
        </div>

        <div className="hero__scroll hero__fade" aria-hidden="true"><span /> Scroll</div>
      </div>
    </section>
  )
}
