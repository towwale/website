import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { business, rates, services, vehicles } from '../config.js'
import { scrollToElement } from './scroll.js'

// The service and vehicle a visitor has picked. Shared so the request form and the
// "Request" buttons across the page stay in step.
const RequestContext = createContext(null)

const TOW_BY_VEHICLE = { flatbed: true, car: true, bike: true }

export function RequestProvider({ children }) {
  const [need, setNeedState] = useState('flatbed')
  const [vehicle, setVehicleState] = useState('car')

  const setNeed = useCallback((id) => {
    setNeedState(id)
    setVehicleState((v) => {
      if (id === 'bike') return 'bike'
      if ((id === 'flatbed' || id === 'car' || id === 'key') && v === 'bike') return 'car'
      return v
    })
  }, [])

  const setVehicle = useCallback((id) => {
    setVehicleState(id)
    setNeedState((n) => {
      if (id === 'bike' && TOW_BY_VEHICLE[n]) return 'bike'
      if (id !== 'bike' && n === 'bike') return id === 'luxury' ? 'flatbed' : 'car'
      return n
    })
  }, [])

  // Pick a service from elsewhere on the page and bring the booking flow into view,
  // already on its location step.
  const request = useCallback((id) => {
    setNeed(id)
    const form = document.getElementById('book')
    if (!form) return
    scrollToElement(form, { offset: -96 })
    window.dispatchEvent(new CustomEvent('towwala:request'))
  }, [setNeed])

  const value = useMemo(() => ({ need, vehicle, setNeed, setVehicle, request }), [need, vehicle, setNeed, setVehicle, request])
  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
}

export const useRequest = () => useContext(RequestContext)

export const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

export function fareHint(kind) {
  if (kind === 'tow') {
    const { base, includedKm, perKm } = rates.city
    return `${rupees(base)} for the first ${includedKm} km, then ${rupees(perKm)} per km`
  }
  if (kind === 'roadside') return `From ${rupees(rates.roadside.from)}`
  return 'Price confirmed on WhatsApp before dispatch'
}

// What we would send for this service and vehicle.
export function plan(needId, vehicleId) {
  const service = services.find((s) => s.id === needId) ?? services[0]
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0]
  const isBike = vehicle.id === 'bike'

  let sends = service.sends
  if (service.id === 'car' && vehicle.id === 'luxury') sends = 'Flatbed truck'
  if (service.id === 'accident' && isBike) sends = 'Bike carrier'

  return { service, vehicle, sends, fare: fareHint(service.price) }
}

export function whatsappUrl(text) {
  const base = `https://wa.me/${business.whatsapp}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
