import { useEffect, useRef, useState } from 'react'
import { loading } from '../config.js'
import { onFrame } from '../lib/scroll.js'
import { LOAD_STEPS, loadStepAt, loadingAt, rig } from '../three/rig.js'

// Scenes 2 and 3: the breakdown and the loading. The section is pinned; scrolling plays the
// recovery on the truck while the captions keep pace. One huge word per step sits in the
// sky behind the truck and slides across as that step plays.
const STEPS = loading.slice(0, 4)
const WORDS = ['Stranded', 'Roll back', 'Winch on', 'Strap down']
export const clockLabel = (h) => {
  const m = Math.round(h * 60)
  const hh = Math.floor(m / 60) % 24
  return `${String(hh % 12 || 12).padStart(2, '0')}:${String(m % 60).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`
}

export default function Sequence() {
  const [step, setStep] = useState(0)
  const fill = useRef(null)
  const time = useRef(null)
  const words = useRef([])

  useEffect(() => onFrame((u) => {
    const t = Math.min(1, Math.max(0, (u - 2) / 2)) // through this section
    const next = loadStepAt(u)
    setStep((s) => (s === next ? s : next))
    fill.current.style.transform = `scaleX(${t})`
    const label = clockLabel(rig.clock)
    if (time.current.textContent !== label) time.current.textContent = label

    // Word 0 runs through the breakdown; the rest each run through their loading step.
    const q = loadingAt(u)
    words.current.forEach((el, i) => {
      const w = i === 0 ? (u - 2) / 0.47 : (q - LOAD_STEPS[i]) / ((LOAD_STEPS[i + 1] ?? 1) - LOAD_STEPS[i])
      const on = u >= 1.9 && u <= 4.1 && w > -0.25 && w < 1.25
      el.style.visibility = on ? 'visible' : 'hidden'
      if (on) el.style.transform = `translate3d(${(0.5 - w) * 150}vw, 0, 0)`
    })
  }), [])

  return (
    <section className="seq" id="how-it-loads" aria-labelledby="seq-title">
      <div className="seq__words" aria-hidden="true">
        {WORDS.map((w, i) => <p key={w} ref={(el) => { words.current[i] = el }}>{w}</p>)}
      </div>
      <div className="seq__sticky">
        <div className="wrap seq__ui">
          <header className="seq__head mono">
            <h2 id="seq-title">How a tow works, start to finish</h2>
            <p className="seq__clock"><span ref={time}>08:00 AM</span> IST</p>
          </header>

          <ol className="seq__steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className={i === step ? 'is-active' : ''} aria-current={i === step ? 'step' : undefined}>
                <p className="seq__num mono">0{i + 1} <span>/ 0{STEPS.length}</span></p>
                <h3>{s.title}</h3>
                <p className="seq__text">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="seq__rail" aria-hidden="true">
            <span className="seq__fill" ref={fill} />
          </div>
        </div>
      </div>
    </section>
  )
}
