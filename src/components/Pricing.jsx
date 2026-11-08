import Icon from './Icon.jsx'
import { pricing, business } from '../config.js'

export default function Pricing() {
  return (
    <section className="section pricing-sec" id="pricing">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow" data-reveal>Pricing</p>
          <h2 className="h2" data-reveal>Honest prices.<br /><em>Said out loud.</em></h2>
          <p className="sec-head__aside" data-reveal>Indicative rates, GST included. Your exact fare is confirmed on the call, and that is what you pay.</p>
        </div>
        <div className="plans">
          {pricing.map((p) => (
            <article key={p.name} className={`plan ${p.highlight ? 'plan--hot' : ''}`} data-reveal>
              <div className="plan__head">
                <h3>{p.name}</h3>
                {p.highlight && <span className="plan__badge">Most booked</span>}
              </div>
              <p className="plan__price"><span>₹</span>{p.price}</p>
              <p className="plan__unit">{p.unit}</p>
              <ul>
                {p.features.map((f) => <li key={f}><Icon name="check" size={16} /> {f}</li>)}
              </ul>
              <a href={`tel:${business.phone}`} className={`btn btn--block ${p.highlight ? 'btn--dark' : 'btn--line'}`}>
                Get exact quote <Icon name="arrow" size={16} />
              </a>
            </article>
          ))}
        </div>
        <p className="plans__note" data-reveal>Night charges may apply between 11 pm and 6 am. Tolls and parking at actuals.</p>
      </div>
    </section>
  )
}
