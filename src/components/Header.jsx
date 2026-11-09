import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import Logo from './Logo.jsx'
import { business, hasPhone } from '../config.js'

const links = [
  { href: '#services', label: 'Services' },
  { href: '#process', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > 400 && y > last)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
  }, [open])

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''} ${hidden && !open ? 'is-hidden' : ''}`}>
        <div className="wrap header__inner">
          <a href="#top" className="logo" aria-label={`${business.name} home`} onClick={() => setOpen(false)}>
            <Logo />
          </a>
          <nav className="nav" aria-label="Main">
            {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="header__right">
            <ThemeToggle />
            {hasPhone ? (
              <a href={`tel:${business.phone}`} className="pill pill--light">
                <span className="live-dot" /> <span className="hide-sm">{business.phoneDisplay}</span><span className="show-sm">Call</span>
              </a>
            ) : (
              <a href="#book" className="pill pill--light"><span className="live-dot" /> Book a tow</a>
            )}
            <button className={`burger ${open ? 'is-open' : ''}`} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="wrap menu__inner">
          <nav>
            {[...links, { href: '#book', label: 'Book a tow' }].map((l, i) => (
              <a key={l.href} href={l.href} style={{ '--i': i }} onClick={() => setOpen(false)}>
                <small>0{i + 1}</small>{l.label}
              </a>
            ))}
          </nav>
          <div className="menu__foot">
            {hasPhone && <a href={`tel:${business.phone}`}><Icon name="phone" size={18} /> {business.phoneDisplay}</a>}
            <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={18} /> WhatsApp</a>
          </div>
        </div>
      </div>
    </>
  )
}
