import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { stage } from '../three/rig.js'

const Stage = lazy(() => import('../three/Stage.jsx'))

// If WebGL is unavailable the page still works, just without the truck.
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { stage.ready = true }
  render() { return this.state.failed ? null : this.props.children }
}

// The 3D canvas. It stays pinned behind the hero and the loading sequence.
export default function StageMount() {
  const root = useRef(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '80px' })
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  return (
    <>
    <div className="sky" aria-hidden="true" />
    <div className="stage" ref={root} aria-hidden="true">
      <Boundary>
        <Suspense fallback={null}>
          <Stage active={active} />
        </Suspense>
      </Boundary>
    </div>
    </>
  )
}
