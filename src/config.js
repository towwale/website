// All business details live here. Edit this file to update the whole site.

export const business = {
  name: 'Towwala',
  tagline: 'Gaadi ruk gayi? Hum aa rahe hain.',
  phone: '+919876543210',          // used for tel: links (no spaces)
  phoneDisplay: '+91 98765 43210', // shown on the page
  whatsapp: '919876543210',        // country code + number, no "+"
  email: 'help@towwala.in',
  address: 'Andheri East, Mumbai, Maharashtra 400069',
}

export const services = [
  { icon: 'car', title: 'Car Towing', text: 'Hatchback to SUV, wheel-lift or flatbed. Safe transport to any garage or service centre.' },
  { icon: 'flatbed', title: 'Flatbed Transport', text: 'Zero-wear transport for luxury, EV, automatic and low-clearance cars.' },
  { icon: 'bike', title: 'Bike Towing', text: 'Scooters, commuter bikes and superbikes moved on a dedicated carrier.' },
  { icon: 'crash', title: 'Accident Recovery', text: 'Crane-assisted recovery from ditches, ghats and highway shoulders.' },
  { icon: 'battery', title: 'Battery Jumpstart', text: 'Dead battery in the parking? We jumpstart it on the spot.' },
  { icon: 'tyre', title: 'Flat Tyre Help', text: 'Stepney change or puncture repair wherever you are stuck.' },
  { icon: 'fuel', title: 'Fuel Delivery', text: 'Ran dry on the highway? We bring enough petrol or diesel to reach a pump.' },
  { icon: 'key', title: 'Lockout Help', text: 'Keys locked inside? Damage-free unlocking by trained technicians.' },
]

export const pricing = [
  { name: 'Roadside Fix', price: '499', unit: 'onwards', features: ['Jumpstart, tyre change or fuel', 'Technician at your location', 'Fuel charged at actuals'], highlight: false },
  { name: 'City Tow', price: '1,499', unit: 'up to 10 km', features: ['Wheel-lift or flatbed', '₹40 per extra km', 'Drop at any garage'], highlight: true },
  { name: 'Highway & Outstation', price: '35', unit: 'per km', features: ['Long-distance flatbed', 'Toll at actuals', 'Live driver tracking'], highlight: false },
]

// The "how it works" steps.
export const steps = [
  { time: '01', title: 'You call', text: 'A real person picks up, not an IVR menu. Share your location on WhatsApp in one tap.' },
  { time: '02', title: 'Fixed quote', text: 'You hear the full price before anything moves. That is the price you pay. No surprises on arrival.' },
  { time: '03', title: 'Truck dispatched', text: 'The nearest available verified truck is assigned. You get the driver’s name, photo and a live tracking link.' },
  { time: '04', title: 'We’re with you', text: 'Your vehicle is loaded safely and driven to the garage of your choice.' },
]

export const stats = [
  { value: 24, suffix: '/7', label: 'Always on, including Diwali night' },
  { value: 8, suffix: ' services', label: 'From a jumpstart to crane recovery' },
  { value: 15, suffix: '+', label: 'Cities and expressways covered' },
  { value: 1, suffix: ' call', label: 'Is all it takes to get help' },
]

export const cities = [
  'Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai',
  'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore',
  'Mumbai–Pune Expressway', 'NH-48', 'Yamuna Expressway',
]

// Sample reviews — replace with genuine customer reviews before going live.
export const testimonials = [
  { name: 'Rohit S.', city: 'Pune', text: 'Car broke down on the expressway at 11 pm. The driver kept me updated the whole way and the price was exactly what they quoted.' },
  { name: 'Ananya K.', city: 'Bengaluru', text: 'They moved my EV on a flatbed to the service centre. Very careful driver, kept me updated on WhatsApp.' },
  { name: 'Imran M.', city: 'Delhi NCR', text: 'Dead battery in office parking. Jumpstarted on the spot. Saved my day.' },
]

export const faqs = [
  { q: 'How long will the truck take?', a: 'It depends on where you are, traffic and which truck is free nearest to you. We give you an honest estimate on the call before you confirm, and share live tracking so you always know where the driver is.' },
  { q: 'Do you work at night and on holidays?', a: 'Yes. We run 24 hours a day, 7 days a week, including Diwali, Holi and every other holiday.' },
  { q: 'How is the towing charge calculated?', a: 'A fixed base fare covers the first 10 km, then a per-km rate. You get the full price on the phone before we send a truck.' },
  { q: 'Is my car safe during towing?', a: 'We use flatbeds for automatic, EV and luxury cars, soft straps and wheel locks, and every trip is tracked.' },
  { q: 'Can you work with my insurance?', a: 'Yes. We provide GST invoices and photos for insurance claims, and can tow directly to your insurer’s network garage.' },
]

export const vehicleTypes = ['Car (Hatchback/Sedan)', 'SUV / MUV', 'Luxury / EV', 'Two-wheeler', 'Commercial vehicle']
export const issueTypes = ['Needs towing', 'Accident', 'Battery dead', 'Flat tyre', 'Out of fuel', 'Locked out', 'Other']
