import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { heroState, reducedMotion } from '../lib/scroll.js'
import { business } from '../config.js'

const BG = { night: '#06080b', day: '#e9e4d9' }
const SPEED = reducedMotion ? 0 : 9 // road units per second
const lerp = (a, b, t) => a + (b - a) * t

/* ---------- materials ---------- */
function useMaterials() {
  return useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: '#ffb000', metalness: 0.25, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04 }),
    carPaint: new THREE.MeshPhysicalMaterial({ color: '#7a0a16', metalness: 0.7, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.03 }),
    gloss: new THREE.MeshPhysicalMaterial({ color: '#0c0d10', metalness: 0.3, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0a0f15', metalness: 0.4, roughness: 0.04, clearcoat: 1, side: THREE.DoubleSide }),
    dark: new THREE.MeshStandardMaterial({ color: '#15181d', metalness: 0.5, roughness: 0.6 }),
    deck: new THREE.MeshStandardMaterial({ color: '#4a5059', metalness: 0.9, roughness: 0.42 }),
    rim: new THREE.MeshStandardMaterial({ color: '#2e333b', metalness: 0.9, roughness: 0.28 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e6e9ee', metalness: 1, roughness: 0.1 }),
    tyre: new THREE.MeshStandardMaterial({ color: '#0b0c0e', roughness: 0.9, side: THREE.DoubleSide }),
    head: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff4dc', emissiveIntensity: 9, toneMapped: false }),
    tail: new THREE.MeshStandardMaterial({ color: '#ff2a1f', emissive: '#ff1a10', emissiveIntensity: 6, toneMapped: false }),
    beacon: new THREE.MeshStandardMaterial({ color: '#ff9a00', emissive: '#ff8200', emissiveIntensity: 10, toneMapped: false }),
    marker: new THREE.MeshStandardMaterial({ color: '#ffb400', emissive: '#ff9a00', emissiveIntensity: 4, toneMapped: false }),
    strap: new THREE.MeshStandardMaterial({ color: '#c98a00', roughness: 0.8 }),
    bumper: new THREE.MeshStandardMaterial({ color: '#2b3038', metalness: 0.75, roughness: 0.32 }),
  }), [])
}

/* ---------- canvas textures ---------- */
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  // Resetting the width clears the canvas and its drawing state (alignment, fonts) before each paint.
  const paint = () => { c.width = w; draw(c.getContext('2d'), w, h); t.needsUpdate = true }
  paint()
  // Repaint once the exact font weights have loaded, so the lettering is never missing or in Arial.
  document.fonts?.load?.('800 80px "Inter Tight"')
    .then(() => Promise.all(['600', '700'].map((wt) => document.fonts.load(`${wt} 30px "Inter Tight"`))))
    .then(paint, paint)
  return t
}

function logoMark(g, x, y, s, bg, fg) {
  g.save()
  g.fillStyle = bg
  g.beginPath(); g.roundRect(x, y, s, s, s * 0.24); g.fill()
  g.beginPath(); g.roundRect(x + s * 0.2, y + s * 0.3, s * 0.6, s * 0.36, 2); g.clip()
  g.fillStyle = fg
  for (let i = -2; i < 6; i++) {
    g.beginPath()
    g.moveTo(x + i * s * 0.2, y + s); g.lineTo(x + i * s * 0.2 + s * 0.1, y + s)
    g.lineTo(x + i * s * 0.2 + s * 0.6, y); g.lineTo(x + i * s * 0.2 + s * 0.5, y); g.fill()
  }
  g.restore()
}

