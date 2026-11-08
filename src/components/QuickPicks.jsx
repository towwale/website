import Icon from './Icon.jsx'
import { getLenis } from '../lib/scroll.js'

// "What happened?" shortcuts. Each one jumps to the booking form with the problem filled in.
const picks = [
  { label: 'Need a tow', issue: 'Needs towing', icon: 'flatbed' },
  { label: 'Flat tyre', issue: 'Flat tyre', icon: 'tyre' },
  { label: 'Battery dead', issue: 'Battery dead', icon: 'battery' },
  { label: 'Accident', issue: 'Accident', icon: 'crash' },
  { label: 'Out of fuel', issue: 'Out of fuel', icon: 'fuel' },
]

export default function QuickPicks() {
  const pick = (issue) => {
    window.dispatchEvent(new CustomEvent('towwala:issue', { detail: issue }))
    const lenis = getLenis()
    if (lenis) lenis.scrollTo('#book', { offset: -60 })
    else document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="hero__fade hero__picks" role="group" aria-label="What happened?">
      <span className="hero__picks-label">What happened?</span>
      {picks.map((p) => (
        <button key={p.issue} type="button" onClick={() => pick(p.issue)}>
          <Icon name={p.icon} size={16} /> {p.label}
        </button>
      ))}
    </div>
  )
}
