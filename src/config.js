// Business details, services and rates. Everything the site says comes from this file.

export const business = {
  name: 'Towwala',
  tagline: 'Gaadi ruk gayi? Hum aa rahe hain.',
  region: 'India',
  // Phone stays hidden until the new number is bought. Fill both in and the call
  // buttons appear across the site, e.g. '+919876543210' / '+91 98765 43210'.
  phone: '',        // used for tel: links (no spaces)
  phoneDisplay: '', // shown on the page
  whatsapp: '919876543210', // country code + number, no "+"
  email: 'help@towwala.in',
}

export const hasPhone = Boolean(business.phone)

// Rates in rupees. The estimator and the rate table both read from here.
export const rates = {
  roadside: { from: 499 },
  city: { base: 1499, includedKm: 10, perKm: 40 },
  outstation: { perKm: 35 },
}

// `price` picks the fare hint: 'tow' (city tow rate), 'roadside' (from rate) or 'quote'.
export const services = [
  {
    id: 'flatbed',
    group: 'tow',
    icon: 'flatbed',
    title: 'Flatbed Transport',
    short: 'Safe transport for luxury, EV and low-clearance cars.',
    body: 'The whole car sits on the truck bed, so none of its wheels touch the road. It is the right way to move electric cars, automatics, all-wheel drives and cars that sit low.',
    points: ['Luxury and sports cars', 'Electric and hybrid cars', 'Automatic and all-wheel-drive cars', 'Showroom and workshop transfers'],
    sends: 'Flatbed truck',
    price: 'tow',
  },
  {
    id: 'bike',
    group: 'tow',
    icon: 'bike',
    title: 'Bike Towing',
    short: 'Scooters, commuter bikes and superbikes.',
    body: 'Your two-wheeler is loaded on a carrier and tied down for the trip. It is not ridden or dragged to the garage.',
    points: ['Scooters', 'Commuter motorcycles', 'Superbikes and cruisers', 'Breakdowns and accident-damaged bikes'],
    sends: 'Bike carrier',
    price: 'quote',
  },
  {
    id: 'accident',
    group: 'tow',
    icon: 'crane',
    title: 'Accident Recovery',
    short: 'Crane-assisted recovery from accidents, ditches and highways.',
    body: 'For vehicles that cannot roll: after a collision, stuck in a ditch or off the road. A crane lifts the vehicle out and we take it to the garage or yard you choose.',
    points: ['Collision-damaged vehicles', 'Vehicles in a ditch or off the road', 'Highway breakdowns', 'Tow to your insurer’s network garage'],
    sends: 'Recovery truck with crane',
    price: 'quote',
  },
  {
    id: 'car',
    group: 'tow',
    icon: 'car',
    title: 'Car Towing',
    short: 'Hatchback, sedan, SUV and other vehicle towing.',
    body: 'For breakdowns where the car has to go to a garage or service centre. We send a wheel-lift or a flatbed truck, depending on your car.',
    points: ['Hatchbacks and sedans', 'SUVs and MUVs', 'Engine, clutch or gearbox failure', 'Drop at any garage or service centre'],
    sends: 'Wheel-lift or flatbed truck',
    price: 'tow',
  },
  {
    id: 'battery',
    group: 'roadside',
    icon: 'battery',
    title: 'Battery Jumpstart',
    short: 'Emergency assistance for dead batteries.',
    body: 'A technician comes to where the car is parked and jumpstarts it. If it still does not start, we can tow it to a garage.',
    points: ['Car will not crank', 'Lights or music left on', 'Car parked for a long time'],
    sends: 'Technician with a jumpstart kit',
    price: 'roadside',
  },
  {
    id: 'tyre',
    group: 'roadside',
    icon: 'tyre',
    title: 'Flat Tyre Help',
    short: 'Puncture repair and spare tyre replacement.',
    body: 'We fit your spare wheel or repair the puncture where you are stopped, so you can drive on.',
    points: ['Spare wheel fitting', 'Puncture repair', 'Tow to a tyre shop if the tyre is beyond repair'],
    sends: 'Technician for the tyre',
    price: 'roadside',
  },
  {
    id: 'fuel',
    group: 'roadside',
    icon: 'fuel',
    title: 'Fuel Delivery',
    short: 'Emergency petrol or diesel delivery.',
    body: 'Ran out of fuel? We bring enough petrol or diesel to get you to the next pump. Fuel is charged at actuals.',
    points: ['Petrol', 'Diesel', 'City roads and highways'],
    sends: 'Petrol or diesel, brought to you',
    price: 'roadside',
  },
  {
    id: 'key',
    group: 'roadside',
    icon: 'key',
    title: 'Lockout Help',
    short: 'Damage-free car unlocking when keys are locked inside.',
    body: 'Keys locked inside the car? A trained technician opens it without damaging the door, lock or glass.',
    points: ['Keys left inside the car', 'Keys locked in the boot'],
    sends: 'Technician to unlock the car',
    price: 'roadside',
  },
]

