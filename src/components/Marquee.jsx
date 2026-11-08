import { cities } from '../config.js'

export default function Marquee() {
  const items = [...cities, ...cities]
  return (
    <div className="marquee" aria-label={`Service areas: ${cities.join(', ')}`}>
      <div className="marquee__track">
        {items.map((c, i) => (
          <span key={i} aria-hidden={i >= cities.length}>{c}<i>✦</i></span>
        ))}
      </div>
    </div>
  )
}