function useBrand() {
  return useMemo(() => ({
    // Side toolbox: dark panel, amber speed stripes, name and number.
    side: canvasTexture(1024, 168, (g, w, h) => {
      g.fillStyle = '#0c0d10'; g.fillRect(0, 0, w, h)
      g.fillStyle = '#ffb400'
      for (let i = 0; i < 3; i++) {
        const x = 24 + i * 34
        g.beginPath(); g.moveTo(x, h - 24); g.lineTo(x + 18, h - 24); g.lineTo(x + 58, 24); g.lineTo(x + 40, 24); g.fill()
      }
      g.textBaseline = 'middle'
      g.font = '800 86px "Inter Tight", Arial, sans-serif'
      g.fillText('TOWWALA', 170, h / 2 + 4)
      g.textAlign = 'right'
      g.fillStyle = '#d9d4c7'
      g.font = '600 28px "Inter Tight", Arial, sans-serif'
      g.fillText('ROADSIDE ASSISTANCE', w - 34, h / 2 - 20)
      g.fillStyle = '#ffffff'
      g.font = '700 38px "Inter Tight", Arial, sans-serif'
      g.fillText(business.phoneDisplay, w - 34, h / 2 + 24)
    }),
    // Door badge on the amber cab.
    door: canvasTexture(512, 128, (g, w, h) => {
      logoMark(g, 10, 22, 84, '#0c0d10', '#ffb400')
      g.fillStyle = '#0c0d10'
      g.textBaseline = 'middle'
      g.font = '800 70px "Inter Tight", Arial, sans-serif'
      g.fillText('Towwala', 112, h / 2 + 3)
    }),
    // Red and white rear chevrons.
    chevron: canvasTexture(512, 64, (g, w, h) => {
      g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w, h)
      g.fillStyle = '#d0121c'
      for (let x = -64; x < w + 64; x += 64) {
        g.beginPath(); g.moveTo(x, h); g.lineTo(x + 32, h); g.lineTo(x + 64, 0); g.lineTo(x + 32, 0); g.fill()
      }
    }),
  }), [])
}

function useGlow() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, 'rgba(255,214,150,1)')
    grd.addColorStop(0.4, 'rgba(255,180,90,.35)')
    grd.addColorStop(1, 'rgba(255,160,60,0)')
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
}

/* ---------- geometry helpers ---------- */
// Extrude a side profile (drawn in x/y) across the vehicle's width, centred on z = 0.
function extrude(shape, depth, bevel = 0.05) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 28,
  })
  g.translate(0, 0, -depth / 2)
  g.computeVertexNormals()
  return g
}

const sides = [1, -1]

/* ---------- wheels ---------- */
function Wheel({ position, r = 0.46, w = 0.36, m, spin = true }) {
  const ref = useRef()
  const outer = position[2] < 0 ? -1 : 1
  const tyre = useMemo(() => {
    const e = Math.min(0.07, w * 0.22)
    const pts = [
      [r * 0.66, -w / 2], [r - e, -w / 2], [r - e * 0.3, -w / 2 + e * 0.3], [r, -w / 2 + e],
      [r, w / 2 - e], [r - e * 0.3, w / 2 - e * 0.3], [r - e, w / 2], [r * 0.66, w / 2],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(pts, 48)
  }, [r, w])
  useFrame((_, dt) => { if (spin) ref.current.rotation.z -= (SPEED / r) * dt })
  return (
    <group position={position} ref={ref}>
      <mesh geometry={tyre} rotation-x={Math.PI / 2} material={m.tyre} castShadow />
      <mesh rotation-x={Math.PI / 2} material={m.rim}><cylinderGeometry args={[r * 0.66, r * 0.66, w * 0.8, 36]} /></mesh>
      {/* six-spoke alloy face on the outside */}
      <group position-z={outer * w * 0.41}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-z={(i * Math.PI) / 3} material={m.chrome}><boxGeometry args={[r * 0.12, r * 1.2, 0.03]} /></mesh>
        ))}
        <mesh rotation-x={Math.PI / 2} material={m.chrome}><cylinderGeometry args={[r * 0.17, r * 0.17, 0.05, 24]} /></mesh>
        <mesh rotation-x={Math.PI / 2} material={m.rim}><torusGeometry args={[r * 0.6, r * 0.05, 8, 40]} /></mesh>
      </group>
    </group>
  )
}

