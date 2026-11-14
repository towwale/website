import Icon from './Icon.jsx'
import Magnetic from './Magnetic.jsx'
import { business, services } from '../config.js'
import { useRequest } from '../lib/request.jsx'
import { stage } from '../three/rig.js'

// Drag anywhere in the hero to walk round the truck. Mouse only, so a finger still scrolls.
const spin = {
  onPointerDown(e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button, p')) return
    stage.held = true
    spin.x = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.classList.add('is-spinning')
  },
  onPointerMove(e) {
    if (!stage.held) return
    stage.spinTo += (e.clientX - spin.x) * 0.32
    spin.x = e.clientX
  },
  onPointerUp(e) {
    if (!stage.held) return
    stage.held = false
    e.currentTarget.classList.remove('is-spinning')
  },
}

// The headline sits behind the 3D truck; the copy and buttons sit in front of it.
export default function Hero({ ready }) {
  const { request } = useRequest()
  return (
    <section
      className={`hero ${ready ? 'is-in' : ''}`} id="top" data-cursor="Drag to spin" data-cursor-area=""
      onPointerDown={spin.onPointerDown} onPointerMove={spin.onPointerMove} onPointerUp={spin.onPointerUp} onPointerCancel={spin.onPointerUp}
    >
      <h1 className="hero__title lines">
        <span className="hero__line">
          <span className="lines__row"><span className="lines__inner" style={{ '--i': 0 }}>24-hour</span></span>{' '}
          <span className="lines__row"><span className="lines__inner" style={{ '--i': 1 }}>towing</span></span>
        </span>{' '}
        <span className="hero__line hero__line--b">
          <span className="lines__row"><span className="lines__inner" style={{ '--i': 2 }}>across</span></span>{' '}
          <span className="lines__row"><span className="lines__inner" style={{ '--i': 3 }}><span className="plate">{business.region}</span></span></span>
        </span>
      </h1>

      <div className="wrap hero__foot">
        <div className="hero__copy">
          <p className="hero__lead">
            Flatbed transport, car and bike towing, accident recovery and roadside help.
            Send your location on WhatsApp and we confirm the price before the truck leaves.
          </p>
          <div className="hero__actions">
            <Magnetic><a href="#book" className="btn btn--ink btn--lg" data-cursor="Book">Book a tow <Icon name="arrow" size={16} /></a></Magnetic>
            <Magnetic><a href="#how-it-loads" className="btn btn--line btn--lg">Watch a tow</a></Magnetic>
          </div>
        </div>

        <ul className="hero__services mono" aria-label="Services">
          {services.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => request(s.id)}>
                <span>{String(i + 1).padStart(2, '0')}</span>{s.title}<Icon name="arrow" size={12} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="hero__scroll mono" aria-hidden="true"><span /> Scroll to watch</p>
    </section>
  )
}
