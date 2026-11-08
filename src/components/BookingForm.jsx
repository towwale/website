import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { business, vehicleTypes, issueTypes } from '../config.js'

// No backend needed: the form opens WhatsApp with a ready-to-send message.
export default function BookingForm({ compact = false }) {
  const [form, setForm] = useState({
    name: '', phone: '', vehicle: vehicleTypes[0], issue: issueTypes[0], location: '', drop: '',
  })
  const [coords, setCoords] = useState(null)

  // A "What happened?" pick in the hero fills in the problem.
  useEffect(() => {
    const onPick = (e) => { if (issueTypes.includes(e.detail)) setForm((f) => ({ ...f, issue: e.detail })) }
    window.addEventListener('towwala:issue', onPick)
    return () => window.removeEventListener('towwala:issue', onPick)
  }, [])
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location is not supported on this device.')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) })
        setForm((f) => ({ ...f, location: f.location || 'My current location (pin attached)' }))
        setLocating(false)
      },
      () => {
        setLocError('Could not get your location. Please type it instead.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const submit = (e) => {
    e.preventDefault()
    const lines = [
      `*New ${business.name} request*`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Vehicle: ${form.vehicle}`,
      `Problem: ${form.issue}`,
      `Pickup: ${form.location}`,
      coords && `Map: https://maps.google.com/?q=${coords.lat},${coords.lng}`,
      form.drop && `Drop: ${form.drop}`,
    ].filter(Boolean)
    const url = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <form className={`booking ${compact ? 'booking--compact' : ''}`} onSubmit={submit}>
      <div className="booking__head">
        <h2>Request a tow</h2>
        <p>Get a fixed quote before anything moves</p>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Your name</span>
          <input required value={form.name} onChange={update('name')} placeholder="Rahul Sharma" autoComplete="name" />
        </label>
        <label className="field">
          <span>Mobile number</span>
          <input
            required type="tel" inputMode="numeric" pattern="[0-9+\s]{10,14}"
            value={form.phone} onChange={update('phone')} placeholder="98765 43210" autoComplete="tel"
          />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Vehicle</span>
          <select value={form.vehicle} onChange={update('vehicle')}>
            {vehicleTypes.map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Problem</span>
          <select value={form.issue} onChange={update('issue')}>
            {issueTypes.map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Pickup location</span>
        <div className="field__with-btn">
          <input required value={form.location} onChange={update('location')} placeholder="Area, landmark or highway km" />
          <button type="button" className="locate-btn" onClick={useMyLocation} disabled={locating}>
            <Icon name="locate" size={18} />
            <span>{locating ? 'Finding…' : coords ? 'Pinned' : 'Use GPS'}</span>
          </button>
        </div>
        {locError && <small className="field__error">{locError}</small>}
      </label>

      {!compact && (
        <label className="field">
          <span>Drop location <em>(optional)</em></span>
          <input value={form.drop} onChange={update('drop')} placeholder="Garage or service centre" />
        </label>
      )}

      <button type="submit" className="btn btn--amber btn--block btn--lg">
        <Icon name="whatsapp" size={20} />
        Send on WhatsApp
      </button>
      <p className="booking__alt">
        In a hurry? <a href={`tel:${business.phone}`}>Call {business.phoneDisplay}</a>
      </p>
    </form>
  )
}