/* ---------- lights ---------- */
function Beacon({ m }) {
  const light = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const on = reducedMotion ? 1 : Math.max(0, Math.sin(t * 8)) ** 0.5
    m.beacon.emissiveIntensity = 1 + on * 12
    light.current.intensity = on * 14
  })
  return (
    <group position={[2.62, 2.5, 0]}>
      <RoundedBox args={[0.3, 0.07, 1.56]} radius={0.03} material={m.gloss} />
      {[-0.56, -0.28, 0, 0.28, 0.56].map((z) => (
        <RoundedBox key={z} args={[0.22, 0.09, 0.22]} radius={0.035} position={[0, 0.07, z]} material={m.beacon} />
      ))}
      <pointLight ref={light} color="#ff9000" distance={9} decay={1.6} position={[0, 0.5, 0]} />
    </group>
  )
}

function Headlights({ m, day }) {
  const target = useMemo(() => { const o = new THREE.Object3D(); o.position.set(14, -0.4, 0); return o }, [])
  const beam = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#fff1d0', transparent: true, opacity: day ? 0 : 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), [day])
  return (
    <group>
      <primitive object={target} />
      {sides.map((s) => (
        <group key={s} position={[3.44, 1.47, s * 0.74]}>
          <RoundedBox args={[0.03, 0.16, 0.5]} radius={0.012} material={m.glass} />
          <mesh position={[0.018, 0.05, -s * 0.02]} material={m.head}><boxGeometry args={[0.01, 0.026, 0.42]} /></mesh>
          <mesh position={[0.018, 0.0, s * 0.2]} material={m.head}><boxGeometry args={[0.01, 0.12, 0.026]} /></mesh>
          {[-0.14, 0.02].map((z) => (
            <mesh key={z} position={[0.016, -0.03, s * z]} rotation-z={Math.PI / 2} material={m.head}><cylinderGeometry args={[0.032, 0.032, 0.012, 20]} /></mesh>
          ))}
          <mesh material={beam} position={[3.2, -0.6, 0]} rotation-z={Math.PI / 2 + 0.16}>
            <coneGeometry args={[1.1, 6.4, 32, 1, true]} />
          </mesh>
        </group>
      ))}
      <spotLight position={[3.5, 1.45, 0]} target={target} angle={0.55} penumbra={0.6} intensity={day ? 12 : 60} distance={22} color="#fff1d6" castShadow />
    </group>
  )
}

/* ---------- the rescued car: a fastback EV ---------- */
function Car({ m }) {
  const { body, cabin } = useMemo(() => {
    const b = new THREE.Shape()
    b.moveTo(-1.68, 0.36)
    b.lineTo(-1.42, 0.36)
    b.absarc(-1.05, 0.32, 0.38, Math.PI - 0.106, 0.106, true)
    b.lineTo(0.68, 0.36)
    b.absarc(1.05, 0.32, 0.38, Math.PI - 0.106, 0.106, true)
    b.lineTo(1.68, 0.36)
    b.quadraticCurveTo(1.76, 0.5, 1.72, 0.62)
    b.quadraticCurveTo(1.6, 0.76, 1.15, 0.82)
    b.lineTo(-1.2, 0.86)
    b.quadraticCurveTo(-1.62, 0.86, -1.7, 0.7)
    b.lineTo(-1.68, 0.36)
    const c = new THREE.Shape()
    c.moveTo(-1.22, 0.84)
    c.quadraticCurveTo(-0.95, 1.3, -0.35, 1.32)
    c.lineTo(0.2, 1.32)
    c.quadraticCurveTo(0.55, 1.3, 1.05, 0.84)
    c.lineTo(-1.22, 0.84)
    return { body: extrude(b, 1.66, 0.07), cabin: extrude(c, 1.36, 0.06) }
  }, [])

  return (
    <group>
      <mesh geometry={body} material={m.carPaint} castShadow />
      <mesh geometry={cabin} material={m.glass} castShadow />
      {/* thin paint roof rails and pillars over the glass */}
      {sides.map((s) => (
        <group key={s}>
          <mesh position={[-0.12, 0.85, s * 0.9]} material={m.gloss}><boxGeometry args={[2.3, 0.04, 0.02]} /></mesh>
          <mesh position={[-0.05, 1.08, s * 0.71]} material={m.gloss}><boxGeometry args={[0.06, 0.46, 0.02]} /></mesh>
          <mesh position={[0.28, 0.72, s * 0.9]} material={m.chrome}><boxGeometry args={[0.16, 0.025, 0.02]} /></mesh>
          <mesh position={[-0.55, 0.72, s * 0.9]} material={m.chrome}><boxGeometry args={[0.16, 0.025, 0.02]} /></mesh>
          <RoundedBox args={[0.14, 0.08, 0.12]} radius={0.03} position={[0.78, 0.92, s * 0.9]} material={m.gloss} />
          <mesh position={[1.72, 0.64, s * 0.5]} rotation-y={s * 0.25} material={m.head}><boxGeometry args={[0.02, 0.025, 0.42]} /></mesh>
        </group>
      ))}
      {/* full-width rear light bar */}
      <mesh position={[-1.74, 0.72, 0]} material={m.tail}><boxGeometry args={[0.02, 0.035, 1.5]} /></mesh>
      {[1.05, -1.05].map((x) => sides.map((s) => (
        <Wheel key={`${x}${s}`} position={[x, 0.32, s * 0.78]} r={0.31} w={0.24} m={m} spin={false} />
      )))}
      {/* tie-down straps over each wheel */}
      {[1.05, -1.05].map((x) => sides.map((s) => [-1, 1].map((d) => (
        <mesh key={`${x}${s}${d}`} position={[x + d * 0.24, 0.17, s * 0.91]} rotation-z={-d * 0.75} material={m.strap}>
          <boxGeometry args={[0.3, 0.022, 0.012]} />
        </mesh>
      ))))}
    </group>
  )
}

