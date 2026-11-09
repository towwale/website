import Icon from './Icon.jsx'
import { business, hasPhone } from '../config.js'

// Sticky call / WhatsApp bar shown on phones only.
export default function MobileBar() {
  return (
    <div className="mobile-bar">
      {hasPhone ? (
        <a href={`tel:${business.phone}`} className="btn btn--amber">
          <Icon name="phone" size={20} /> Call now
        </a>
      ) : (
        <a href="#book" className="btn btn--amber">Book a tow</a>
      )}
      <a href={`https://wa.me/${business.whatsapp}`} className="btn btn--whatsapp" target="_blank" rel="noopener noreferrer">
        <Icon name="whatsapp" size={20} /> WhatsApp
      </a>
    </div>
  )
}
