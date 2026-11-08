import { useEffect, useState } from 'react'
import { reducedMotion } from '../lib/scroll.js'

// A sample "live job" card that shows what a customer sees after calling.
const stages = ['Dispatcher assigned', 'Truck en route', 'Arriving shortly']
const ROUTE = 'M16 34 C60 34 70 16 120 18 S200 34 262 22'

export default function DispatchCard() {
  const [eta, setEta] = useState(14)
  const stage = eta > 11 ? 0 : eta > 6 ? 1 : 2

  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => setEta((m) => (m <= 4 ? 14 : m - 1)), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <aside className="dispatch hero__fade" aria-label="Example of live job tracking">
      <div className="dispatch__top">
        <span className="dispatch__id">JOB #TW-2481 · Andheri E</span>
        <span className="dispatch__status"><span className="live-dot" /> {stages[stage]}</span>
      </div>
      <svg className="dispatch__map" viewBox="0 0 280 44" aria-hidden="true">
        <path d="M-10 36 C50 36 70 14 120 16 S210 40 290 18" className="dispatch__road" />
        <path id="dispatch-route" d={ROUTE} className="dispatch__route" />
        <circle cx="262" cy="22" r="11" className="dispatch__you-halo" />
        <circle cx="262" cy="22" r="4.5" className="dispatch__you" />
        <g className="dispatch__truck" transform={reducedMotion ? 'translate(120 18)' : undefined}>
          <rect x="-7" y="-5" width="14" height="10" rx="2.5" />
          {!reducedMotion && (
            <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
              <mpath href="#dispatch-route" />
            </animateMotion>
          )}
        </g>
      </svg>
      <div className="dispatch__stats">
        <div><span>Arriving in</span><strong>{eta} min</strong></div>
        <div><span>Fixed price</span><strong>₹1,499</strong></div>
        <div><span>Pay</span><strong>After, UPI</strong></div>
      </div>
    </aside>
  )
}