/* ---------- truck ---------- */
function Truck({ day }) {
  const m = useMaterials()
  const brand = useBrand()
  const body = useRef()

  const geo = useMemo(() => {
    // Cab-over cab with a raked windscreen and a cut-out for the front wheel.
    const cab = new THREE.Shape()
    cab.moveTo(1.66, 0.8)
    cab.lineTo(1.88, 0.8)
    cab.absarc(2.35, 0.46, 0.56, Math.PI - 0.608, 0.608, true)
    cab.lineTo(3.36, 0.8)
    cab.lineTo(3.33, 1.56)
    cab.quadraticCurveTo(3.32, 1.64, 3.25, 1.67)
    cab.lineTo(3.0, 2.3)
    cab.quadraticCurveTo(2.94, 2.42, 2.8, 2.42)
    cab.lineTo(1.78, 2.4)
    cab.quadraticCurveTo(1.66, 2.4, 1.66, 2.28)
    cab.lineTo(1.66, 0.8)

    const deflector = new THREE.Shape()
    deflector.moveTo(1.7, 2.42)
    deflector.lineTo(2.42, 2.42)
    deflector.quadraticCurveTo(2.0, 2.5, 1.8, 2.8)
    deflector.lineTo(1.7, 2.8)
    deflector.lineTo(1.7, 2.42)

    const win = new THREE.Shape()
    win.moveTo(2.18, 1.74)
    win.lineTo(3.14, 1.74)
    win.lineTo(2.94, 2.26)
    win.lineTo(2.18, 2.26)
    win.lineTo(2.18, 1.74)

    return {
      cab: extrude(cab, 2.0, 0.05),
      deflector: extrude(deflector, 1.8, 0.04),
      window: new THREE.ShapeGeometry(win),
    }
  }, [])

  useFrame(({ clock }) => {
    if (reducedMotion) return
    const t = clock.elapsedTime
    body.current.position.y = Math.sin(t * 13) * 0.01 + Math.sin(t * 2.3) * 0.008
    body.current.rotation.x = Math.sin(t * 1.7) * 0.003
  })

  const decal = (map, extra = {}) => (
    <meshStandardMaterial map={map} roughness={0.35} metalness={0.1} polygonOffset polygonOffsetFactor={-2} {...extra} />
  )

  return (
    <group>
      <group ref={body}>
        {/* frame rails */}
        <mesh position={[-0.9, 0.68, 0]} material={m.dark} castShadow><boxGeometry args={[5.1, 0.22, 1.0]} /></mesh>

        {/* cab */}
        <mesh geometry={geo.cab} material={m.paint} castShadow receiveShadow />
        <mesh geometry={geo.deflector} material={m.paint} castShadow />
        <mesh position={[3.175, 2.0, 0]} rotation-z={0.378} material={m.glass}><boxGeometry args={[0.015, 0.62, 1.88]} /></mesh>
        <RoundedBox args={[0.26, 0.05, 1.94]} radius={0.02} position={[3.0, 2.37, 0]} rotation-z={-0.12} material={m.gloss} />
        {sides.map((s) => (
          <group key={s}>
            <mesh geometry={geo.window} position-z={s * 1.056} material={m.glass} />
            {/* door seam, beltline trim, door badge */}
            <mesh position={[2.1, 1.55, s * 1.053]} material={m.gloss}><boxGeometry args={[0.012, 1.42, 0.006]} /></mesh>
            <mesh position={[2.64, 1.7, s * 1.054]} material={m.chrome}><boxGeometry args={[1.0, 0.022, 0.006]} /></mesh>
            <mesh position={[2.62, 1.3, s * 1.057]} rotation-y={s > 0 ? 0 : Math.PI}>
              <planeGeometry args={[0.98, 0.245]} />
              {decal(brand.door, { transparent: true })}
            </mesh>
            {/* mirrors */}
            <mesh position={[3.14, 1.92, s * 1.16]} material={m.gloss}><boxGeometry args={[0.04, 0.04, 0.26]} /></mesh>
            <RoundedBox args={[0.12, 0.42, 0.12]} radius={0.04} position={[3.1, 1.86, s * 1.3]} material={m.gloss} castShadow />
            {/* step */}
            <RoundedBox args={[0.34, 0.05, 0.2]} radius={0.015} position={[3.06, 0.68, s * 0.98]} material={m.gloss} />
          </group>
        ))}

        {/* front: gloss-black mask with grille and badge */}
        <RoundedBox args={[0.12, 0.84, 2.12]} radius={0.05} position={[3.37, 1.2, 0]} material={m.gloss} castShadow />
        {[1.0, 1.08, 1.16, 1.24, 1.32].map((y) => (
          <mesh key={y} position={[3.435, y, 0]} material={m.chrome}><boxGeometry args={[0.012, 0.018, 0.92]} /></mesh>
        ))}
        <RoundedBox args={[0.02, 0.09, 0.42]} radius={0.01} position={[3.44, 1.47, 0]} material={m.paint} />
        {/* bumper and fog lights */}
        <RoundedBox args={[0.3, 0.26, 2.2]} radius={0.07} position={[3.46, 0.82, 0]} material={m.bumper} castShadow />
        <mesh position={[3.615, 0.71, 0]} material={m.chrome}><boxGeometry args={[0.02, 0.025, 1.8]} /></mesh>
        <mesh position={[3.612, 0.86, 0]} material={m.gloss}><boxGeometry args={[0.01, 0.08, 1.0]} /></mesh>
        {sides.map((s) => (
          <group key={s}>
            <mesh position={[3.615, 0.85, s * 0.84]} rotation-z={Math.PI / 2} material={m.head}><cylinderGeometry args={[0.042, 0.042, 0.015, 20]} /></mesh>
            <mesh position={[2.96, 2.46, s * 0.9]} material={m.marker}><boxGeometry args={[0.08, 0.035, 0.08]} /></mesh>
          </group>
        ))}
        <Headlights m={m} day={day} />
        <Beacon m={m} />

        {/* exhaust stack behind the cab */}
        <mesh position={[1.56, 1.75, 0.86]} material={m.chrome} castShadow><cylinderGeometry args={[0.055, 0.055, 1.6, 20]} /></mesh>
        <mesh position={[1.56, 1.45, 0.86]} material={m.gloss}><cylinderGeometry args={[0.075, 0.075, 0.55, 20]} /></mesh>

        {/* headboard with work lights, and the winch */}
        <RoundedBox args={[0.1, 0.92, 2.1]} radius={0.03} position={[1.48, 1.58, 0]} material={m.gloss} castShadow />
        <mesh position={[1.48, 2.06, 0]} material={m.paint}><boxGeometry args={[0.12, 0.06, 2.1]} /></mesh>
        {sides.map((s) => (
          <mesh key={s} position={[1.42, 1.94, s * 0.82]} material={m.head}><boxGeometry args={[0.02, 0.06, 0.2]} /></mesh>
        ))}
        <mesh position={[1.34, 1.27, 0]} rotation-x={Math.PI / 2} material={m.chrome}><cylinderGeometry args={[0.1, 0.1, 0.8, 24]} /></mesh>

        {/* flatbed: deck, amber rails with marker lights */}
        <mesh position={[-0.77, 1.06, 0]} material={m.deck} castShadow receiveShadow><boxGeometry args={[4.86, 0.12, 2.18]} /></mesh>
        {sides.map((s) => (
          <group key={s}>
            <RoundedBox args={[4.88, 0.18, 0.06]} radius={0.02} position={[-0.77, 1.04, s * 1.11]} material={m.paint} castShadow />
            {[-2.9, -2.06, -1.22, -0.38, 0.46, 1.3].map((x) => (
              <mesh key={x} position={[x, 1.04, s * 1.144]} material={m.marker}><boxGeometry args={[0.09, 0.04, 0.01]} /></mesh>
            ))}
            {/* branded toolbox between the axles */}
            <RoundedBox args={[2.0, 0.36, 0.3]} radius={0.03} position={[0.42, 0.78, s * 0.94]} material={m.gloss} castShadow />
            <mesh position={[0.42, 0.78, s * 1.1]} rotation-y={s > 0 ? 0 : Math.PI}>
              <planeGeometry args={[1.96, 0.322]} />
              {decal(brand.side)}
            </mesh>
            {/* mudflap */}
            <mesh position={[-2.86, 0.42, s * 0.9]} material={m.gloss}><boxGeometry args={[0.02, 0.4, 0.42]} /></mesh>
          </group>
        ))}

        {/* rear: chevrons, tail lights, under-lift */}
        <mesh position={[-3.21, 0.86, 0]}>
          <boxGeometry args={[0.02, 0.22, 2.1]} />
          {decal(brand.chevron)}
        </mesh>
        {sides.map((s) => (
          <group key={s}>
            <RoundedBox args={[0.05, 0.14, 0.32]} radius={0.02} position={[-3.24, 0.86, s * 0.86]} material={m.tail} />
            <RoundedBox args={[0.05, 0.14, 0.12]} radius={0.02} position={[-3.24, 0.86, s * 0.6]} material={m.marker} />
          </group>
        ))}
        <mesh position={[-3.48, 0.5, 0]} material={m.deck}><boxGeometry args={[0.6, 0.1, 0.3]} /></mesh>
        <mesh position={[-3.76, 0.5, 0]} material={m.paint}><boxGeometry args={[0.12, 0.1, 1.5]} /></mesh>

        {/* the rescued car */}
        <group position={[-1.0, 1.12, 0]}>
          <Car m={m} />
        </group>
      </group>

      {[2.35, -1.2, -2.28].map((x) => sides.map((s) => (
        <Wheel key={`${x}${s}`} position={[x, 0.46, s * 0.9]} m={m} />
      )))}
    </group>
  )
}

