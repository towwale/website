import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { heroState, reducedMotion } from '../lib/scroll.js'

// The hero line in five languages. One joke, told with each language's own idiom:
// "Your car let you down? We won't. One call is enough."
// hi: dhokha dena (to betray) · kn: kai kodu (to let down) · ta: kaalai vaaru (to trip
// someone up), with a pun on kaal/"call" · te: hand ivvadam (to ditch someone).
const HEADLINES = [
  { code: 'en', label: 'English', lines: ['Car ghosted you?', 'We won’t.', 'One call. Sorted.'] },
  { code: 'hi', label: 'हिन्दी', lines: ['गाड़ी ने धोखा दिया?', 'हम नहीं देंगे।', 'बस एक कॉल काफ़ी है।'] },
  { code: 'kn', label: 'ಕನ್ನಡ', lines: ['ಗಾಡಿ ಕೈ ಕೊಡ್ತಾ?', 'ನಾವು ಕೊಡಲ್ಲ.', 'ಒಂದು ಕಾಲ್ ಸಾಕು.'] },
  { code: 'ta', label: 'தமிழ்', lines: ['வண்டி காலை வாரிடுச்சா?', 'நாங்க வாரமாட்டோம்.', 'ஒரு கால் போதும்.'] },
  { code: 'te', label: 'తెలుగు', lines: ['బండి హ్యాండ్ ఇచ్చిందా?', 'మేము ఇవ్వం.', 'ఒక్క కాల్ చాలు.'] },
]
const INTERVAL = 4.2 // seconds per language

export default function HeroHeadline({ ready, active }) {
  const [index, setIndex] = useState(0)
  const title = useRef()
  const current = useRef(0)
  const busy = useRef(false)
  const first = useRef(true)

  const go = useCallback((next) => {
    if (busy.current || next === current.current) return
    current.current = next
    if (reducedMotion) { setIndex(next); return }
    busy.current = true
    gsap.to(title.current.querySelectorAll('.line > span'), {
      yPercent: -135, duration: 0.45, stagger: 0.04, ease: 'power3.in',
      onComplete: () => setIndex(next),
    })
  }, [])

  // Bring the new language's lines up from below.
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return }
    if (reducedMotion) return
    gsap.fromTo(title.current.querySelectorAll('.line > span'),
      { yPercent: 135 },
      { yPercent: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out', onComplete: () => { busy.current = false } })
  }, [index])

  // Tell the 3D scene where the headline ends. Keep the widest line seen at this screen size.
  useEffect(() => {
    const measure = () => {
      if (!title.current) return
      const right = Math.max(...[...title.current.querySelectorAll('.line > span')].map((el) => el.getBoundingClientRect().right))
      heroState.textRight = Math.max(heroState.textRight, right)
    }
    const onResize = () => { heroState.textRight = 0; measure() }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [index])

  // Cycle through the languages on its own.
  useEffect(() => {
    if (!ready || !active || reducedMotion) return
    // Skip ticks while the tab is in the background, so changes don't pile up.
    const id = setInterval(() => { if (!document.hidden) go((current.current + 1) % HEADLINES.length) }, INTERVAL * 1000)
    return () => clearInterval(id)
  }, [ready, active, go])

  const h = HEADLINES[index]
  return (
    <h1 className="hero__title" ref={title} lang={h.code} data-lang={h.code}>
      <span className="line"><span>{h.lines[0]}</span></span>
      <span className="line"><span>{h.lines[1]}</span></span>
      <span className="line"><span><em>{h.lines[2]}</em></span></span>
    </h1>
  )
}
