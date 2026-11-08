import { useEffect, useRef } from 'react'

// Custom cursor for mouse users: a dot plus a ring that trails and grows over links.
export default function Cursor() {
  const dot = useRef()
  const ring = useRef()

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const ringPos = { ...pos }
    let raf

    const onMove = (e) => {
      pos.x = e.clientX; pos.y = e.clientY
      dot.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      const hot = e.target.closest('a, button, input, select, textarea, [data-cursor]')
      ring.current.classList.toggle('is-hot', !!hot)
      ring.current.dataset.label = hot?.dataset.cursor || ''
    }
    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18
      ringPos.y += (pos.y - ringPos.y) * 0.18
      ring.current.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`
      raf = requestAnimationFrame(loop)
    }
    const hide = () => document.documentElement.classList.add('cursor-hidden')
    const show = () => document.documentElement.classList.remove('cursor-hidden')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseleave', hide)
    document.addEventListener('mouseenter', show)
    loop()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseleave', hide)
      document.removeEventListener('mouseenter', show)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