/* ---------- world ---------- */
const LOOP = 120

function Scroller({ count, spacing, children }) {
  const group = useRef()
  useFrame((_, dt) => {
    group.current.children.forEach((c) => {
      c.position.x -= SPEED * dt
      if (c.position.x < -LOOP / 2) c.position.x += count * spacing
    })
  })
  return <group ref={group}>{Array.from({ length: count }, (_, i) => children(i, -LOOP / 2 + i * spacing))}</group>
}

function Streetlights({ day }) {
  const glow = useGlow()
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffcf8a', emissiveIntensity: day ? 0.2 : 7, toneMapped: false }), [day])
  const pole = useMemo(() => new THREE.MeshStandardMaterial({ color: day ? '#7d838c' : '#1a1e24', metalness: 0.8, roughness: 0.4 }), [day])
  const pool = useMemo(() => new THREE.MeshBasicMaterial({ map: glow, transparent: true, opacity: day ? 0 : 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), [glow, day])
  return (
    <Scroller count={10} spacing={12}>
      {(i, x) => (
        <group key={i} position={[x, 0, -4.6]}>
          <mesh position={[0, 3.2, 0]} material={pole}><cylinderGeometry args={[0.06, 0.09, 6.4, 10]} /></mesh>
          <mesh position={[0, 6.35, 0.8]} material={pole}><boxGeometry args={[0.08, 0.08, 1.7]} /></mesh>
          <mesh position={[0, 6.28, 1.55]} material={lamp}><boxGeometry args={[0.5, 0.06, 0.24]} /></mesh>
          <mesh position={[0, 0.02, 2.2]} rotation-x={-Math.PI / 2} material={pool}><planeGeometry args={[7, 7]} /></mesh>
        </group>
      )}
    </Scroller>
  )
}

function Barrier({ day }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: day ? '#a9afb7' : '#3a3f47', metalness: 0.9, roughness: 0.3 }), [day])
  const refl = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffb400', emissive: '#ff9a00', emissiveIntensity: day ? 0.5 : 2.5, toneMapped: false }), [day])
  return (
    <>
      <mesh position={[0, 0.55, -4.1]} material={mat}><boxGeometry args={[LOOP * 2, 0.22, 0.05]} /></mesh>
      <Scroller count={40} spacing={3}>
        {(i, x) => (
          <group key={i} position={[x, 0, -4.1]}>
            <mesh position={[0, 0.3, 0]} material={mat}><boxGeometry args={[0.08, 0.6, 0.08]} /></mesh>
            <mesh position={[0, 0.55, 0.04]} material={refl}><boxGeometry args={[0.1, 0.05, 0.01]} /></mesh>
          </group>
        )}
      </Scroller>
    </>
  )
}

