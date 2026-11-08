import { useCallback, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initScroll, getLenis } from './lib/scroll.js'
import Preloader from './components/Preloader.jsx'
import Cursor from './components/Cursor.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Marquee from './components/Marquee.jsx'
import Statement from './components/Statement.jsx'
import Services from './components/Services.jsx'
import Process from './components/Process.jsx'
import Numbers from './components/Numbers.jsx'
import Pricing from './components/Pricing.jsx'
import Reviews from './components/Reviews.jsx'
import Booking from './components/Booking.jsx'
import FAQ from './components/FAQ.jsx'
import Footer from './components/Footer.jsx'
import MobileBar from './components/MobileBar.jsx'

export default function App() {
  const [ready, setReady] = useState(false)
  const onDone = useCallback(() => setReady(true), [])

  useEffect(() => {
    const lenis = initScroll()
    lenis?.stop()
  }, [])

  useEffect(() => {
    if (!ready) return
    getLenis()?.start()
    // Fade-up reveal for anything marked data-reveal.
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 48, opacity: 0, duration: 1.2, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })
    })
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => { clearTimeout(t); ctx.revert() }
  }, [ready])

  return (
    <>
      <Preloader onDone={onDone} />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Header />
      <main>
        <Hero ready={ready} />
        <Marquee />
        <Statement />
        <Services />
        <Process />
        <Numbers />
        <Pricing />
        <Reviews />
        <Booking />
        <FAQ />
      </main>
      <Footer />
      <MobileBar />
    </>
  )
}
