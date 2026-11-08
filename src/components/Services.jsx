import ServiceArt from './Illustrations.jsx'
import { services } from '../config.js'

const spot = (e) => {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
}

export default function Services() {
  return (
    <section className="section services-sec" id="services">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow" data-reveal>Services</p>
          <h2 className="h2" data-reveal>Every breakdown,<br /><em>handled.</em></h2>
          <p className="sec-head__aside" data-reveal>From a dead battery in your society parking to a crash on the expressway. Eight services, one number.</p>
        </div>
        <div className="bento">
          {services.map((s, i) => (
            <article key={s.title} className={`bento__card bento__card--${i}`} onPointerMove={spot} data-reveal>
              <div className="bento__top">
                <span className="bento__num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <ServiceArt name={s.icon} />
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