function Road({ hq, day }) {
  const asphalt = day ? '#4a4d52' : '#0b0e12'
  const line = useMemo(() => new THREE.MeshBasicMaterial({ color: '#d9d4c7' }), [])
  const edge = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb400' }), [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[LOOP * 2, 40]} />
        {hq ? (
          <MeshReflectorMaterial
            blur={[400, 120]} resolution={1024} mixBlur={1} mixStrength={day ? 3 : 14} mirror={day ? 0.25 : 0.55}
            roughness={0.9} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.3}
            color={asphalt} metalness={day ? 0.2 : 0.6}
          />
        ) : (
          <meshStandardMaterial color={asphalt} roughness={0.6} metalness={day ? 0.1 : 0.5} />
        )}
      </mesh>
      {[3.4, -3.4].map((z) => (
        <mesh key={z} position={[0, 0.012, z]} rotation-x={-Math.PI / 2} material={edge}><planeGeometry args={[LOOP * 2, 0.1]} /></mesh>
      ))}
      <Scroller count={30} spacing={4}>
        {(i, x) => (
          <mesh key={i} position={[x, 0.012, 1.7]} rotation-x={-Math.PI / 2} material={line}><planeGeometry args={[1.8, 0.12]} /></mesh>
        )}
      </Scroller>
      <Scroller count={30} spacing={4}>
        {(i, x) => (
          <mesh key={i} position={[x + 2, 0.012, -1.7]} rotation-x={-Math.PI / 2} material={line}><planeGeometry args={[1.8, 0.12]} /></mesh>
        )}
      </Scroller>
    </group>
  )
}

