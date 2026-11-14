import { useEffect, useRef } from 'react'
import Lines from './Lines.jsx'
import { onFrame } from '../lib/scroll.js'
import { rates } from '../config.js'
import { rupees } from '../lib/request.jsx'

const figures = [
  { n: rates.city.base, value: rupees(rates.city.base), label: `Towing within the city, first ${rates.city.includedKm} km`, note: 'Wheel-lift or flatbed, dropped at any garage' },
  { n: rates.city.perKm, value: rupees(rates.city.perKm), label: 'Per km after that', note: 'City towing' },
  { n: rates.outstation.perKm, value: rupees(rates.outstation.perKm), label: 'Per km, highway and outstation', note: 'Long-distance flatbed. Tolls at actuals' },
  { n: rates.roadside.from, value: rupees(rates.roadside.from), label: 'Roadside help, from', note: 'Jumpstart, flat tyre, fuel delivery, lockout' },
]

export default function Rates() {
  const values = useRef([])

  // Each figure runs up from zero as its row rises through the lower part of the screen.
  useEffect(() => onFrame(() => {
    const vh = window.innerHeight
    values.current.forEach((el, i) => {
      if (!el) return
      const top = el.getBoundingClientRect().top
      if (top > vh * 1.1 || top < -200) return
      const t = Math.min(1, Math.max(0, (vh * 0.96 - top) / (vh * 0.42)))
      const text = rupees(figures[i].n * (1 - Math.pow(1 - t, 3)))
      if (el.textContent !== text) el.textContent = text
    })
  }), [])

  return (
    <section className="section rates" id="pricing" aria-labelledby="rates-title">
      <div className="wrap rates__grid">
        <div className="rates__lead">
          <p className="kicker mono" data-reveal>Towing charges</p>
          <Lines id="rates-title" className="display-l" rows={[<span className="dim" key="a">You get</span>, <span className="dim" key="b">the price.</span>, 'Then', 'the truck.']} />
          <p className="rates__intro" data-reveal>
            These are indicative rates with GST included. We confirm your exact fare on WhatsApp
            before a truck is sent, and that is the amount you pay.
          </p>
        </div>

        <ul className="rates__list">
          {figures.map((f, i) => (
            <li key={f.label} data-reveal>
              <p className="rates__value" ref={(el) => { values.current[i] = el }}>{f.value}</p>
              <p className="rates__label">{f.label}<span>{f.note}</span></p>
            </li>
          ))}
          <li className="rates__note mono" data-reveal>Night charges may apply between 11 pm and 6 am. Tolls and parking at actuals.</li>
        </ul>
      </div>
    </section>
  )
}
