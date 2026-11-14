import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Lines from './Lines.jsx'
import { business, rates, services, vehicles, hasPhone } from '../config.js'
import { plan, rupees, useRequest, whatsappUrl } from '../lib/request.jsx'

// Booking is a short guided flow: problem, vehicle, location, send. A job ticket beside it
// fills in as you go. The request leaves as a WhatsApp message, so there is no account,
// OTP or backend, and WhatsApp already shows us the sender's name and number.

const STEPS = ['Problem', 'Vehicle', 'Location', 'Send']
const VEHICLE_ICON = { car: 'car', suv: 'suv', luxury: 'ev', bike: 'bike', commercial: 'truck' }
const TRIPS = {
  city: { label: 'Within the city', min: 1, max: 60, step: 1, start: 12 },
  outstation: { label: 'Outstation', min: 50, max: 600, step: 10, start: 150 },
}

function estimate(trip, km) {
  if (trip === 'outstation') return { total: km * rates.outstation.perKm, parts: `${km} km × ${rupees(rates.outstation.perKm)}, tolls at actuals` }
  const { base, includedKm, perKm } = rates.city
  const extra = Math.max(0, km - includedKm)
  return {
    total: base + extra * perKm,
    parts: extra ? `${rupees(base)} for ${includedKm} km + ${extra} km × ${rupees(perKm)}` : `${rupees(base)} covers the first ${includedKm} km`,
  }
}

// Drag the truck to the end of the track to send. A plain click or Enter sends too.
function SlideToSend({ onSend }) {
  const track = useRef(null)
  const knob = useRef(null)
  const drag = useRef(null)
  const dragged = useRef(false)
  const [x, setX] = useState(0)
  const [sliding, setSliding] = useState(false)
  const [sent, setSent] = useState(false)

  const limit = () => track.current.clientWidth - knob.current.offsetWidth - 12

  const fire = () => {
    if (onSend()) {
      setX(limit()); setSent(true)
      setTimeout(() => { setSent(false); setX(0) }, 2600)
    } else setX(0)
  }
  const down = (e) => {
    drag.current = { start: e.clientX, from: x }
    dragged.current = false
    setSliding(true)
    knob.current.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    if (!drag.current) return
    const d = e.clientX - drag.current.start
    if (Math.abs(d) > 5) dragged.current = true
    setX(Math.min(limit(), Math.max(0, drag.current.from + d)))
  }
  const up = () => {
    if (!drag.current) return
    drag.current = null
    setSliding(false)
    if (!dragged.current) return // a click: handled by onClick
    if (x >= limit() * 0.88) fire(); else setX(0)
  }
  const click = () => { if (!dragged.current) fire() }

  const progress = track.current ? x / Math.max(1, limit()) : 0
  return (
    <div className={`slide ${sliding ? 'is-sliding' : ''} ${sent ? 'is-sent' : ''}`} ref={track} style={{ '--x': `${x}px`, '--t': progress }}>
      <span className="slide__fill" aria-hidden="true" />
      <span className="slide__text mono" aria-hidden="true">{sent ? 'Opening WhatsApp' : 'Slide the truck to send'}</span>
      <span className="slide__end" aria-hidden="true"><Icon name="whatsapp" size={20} /></span>
      <button
        type="button" ref={knob} className="slide__knob" data-cursor="Slide"
        aria-label="Send request on WhatsApp"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click}
      >
        <Icon name="flatbed" size={26} />
      </button>
    </div>
  )
}