/* ---------- camera ---------- */
function Rig() {
  const { camera, size } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const start = useRef(null)

  useFrame((state, dt) => {
    if (start.current === null) start.current = state.clock.elapsedTime
    const intro = reducedMotion ? 1 : Math.min(1, (state.clock.elapsedTime - start.current) / 2.6)
    const ie = 1 - Math.pow(1 - intro, 4)
    const p = heroState.progress
    const pe = p * p * (3 - 2 * p)
    const aspect = size.width / size.height
    const portrait = aspect < 1
    // Wide, short screens (16:9 laptops) get a slightly further camera and the truck pushed right.
    const wide = Math.min(Math.max((aspect - 1.45) / 0.45, 0), 1)
    const d = portrait ? 1.8 : 1.5 + wide * 0.28

    // Shot A: low 3/4 front. Shot B: side tracking shot, closer.
    const ax = 7.4 * d, ay = 1.7 + (portrait ? 1.4 : 0), az = 8.4 * d
    const bx = -2.2 * d, by = 1.25 + (portrait ? 1 : 0), bz = 7.2 * d
    let x = lerp(ax, bx, pe)
    let y = lerp(ay, by, pe)
    let z = lerp(az, bz, pe)
    // Fly-in on load
    x = lerp(x + 10, x, ie); y = lerp(y + 5, y, ie); z = lerp(z + 12, z, ie)
    // Mouse parallax
    x += heroState.mouseX * 0.5
    y += -heroState.mouseY * 0.25

    target.set(x, y, z)
    camera.position.lerp(target, 1 - Math.exp(-dt * 5))
    // Frame the truck to the right of the headline on desktop, above it on phones.
    const la = portrait ? [0.3, -1.7, 0] : [-2.45 - wide * 1.2, 0.95 + wide * 0.2, 2.1]
    const lb = portrait ? [0, -1.1, 0] : [-0.9, 1.0, -0.3]
    look.set(lerp(la[0], lb[0], pe), lerp(la[1], lb[1], pe), lerp(la[2], lb[2], pe))
    camera.lookAt(look)
  })
  return null
}

