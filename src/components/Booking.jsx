import Icon from './Icon.jsx'
import BookingForm from './BookingForm.jsx'
import { business } from '../config.js'

export default function Booking() {
  return (
    <section className="section booking-sec" id="book">
      <div className="booking-sec__glow" aria-hidden="true" />
      <div className="wrap booking-sec__inner">
        <div className="booking-sec__copy">
          <p className="eyebrow" data-reveal>Book a tow</p>
          <h2 className="h2" data-reveal>Tell us where.<br /><em>We’ll do the rest.</em></h2>
          <p className="booking-sec__lead" data-reveal>Your request opens in WhatsApp, ready to send. Tap “Use GPS” and the driver gets your exact pin.</p>
          <ul className="booking-sec__list" data-reveal>
            <li><Icon name="check" size={18} /> Fixed price confirmed before dispatch</li>
            <li><Icon name="check" size={18} /> Driver details and live tracking on WhatsApp</li>
            <li><Icon name="check" size={18} /> UPI, card or cash, after service</li>
          </ul>
          <a href={`tel:${business.phone}`} className="booking-sec__call" data-reveal>
            <small>Prefer to talk?</small>
            <strong>{business.phoneDisplay}</strong>
          </a>
        </div>
        <div data-reveal><BookingForm /></div>
      </div>
    </section>
  )
}