export const serviceGroups = [
  { id: 'tow', label: 'Towing and recovery' },
  { id: 'roadside', label: 'Roadside help' },
]

export const vehicles = [
  { id: 'car', label: 'Car', full: 'Car (hatchback or sedan)' },
  { id: 'suv', label: 'SUV', full: 'SUV / MUV' },
  { id: 'luxury', label: 'Luxury / EV', full: 'Luxury car / EV' },
  { id: 'bike', label: 'Bike', full: 'Two-wheeler' },
  { id: 'commercial', label: 'Commercial', full: 'Commercial vehicle' },
]

// The story told beside the 3D truck as the page scrolls.
export const loading = [
  { title: 'Send your location', text: 'Message us on WhatsApp from where you have stopped. One tap shares your GPS pin, and we confirm the price before a truck is sent.' },
  { title: 'The bed slides back', text: 'The flatbed slides off the back of the truck and tilts until its tail rests on the road.' },
  { title: 'Your car is winched on', text: 'A steel cable pulls the car up the bed. Nobody drives it and none of its wheels are dragged.' },
  { title: 'Levelled and strapped', text: 'The bed comes back level and locks. All four wheels are strapped down.' },
  { title: 'On the way', text: 'Your car rides on the bed to the garage or service centre you choose.' },
]


export const steps = [
  { title: 'Send your location', text: 'Message us on WhatsApp with where you are and what has happened. One tap shares your GPS pin.' },
  { title: 'Get the price', text: 'We tell you the full fare before a truck is sent. That is the amount you pay.' },
  { title: 'Truck on the way', text: 'The nearest available truck is assigned. You get the driver’s name and a live tracking link.' },
  { title: 'Dropped at your garage', text: 'Your vehicle is loaded, secured and taken to the garage or service centre you choose.' },
]

// Cities and highways shown under "Where we work".
export const cities = [
  'Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Kolkata',
  'Jaipur', 'Lucknow', 'Chandigarh', 'Indore',
  'Mumbai–Pune Expressway', 'NH-48', 'Yamuna Expressway',
]

export const faqs = [
  { q: 'How long will the truck take?', a: 'It depends on where you are, the traffic and which truck is free nearest to you. We give you an honest estimate before you confirm, and share live tracking so you can see where the driver is.' },
  { q: 'Do you work at night and on holidays?', a: 'Yes. We are open 24 hours a day, 7 days a week, including Diwali, Holi and every other holiday.' },
  { q: 'How is the towing charge calculated?', a: 'A fixed base fare covers the first 10 km. After that there is a per-km rate. You get the full price before we send a truck.' },
  { q: 'Is my car safe during towing?', a: 'Automatic, electric and luxury cars go on a flatbed. Vehicles are secured with soft straps and wheel locks, and every trip is tracked.' },
  { q: 'Can you work with my insurance?', a: 'Yes. We give you a GST invoice and photos for your claim, and can tow straight to your insurer’s network garage.' },
]