export default function HeroScene({ active = true, day = false }) {
  const hq = typeof window !== 'undefined' && window.innerWidth > 900
  const bg = day ? BG.day : BG.night
  return (
    <Canvas
      shadows
      dpr={[1, hq ? 1.75 : 1.25]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [18, 7, 20], fov: 30, near: 0.1, far: 120 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, day ? 20 : 16, day ? 64 : 52]} />
      {day ? (
        <>
          {/* Soft late-afternoon sun */}
          <ambientLight intensity={0.75} />
          <hemisphereLight args={['#ffffff', '#c9bfab', 1.1]} />
          <directionalLight position={[-8, 14, 8]} intensity={2.6} color="#fff1dc" castShadow
            shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
          <directionalLight position={[8, 4, -6]} intensity={0.8} color="#ffd9a6" />
        </>
      ) : (
        <>
          <ambientLight intensity={0.22} />
          <hemisphereLight args={['#8fa6c9', '#06080b', 0.35]} />
          <directionalLight position={[-8, 12, 6]} intensity={0.9} color="#b7c8ff" castShadow
            shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
          <directionalLight position={[8, 3, -6]} intensity={0.6} color="#ffb766" />
        </>
      )}

      <Environment key={day ? 'day' : 'night'} resolution={256} frames={1}>
        <Lightformer intensity={day ? 3.2 : 2.2} rotation-x={Math.PI / 2} position={[0, 8, 0]} scale={[14, 6, 1]} />
        <Lightformer intensity={day ? 2.4 : 4} color="#ffc27a" rotation-y={Math.PI / 2} position={[-10, 2, 0]} scale={[20, 1.2, 1]} />
        <Lightformer intensity={day ? 1.6 : 2} color={day ? '#dfe8ff' : '#7fa4ff'} rotation-y={-Math.PI / 2} position={[10, 3, 2]} scale={[20, 1, 1]} />
        <Lightformer intensity={day ? 2 : 1.2} position={[0, 2, 10]} scale={[16, 2, 1]} />
      </Environment>

      <Truck day={day} />
      <Road hq={hq} day={day} />
      <Streetlights day={day} />
      <Barrier day={day} />
      <Rig />

      <EffectComposer multisampling={hq ? 4 : 0} disableNormalPass>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={day ? 0.5 : 1.15} radius={0.75} />
        <Vignette offset={0.25} darkness={day ? 0.22 : 0.75} />
      </EffectComposer>
    </Canvas>
  )
}
