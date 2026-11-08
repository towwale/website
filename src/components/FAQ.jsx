import { useState } from 'react'
import { faqs } from '../config.js'

export default function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section faq-sec" id="faq">
      <div className="wrap faq">
        <div className="faq__head">
          <p className="eyebrow" data-reveal>FAQ</p>
          <h2 className="h2" data-reveal>Good<br /><em>questions.</em></h2>
        </div>
        <div className="faq__list">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`faq__item ${isOpen ? 'is-open' : ''}`} data-reveal>
                <button className="faq__q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="faq__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="faq__t">{f.q}</span>
                  <span className="faq__plus" aria-hidden="true" />
                </button>
                <div className="faq__a"><div><p>{f.a}</p></div></div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
