import Icon from './Icon.jsx'
import { testimonials } from '../config.js'

export default function Reviews() {
  const items = [...testimonials, ...testimonials, ...testimonials]
  return (
    <section className="section reviews-sec" id="reviews">
      <div className="wrap sec-head">
        <p className="eyebrow" data-reveal>Stories</p>
        <h2 className="h2" data-reveal>People we got<br /><em>home safe.</em></h2>
      </div>
      <div className="reviews">
        <div className="reviews__track">
          {items.map((t, i) => (
            <figure key={i} className="review" aria-hidden={i >= testimonials.length}>
              <div className="review__stars">
                {Array.from({ length: 5 }).map((_, k) => <Icon key={k} name="star" size={14} fill="currentColor" />)}
              </div>
              <blockquote>“{t.text}”</blockquote>
              <figcaption>
                <span className="review__avatar">{t.name[0]}</span>
                <span><strong>{t.name}</strong><small>{t.city}</small></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
