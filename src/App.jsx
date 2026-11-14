import { useCallback, useState } from 'react'
import Preloader from './components/Preloader.jsx'
import Cursor from './components/Cursor.jsx'
import Header from './components/Header.jsx'
import StageMount from './components/StageMount.jsx'
import Hero from './components/Hero.jsx'
import Sequence from './components/Sequence.jsx'
import Statement from './components/Statement.jsx'
import Delivered from './components/Delivered.jsx'
import Rates from './components/Rates.jsx'
import Services from './components/Services.jsx'
import Booking from './components/Booking.jsx'
import Areas from './components/Areas.jsx'
import Faq from './components/Faq.jsx'
import Footer from './components/Footer.jsx'
import MobileBar from './components/MobileBar.jsx'
import { RequestProvider } from './lib/request.jsx'
import { useReveal } from './lib/hooks.js'

export default function App() {
  const [ready, setReady] = useState(false)
  const onDone = useCallback(() => setReady(true), [])

  useReveal(ready)

  return (
    <RequestProvider>
      <a className="skip" href="#main">Skip to content</a>
      <Preloader onDone={onDone} />
      <Cursor />
      <Header />
      <main id="main">
        {/* The 3D scene stays fixed behind every section; scrolling drives the truck along its route. */}
        <div className="journey">
          <StageMount />
          <Hero ready={ready} />
          <Statement />
          <Sequence />
          <Rates />
          <Services />
          <Areas />
          <Faq />
          <Delivered />
          <Booking />
        </div>
      </main>
      <Footer />
      <MobileBar />
    </RequestProvider>
  )
}
