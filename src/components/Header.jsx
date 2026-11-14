import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import Magnetic from './Magnetic.jsx'
import { business, hasPhone } from '../config.js'
import { useActiveSection } from '../lib/hooks.js'
import { pauseScroll, resumeScroll } from '../lib/scroll.js'
import { whatsappUrl } from '../lib/request.jsx'

const links = [
  { id: 'how-it-loads', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'services', label: 'Services' },
  { id: 'areas', label: 'Areas' },
  { id: 'faq', label: 'FAQ' },
]
const ids = links.map((l) => l.id)

const timeInIndia = () =>
  new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date())

function Clock() {
  const [time, setTime] = useState(timeInIndia)
  useEffect(() => {
    const id = setInterval(() => setTime(timeInIndia()), 20000)
    return () => clearInterval(id)
  }, [])
  return <time>{time} IST</time>
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection(ids)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (open) pauseScroll(); else resumeScroll()
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
        <div className="wrap header__inner">
          <a href="#top" className="header__logo" aria-label={`${business.name} home`} onClick={() => setOpen(false)}>
            <Logo />
          </a>
          <nav className="nav mono" aria-label="Main">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} aria-current={active === l.id ? 'true' : undefined}>{l.label}</a>
            ))}
          </nav>
          <div className="header__right">
            <p className="header__status mono"><span className="dot" aria-hidden="true" /> Open now · <Clock /></p>
            <Magnetic>
              <a href="#book" className="btn btn--ink" onClick={() => setOpen(false)}>Book a tow</a>
            </Magnetic>
            <button
              type="button" className={`burger ${open ? 'is-open' : ''}`}
              aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="menu"
              onClick={() => setOpen((o) => !o)}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      <div id="menu" className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <nav className="wrap menu__nav" aria-label="Mobile">
          {[...links, { id: 'book', label: 'Book a tow' }].map((l, i) => (
            <a key={l.id} href={`#${l.id}`} style={{ '--i': i }} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              <span className="mono">0{i + 1}</span>{l.label}
            </a>
          ))}
        </nav>
        <div className="wrap menu__foot mono">
          {hasPhone && <a href={`tel:${business.phone}`} tabIndex={open ? 0 : -1}>{business.phoneDisplay}</a>}
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>WhatsApp</a>
          <a href={`mailto:${business.email}`} tabIndex={open ? 0 : -1}>{business.email}</a>
        </div>
      </div>
    </>
  )
}
