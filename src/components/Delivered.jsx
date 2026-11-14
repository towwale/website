import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import { onFrame } from '../lib/scroll.js'

// Scene 8: the garage. The truck pulls in and the car rolls off the bed while this stays pinned.
export default function Delivered() {
  const word = useRef(null)

  useEffect(() => onFrame((u) => {
    const t = (u - 8.2) / 0.8
    const on = t > -0.25 && t < 1.25
    word.current.style.visibility = on ? 'visible' : 'hidden'
    if (on) word.current.style.transform = `translate3d(${(0.5 - t) * 150}vw, 0, 0)`
  }), [])

  return (
    <section className="seq seq--short" id="delivered" aria-labelledby="delivered-title">
      <div className="seq__words" aria-hidden="true"><p ref={word}>Delivered</p></div>
      <div className="seq__sticky">
        <div className="wrap seq__ui">
          <ol className="seq__steps">
            <li className="is-active">
              <p className="seq__num mono">Last stop</p>
              <h3 id="delivered-title">Unloaded where you choose</h3>
              <p className="seq__text">The truck pulls in, the bed tilts once more and your vehicle rolls off at the garage, service centre or yard you asked for.</p>
              <a href="#book" className="btn btn--ink" data-cursor="Book">Book a tow <Icon name="arrow" size={16} /></a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
