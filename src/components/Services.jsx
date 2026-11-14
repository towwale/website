import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import Lines from './Lines.jsx'
import { services } from '../config.js'
import { onFrame } from '../lib/scroll.js'
import { fareHint, useRequest } from '../lib/request.jsx'

const wide = () => window.matchMedia('(min-width: 900px)').matches

// On wide screens the section pins and vertical scrolling moves the cards sideways.
// On phones it is an ordinary swipeable row.
export default function Services() {
  const root = useRef(null)
  const track = useRef(null)
  const bar = useRef(null)
  const { request } = useRequest()

  useEffect(() => {
    let travel = 0
    const size = () => {
      if (!wide()) { root.current.style.height = ''; track.current.style.transform = ''; travel = 0; return }
      travel = Math.max(0, track.current.scrollWidth - window.innerWidth)
      root.current.style.height = `${window.innerHeight + travel}px`
    }
    size()
    window.addEventListener('resize', size)
    document.fonts?.ready.then(size)
    let last = window.scrollY, lean = 0, lit = -1
    const cards = [...track.current.querySelectorAll('.card')]
    const off = onFrame((u) => {
      // The card for the load now on the truck is lit.
      const now = u >= 5 && u < 6 ? Math.min(cards.length - 1, Math.floor((u - 5) * cards.length)) : -1
      if (now !== lit) { cards[lit]?.classList.remove('is-active'); cards[now]?.classList.add('is-active'); lit = now }
      if (!travel) return
      const y = window.scrollY
      lean += (Math.max(-7, Math.min(7, (y - last) * 0.22)) - lean) * 0.12
      last = y
      const r = root.current.getBoundingClientRect()
      const t = Math.min(1, Math.max(0, -r.top / travel))
      track.current.style.transform = `translate3d(${-t * travel}px, 0, 0) skewX(${(-lean).toFixed(2)}deg)`
      bar.current.style.transform = `scaleX(${t})`
    })
    return () => { off(); window.removeEventListener('resize', size) }
  }, [])

  // Cards lean towards the pointer and carry a soft highlight under it.
  const lean = (e) => {
    if (e.pointerType !== 'mouse') return
    const card = e.target.closest('.card')
    if (!card) return
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    card.style.setProperty('--ry', `${(x - 0.5) * 9}deg`)
    card.style.setProperty('--rx', `${(0.5 - y) * 7}deg`)
    card.style.setProperty('--mx', `${x * 100}%`)
    card.style.setProperty('--my', `${y * 100}%`)
  }
  const settle = (e) => {
    const card = e.target.closest('.card')
    if (!card || card.contains(e.relatedTarget)) return
    card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg')
  }

  return (
    <section className="hs" id="services" ref={root} aria-labelledby="services-title">
      <div className="hs__sticky">
        <div className="hs__track" ref={track} onPointerMove={lean} onPointerOut={settle}>
          <div className="hs__intro">
            <p className="kicker mono" data-reveal>Services</p>
            <Lines id="services-title" className="display-l" rows={['Towing', 'and roadside', <span className="dim" key="c">help.</span>]} />
            <p data-reveal>
              Flatbed transport, bike towing and accident recovery are what we do most.
              We also tow cars of every size and handle the smaller problems that stop a drive.
            </p>
          </div>

          {services.map((s, i) => (
            <article className="card" key={s.id} id={`service-${s.id}`}>
              <header className="card__top mono">
                <span>{String(i + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}</span>
                <span>{s.group === 'tow' ? 'Towing' : 'Roadside'}</span>
              </header>
              <span className="card__icon"><Icon name={s.icon} size={34} /></span>
              <h3>{s.title}</h3>
              <p className="card__short">{s.short}</p>
              <p className="card__body">{s.body}</p>
              <ul className="card__points">
                {s.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <footer className="card__foot">
                <p className="mono"><span>Fare</span>{fareHint(s.price)}</p>
                <button type="button" className="btn btn--ink" onClick={() => request(s.id)} data-cursor="Request">
                  Request <Icon name="arrow" size={16} />
                </button>
              </footer>
            </article>
          ))}
        </div>
        <div className="hs__bar" aria-hidden="true"><span ref={bar} /></div>
      </div>
    </section>
  )
}
