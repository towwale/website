import Icon from './Icon.jsx'
import { business, hasPhone } from '../config.js'
import { useOnScreen } from '../lib/hooks.js'
import { whatsappUrl } from '../lib/request.jsx'

// Fixed action bar on phones. It steps aside while the request form is on screen.
export default function MobileBar() {
  const formVisible = useOnScreen('book', false)
  return (
    <div className={`mobile-bar ${formVisible ? 'is-hidden' : ''}`}>
      {hasPhone ? (
        <a href={`tel:${business.phone}`} className="btn btn--ink"><Icon name="phone" size={16} /> Call now</a>
      ) : (
        <a href="#book" className="btn btn--ink">Book a tow</a>
      )}
      <a href={whatsappUrl()} className="btn btn--wa" target="_blank" rel="noopener noreferrer">
        <Icon name="whatsapp" size={16} /> WhatsApp
      </a>
    </div>
  )
}
