import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import { onFrame } from '../lib/scroll.js'

// Scene 8: the end of the trip. The truck sets the car down in the repair yard, then drives
// round to the depot and backs into line with the rest of the fleet, while this stays pinned.
const PARKING = 8.45 // story position where the truck sets off for the depot

export default function Delivered() {
  const word = useRef(null)
  const steps = useRef(null)

  useEffect(() => onFrame((u) => {
    const t = (u - 8.08) / 0.8
    const on = t > -0.25 && t < 1.25
    word.current.style.visibility = on ? 'visible' : 'hidden'
    if (on) word.current.style.transform = `translate3d(${(0.5 - t) * 150}vw, 0, 0)`
    const step = u >= PARKING ? 1 : 0
    const items = steps.current.children
    for (let i = 0; i < items.length; i++) items[i].classList.toggle('is-active', i === step)
  }), [])

  return (
    <section className="seq seq--short" id="delivered" aria-labelledby="delivered-title">
      <div className="seq__words" aria-hidden="true"><p ref={word}>Delivered</p></div>
      <div className="seq__sticky">
        <div className="wrap seq__ui">
          <ol className="seq__steps" ref={steps}>
            <li className="is-active">
              <p className="seq__num mono">Last stop</p>
              <h3 id="delivered-title">Unloaded where you choose</h3>
              <p className="seq__text">The truck pulls in, the bed tilts once more and your vehicle rolls off at the garage, service centre or yard you asked for.</p>
              <a href="#book" className="btn btn--ink" data-cursor="Book">Book a tow <Icon name="arrow" size={16} /></a>
            </li>
            <li>
              <p className="seq__num mono">Back at base</p>
              <h3>Parked and ready for the next call</h3>
              <p className="seq__text">With your vehicle delivered, the truck heads back to the depot and reverses into line with the rest of the fleet.</p>
              <a href="#book" className="btn btn--ink" data-cursor="Book">Book a tow <Icon name="arrow" size={16} /></a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
