import Logo from './Logo.jsx'
import Icon from './Icon.jsx'
import Magnetic from './Magnetic.jsx'
import { business, services } from '../config.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__cta">
          <p className="eyebrow">Stuck right now?</p>
          <a href={`tel:${business.phone}`} className="footer__phone" data-cursor="Call">{business.phoneDisplay}</a>
          <div className="footer__btns">
            <Magnetic>
              <a href={`https://wa.me/${business.whatsapp}`} className="btn btn--amber btn--lg" target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={20} /> WhatsApp us
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="footer__grid">
          <div>
            <h3>Services</h3>
            <ul>{services.slice(0, 5).map((s) => <li key={s.title}><a href="#services">{s.title}</a></li>)}</ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li><a href="#process">How it works</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#book">Book a tow</a></li>
            </ul>
          </div>
          <div>
            <h3>Contact</h3>
            <ul>
              <li><a href={`mailto:${business.email}`}>{business.email}</a></li>
              <li>{business.address}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer__word" aria-hidden="true"><Logo /></div>

      <div className="wrap footer__bottom">
        <span>© {new Date().getFullYear()} {business.name}. All rights reserved.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}
