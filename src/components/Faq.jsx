import Lines from './Lines.jsx'
import { faqs } from '../config.js'

// Native <details>: works without JS, is keyboard accessible, and the answers stay in the page for search engines.
export default function Faq() {
  return (
    <section className="section faq" id="faq" aria-labelledby="faq-title">
      <div className="wrap faq__grid">
        <div className="faq__lead">
          <p className="kicker mono" data-reveal>Questions</p>
          <Lines id="faq-title" className="display-l" rows={['Asked', 'before', <span className="dim" key="c">booking.</span>]} />
        </div>
        <div className="faq__list" data-reveal>
          {faqs.map((f, i) => (
            <details key={f.q} name="faq" open={i === 0}>
              <summary>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="faq__q">{f.q}</span>
                <span className="faq__mark" aria-hidden="true" />
              </summary>
              <div className="faq__answer"><p>{f.a}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