export default function Booking() {
  const { need, vehicle, setNeed, setVehicle } = useRequest()
  const [step, setStep] = useState(0)
  const [pickup, setPickup] = useState('')
  const [drop, setDrop] = useState('')
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [trip, setTrip] = useState('city')
  const [km, setKm] = useState(0) // 0 = distance not given
  const [nudge, setNudge] = useState(false)
  const pickupRef = useRef(null)

  const p = plan(need, vehicle)
  const byDistance = p.service.price === 'tow'
  const t = TRIPS[trip]
  const quote = byDistance && km > 0 ? estimate(trip, km) : null

  // "Request" buttons elsewhere on the page land here on the location step.
  useEffect(() => {
    const onRequest = () => {
      setStep(2)
      setTimeout(() => pickupRef.current?.focus({ preventScroll: true }), 1000)
    }
    window.addEventListener('towwala:request', onRequest)
    return () => window.removeEventListener('towwala:request', onRequest)
  }, [])

  const pickNeed = (id) => { setNeed(id); setTimeout(() => setStep((s) => (s === 0 ? 1 : s)), 260) }
  const pickVehicle = (id) => { setVehicle(id); setTimeout(() => setStep((s) => (s === 1 ? 2 : s)), 260) }

  const locate = () => {
    if (!navigator.geolocation) { setLocError('This device cannot share its location. Please type it instead.'); return }
    setLocating(true); setLocError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })
        setPickup((v) => v || 'My current location (pin attached)')
        setLocating(false)
      },
      () => { setLocError('We could not get your location. Please type it instead.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const askForPickup = () => {
    setStep(2); setNudge(true)
    setTimeout(() => { pickupRef.current?.focus({ preventScroll: true }); setNudge(false) }, 500)
  }

  const send = () => {
    if (!pickup.trim()) { askForPickup(); return false }
    const lines = [
      `New ${business.name} request`,
      `Service: ${p.service.title}`,
      `Vehicle: ${p.vehicle.full}`,
      `Pickup: ${pickup}`,
      coords && `Map: https://maps.google.com/?q=${coords.lat},${coords.lng}`,
      drop && `Drop: ${drop}`,
      quote && `Distance: about ${km} km (${t.label.toLowerCase()})`,
    ].filter(Boolean)
    window.open(whatsappUrl(lines.join('\n')), '_blank', 'noopener')
    return true
  }

  const next = () => {
    if (step === 2 && !pickup.trim()) { askForPickup(); return }
    setStep((s) => Math.min(3, s + 1))
  }

  return (
    <section className="section dispatch" id="booking" aria-labelledby="booking-title">
      <div className="wrap">
        <header className="dispatch__head">
          <p className="kicker mono" data-reveal>Book a tow</p>
          <Lines id="booking-title" className="display-xl" rows={['Tell us', 'where you are.']} />
        </header>

        <div className="dispatch__grid">
          <form className="flow" id="book" onSubmit={(e) => { e.preventDefault(); if (step < 3) next(); else send() }} data-reveal>
            <ol className="flow__steps mono" style={{ '--step': step }}>
              {STEPS.map((label, i) => (
                <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
                  <button type="button" onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}>
                    <span>0{i + 1}</span>{label}
                  </button>
                </li>
              ))}
              <li className="flow__road" aria-hidden="true"><i /><b><Icon name="flatbed" size={18} /></b></li>
            </ol>

            <div className="flow__panels">
              <fieldset className="flow__panel" hidden={step !== 0}>
                <legend>What happened?</legend>
                <div className="opts opts--needs">
                  {services.map((s) => (
                    <label key={s.id} className="opt">
                      <input type="radio" name="need" value={s.id} checked={need === s.id} onChange={() => pickNeed(s.id)} onClick={() => need === s.id && pickNeed(s.id)} />
                      <span className="opt__icon"><Icon name={s.icon} size={26} /></span>
                      <span className="opt__title">{s.title}</span>
                      <span className="opt__text">{s.short}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="flow__panel" hidden={step !== 1}>
                <legend>What are you driving?</legend>
                <div className="opts opts--vehicles">
                  {vehicles.map((v) => (
                    <label key={v.id} className="opt opt--vehicle">
                      <input type="radio" name="vehicle" value={v.id} checked={vehicle === v.id} onChange={() => pickVehicle(v.id)} onClick={() => vehicle === v.id && pickVehicle(v.id)} />
                      <span className="opt__icon"><Icon name={VEHICLE_ICON[v.id]} size={34} /></span>
                      <span className="opt__title">{v.label}</span>
                      <span className="opt__text">{v.full}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flow__panel" hidden={step !== 2}>
                <h3 className="flow__q">Where are you?</h3>
                <div className={`where ${nudge ? 'is-nudged' : ''}`}>
                  <label htmlFor="pickup" className="mono">Pickup location</label>
                  <div className="where__row">
                    <input
                      id="pickup" name="pickup" ref={pickupRef} value={pickup} onChange={(e) => setPickup(e.target.value)}
                      placeholder="Area, landmark or highway km" autoComplete="street-address"
                      aria-describedby={locError ? 'pickup-error' : undefined}
                    />
                    <button type="button" className={`gps ${coords ? 'is-set' : ''} ${locating ? 'is-busy' : ''}`} onClick={locate} disabled={locating} data-cursor="Locate">
                      <span className="gps__radar" aria-hidden="true" />
                      <Icon name={coords ? 'check' : 'locate'} size={18} />
                      <span className="mono">{locating ? 'Finding you' : coords ? 'Pin attached' : 'Use my location'}</span>
                    </button>
                  </div>
                  {locError && <p className="where__error" id="pickup-error" role="alert">{locError}</p>}
                </div>
                <div className="where">
                  <label htmlFor="drop" className="mono">Drop location <span>optional</span></label>
                  <input id="drop" name="drop" value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="Garage or service centre" />
                </div>

                {byDistance && (
                  <div className="reach">
                    <div className="reach__top">
                      <label htmlFor="km" className="mono">How far is the garage? <span>optional</span></label>
                      <div className="seg" role="radiogroup" aria-label="Trip type">
                        {Object.entries(TRIPS).map(([id, o]) => (
                          <label key={id} className="seg__opt mono">
                            <input type="radio" name="trip" value={id} checked={trip === id} onChange={() => { setTrip(id); setKm(TRIPS[id].start) }} />
                            <span>{o.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="reach__slider">
                      <input
                        id="km" className="range" type="range" min={t.min} max={t.max} step={t.step} value={km || t.min}
                        onChange={(e) => setKm(Number(e.target.value))} style={{ '--fill': `${(((km || t.min) - t.min) / (t.max - t.min)) * 100}%` }}
                      />
                      <output htmlFor="km">{km ? `${km} km` : 'Not set'}</output>
                    </div>
                  </div>
                )}
              </div>

              <div className="flow__panel flow__panel--send" hidden={step !== 3}>
                <h3 className="flow__q">Ready to send?</h3>
                <p className="flow__note">
                  Check the ticket, then slide. WhatsApp opens with your request already written.
                  Nothing is sent until you press send there, and we reply with the price before a truck moves.
                </p>
                <SlideToSend onSend={send} />
                {hasPhone && <p className="flow__alt">Or call <a href={`tel:${business.phone}`}>{business.phoneDisplay}</a></p>}
              </div>
            </div>

            <div className="flow__nav">
              <button type="button" className="btn btn--line" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
              {step < 3 && <button type="submit" className="btn btn--ink" data-cursor="Next">Next <Icon name="arrow" size={16} /></button>}
            </div>
          </form>

          <aside className="ticket" aria-label="Your request so far" aria-live="polite" data-reveal>
            <header className="ticket__head mono"><span>{business.name}</span><span>Job ticket</span></header>
            <p className="ticket__send">
              <span className="ticket__icon"><Icon name={p.service.icon} size={26} /></span>
              <span><span className="mono">We send</span><strong key={p.sends}>{p.sends}</strong></span>
            </p>
            <dl className="ticket__rows">
              <div><dt className="mono">Service</dt><dd key={p.service.id}>{p.service.title}</dd></div>
              <div><dt className="mono">Vehicle</dt><dd key={p.vehicle.id}>{p.vehicle.full}</dd></div>
              <div><dt className="mono">Pickup</dt><dd className={pickup ? '' : 'is-empty'}>{pickup || 'Not set yet'}</dd></div>
              <div><dt className="mono">Drop</dt><dd className={drop ? '' : 'is-empty'}>{drop || 'Any garage you choose'}</dd></div>
            </dl>
            <div className="ticket__tear" aria-hidden="true" />
            <div className="ticket__fare">
              <span className="mono">{quote ? 'Estimated fare' : 'Fare'}</span>
              {quote ? <strong key={quote.total}>{rupees(quote.total)}</strong> : <strong className="is-text">{p.fare}</strong>}
              <small>{quote ? quote.parts : 'Confirmed on WhatsApp before dispatch'}</small>
            </div>
            <div className="ticket__bars" aria-hidden="true" />
          </aside>
        </div>
      </div>
    </section>
  )
}
