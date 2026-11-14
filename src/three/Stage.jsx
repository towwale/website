import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import Scene from './Scene.jsx'
import World, { Landmarks } from './World.jsx'
import { rig, stage, applyStory, span } from './rig.js'

// Camera shots along the story (p is the story position, see rig.js). yaw is measured round
// the truck in degrees: 180 is a pure side view with the truck facing left, smaller swings
// toward its nose, larger toward its tail. x0..x1 is the stretch of road that must stay in
// frame. off / down shift the picture (as a fraction of the screen) to leave room for the
// copy. fw / fh cap how much of the screen that stretch may fill.
const WIDE = [
  // 0 hero: low, off the front corner
  { p: 0, yaw: 126, el: 2.5, x0: -7.4, x1: 4.2, off: 0.12, down: 0.12, fw: 0.86, fh: 0.62 },
  { p: 0.7, yaw: 150, el: 7, x0: -7.4, x1: 4.2, off: 0.04, down: 0.06, fw: 0.7, fh: 0.5 },
  // 1 the call: lift away until the truck is small on a long road
  { p: 1.25, yaw: 236, el: 30, x0: -26, x1: 70, off: -0.16, down: 0.02, fw: 0.9, fh: 0.86 },
  { p: 1.95, yaw: 242, el: 24, x0: -22, x1: 60, off: -0.14, down: 0.02, fw: 0.9, fh: 0.86 },
  // 2 breakdown: back down beside the car
  { p: 2.3, yaw: 228, el: 10, x0: -27, x1: 4.2, off: 0, down: 0.04, fw: 0.92, fh: 0.6 },
  { p: 2.5, yaw: 206, el: 5, x0: -17.4, x1: -11.2, off: 0.16, down: 0.06, fw: 0.5, fh: 0.5 },
  // 3 loading: side-on, from behind the car, alongside, then straight down
  { p: 2.85, yaw: 184, el: 3.5, x0: -12.4, x1: 1, off: 0.02, down: 0.05, fw: 0.94, fh: 0.5 },
  { p: 3.15, yaw: 252, el: 9, x0: -18, x1: -3, off: 0.08, down: 0.04, fw: 0.78, fh: 0.56 },
  { p: 3.45, yaw: 200, el: 5, x0: -13.6, x1: -2.4, off: 0.06, down: 0.05, fw: 0.92, fh: 0.5 },
  { p: 3.85, yaw: 178, el: 52, x0: -9.4, x1: 4.6, off: 0.1, down: -0.02, fw: 0.72, fh: 0.7 },
  // 4 charges: high chase from behind, then under the gantry
  { p: 4.25, yaw: 240, el: 20, x0: -12, x1: 34, off: 0.16, down: 0.02, fw: 0.72, fh: 0.8 },
  { p: 4.7, yaw: 252, el: 8, x0: -10, x1: 16, off: 0.16, down: 0.04, fw: 0.66, fh: 0.7 },
  // 5 services: side-on tracking, the roadside jobs pass in front
  { p: 5.1, yaw: 186, el: 7, x0: -9.5, x1: 5, off: 0, down: -0.15, fw: 0.6, fh: 0.42 },
  // roadside services: closer on the bed, where the load is
  { p: 5.52, yaw: 196, el: 11, x0: -7, x1: -0.4, off: 0, down: -0.15, fw: 0.6, fh: 0.46 },
  { p: 5.96, yaw: 168, el: 11, x0: -7, x1: -0.4, off: 0, down: -0.15, fw: 0.6, fh: 0.46 },
  // 6 cities: straight down, like a map
  { p: 6.3, yaw: 182, el: 78, x0: -34, x1: 40, off: 0.14, down: 0, fw: 0.7, fh: 0.9 },
  { p: 6.85, yaw: 190, el: 70, x0: -30, x1: 36, off: 0.14, down: 0, fw: 0.7, fh: 0.9 },
  // 7 questions: level, from across the street
  { p: 7.25, yaw: 184, el: 4, x0: -12, x1: 12, off: -0.18, down: 0.04, fw: 0.56, fh: 0.5 },
  { p: 7.85, yaw: 166, el: 5, x0: -10, x1: 10, off: -0.18, down: 0.04, fw: 0.56, fh: 0.5 },
  // 8 delivered: close and low again, mirroring the loading
  { p: 8.25, yaw: 206, el: 13, x0: -20, x1: 5, off: 0.06, down: 0.04, fw: 0.8, fh: 0.56 },
  { p: 8.6, yaw: 238, el: 10, x0: -18, x1: -3, off: 0.08, down: 0.05, fw: 0.78, fh: 0.56 },
  { p: 8.95, yaw: 198, el: 14, x0: -20, x1: 5, off: 0.04, down: 0.04, fw: 0.8, fh: 0.56 },
  // 9 booking: wide, truck to the left, form on the right
  { p: 9.3, yaw: 170, el: 17, x0: -20, x1: 8, off: -0.24, down: 0, fw: 0.46, fh: 0.5 },
  { p: 9.95, yaw: 160, el: 17, x0: -20, x1: 8, off: -0.24, down: 0, fw: 0.46, fh: 0.5 },
  // 10 footer: high and far as it leaves
  { p: 10.5, yaw: 238, el: 28, x0: -30, x1: 70, off: 0, down: 0.1, fw: 0.9, fh: 0.8 },
  { p: 11, yaw: 244, el: 34, x0: -40, x1: 80, off: 0, down: 0.1, fw: 0.9, fh: 0.8 },
]
// Phones are tall and narrow: same shots, centred, with the subject higher in the frame.
const TALL = WIDE.map((k) => ({ ...k, off: 0, down: -0.14, fw: Math.min(1.1, k.fw * 1.25), fh: k.fh * 0.62 }))
const FIELDS = ['yaw', 'el', 'x0', 'x1', 'off', 'fw', 'fh', 'down']
const RAD = Math.PI / 180

// The day passes as you scroll: sunrise on the open road, daylight for the recovery and a
// warm late afternoon for the drive away. It never gets dark: the owner does not want a night scene.
const DAY = [
  { p: 0, top: '#ffc978', low: '#ffeccc', ground: '#ffe9c8', sun: '#ffd09a', power: 2.4, fill: 0.16, env: 0.75, from: [14, 5, -10] },
  { p: 1.3, top: '#63b6ee', low: '#d3ebf8', ground: '#ffffff', sun: '#fff4e0', power: 2.6, fill: 0.14, env: 1, from: [-6, 16, -10] },
  { p: 8, top: '#58acec', low: '#d3ebf8', ground: '#ffffff', sun: '#fff4e0', power: 2.6, fill: 0.14, env: 1, from: [-8, 17, -8] },
  { p: 10.5, top: '#ffb85c', low: '#ffe6bd', ground: '#fff0d8', sun: '#ffc078', power: 2.5, fill: 0.16, env: 0.9, from: [-16, 7, -8] },
]
const tint = { a: new THREE.Color(), b: new THREE.Color() }
const blend = (target, from, to, t) => target.copy(tint.a.set(from)).lerp(tint.b.set(to), t)

function Sky({ ground }) {
  const { scene, gl } = useThree()
  const sun = useRef()
  const fill = useRef()
  const shell = useMemo(() => document.documentElement, [gl])
  const colour = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    const u = stage.u
    let i = 0
    while (i < DAY.length - 2 && u > DAY[i + 1].p) i++
    const a = DAY[i], b = DAY[i + 1]
    const t = Math.min(1, Math.max(0, (u - a.p) / (b.p - a.p)))
    const mix = (k) => a[k] + (b[k] - a[k]) * t

    blend(sun.current.color, a.sun, b.sun, t)
    sun.current.intensity = mix('power')
    sun.current.position.set(a.from[0] + (b.from[0] - a.from[0]) * t, a.from[1] + (b.from[1] - a.from[1]) * t, a.from[2] + (b.from[2] - a.from[2]) * t)
    fill.current.intensity = mix('fill')
    blend(fill.current.color, a.top, b.top, t)
    blend(fill.current.groundColor, a.ground, b.ground, t)
    blend(scene.fog.color, a.low, b.low, t)
    scene.environmentIntensity = mix('env')

    if (shell) {
      shell.style.setProperty('--sky-top', `#${blend(colour, a.top, b.top, t).getHexString()}`)
      shell.style.setProperty('--sky-low', `#${blend(colour, a.low, b.low, t).getHexString()}`)
    }
  })

  return (
    <>
      <hemisphereLight ref={fill} intensity={0.5} />
      <directionalLight
        ref={sun} position={[-6, 16, -10]} intensity={2.6} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.03}
        shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-far={90}
      />
    </>
  )
}

function sample(keys, p, out) {
  let i = 0
  while (i < keys.length - 2 && p > keys[i + 1].p) i++
  const a = keys[i], b = keys[i + 1]
  let t = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)))
  t = t * t * (3 - 2 * t)
  for (const f of FIELDS) out[f] = a[f] + (b[f] - a[f]) * t
  return out
}

function Rig() {
  const { camera, size } = useThree()
  const want = useRef({})
  const now = useRef(null)
  const started = useRef(null)
  const v = useMemo(() => ({
    dir: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(),
    fwd: new THREE.Vector3(), q: new THREE.Vector3(), target: new THREE.Vector3(), world: new THREE.Vector3(0, 1, 0),
  }), [])

  useFrame((state, dt) => {
    applyStory(stage.u)
    // In the hero the truck cruises on its own; after that it only moves with the scroll.
    rig.idle += 15 * (1 - span(stage.u, 0.2, 0.9)) * Math.min(dt, 0.05)
    rig.roadAt = rig.dist + rig.idle

    const aspect = size.width / size.height
    const shot = sample(aspect < 0.9 ? TALL : WIDE, stage.u, want.current)
    if (!now.current) now.current = { ...shot }
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 7)
    const c = now.current
    for (const f of FIELDS) c[f] += (shot[f] - c[f]) * k

    // A swing-in the first time the stage is shown.
    if (started.current === null && stage.go) started.current = state.clock.elapsedTime
    const intro = started.current === null ? 0 : Math.min(1, (state.clock.elapsedTime - started.current) / 2.6)
    const ie = 1 - Math.pow(1 - intro, 4)

    // Dragging in the hero orbits the camera. Let go, or scroll on, and it settles back
    // to the nearest full turn, which is the framed shot again.
    if (!stage.held || stage.u > 0.5) stage.spinTo = Math.round(stage.spinTo / 360) * 360
    stage.spin += (stage.spinTo - stage.spin) * (1 - Math.exp(-Math.min(dt, 0.05) * (stage.held ? 14 : 3.2)))
    if (!stage.held && Math.abs(stage.spin - stage.spinTo) < 0.02) stage.spin = stage.spinTo = 0

    const yaw = (c.yaw - (1 - ie) * 58 - stage.mouseX * 6 - stage.spin) * RAD
    const el = (c.el + (1 - ie) * 9 - stage.mouseY * 2.5) * RAD
    v.dir.set(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el))
    v.fwd.copy(v.dir).negate()
    v.right.crossVectors(v.fwd, v.world).normalize()
    v.up.crossVectors(v.right, v.fwd)
    v.target.set((c.x0 + c.x1) / 2, 1.5, rig.lane)

    // Distance that keeps the whole stretch of road inside the allowed part of the frame.
    const tanV = Math.tan((camera.fov * RAD) / 2)
    const tanH = tanV * aspect
    let dist = 0
    for (const x of [c.x0, c.x1]) for (const y of [0, 3.2]) for (const z of [-1.5, 1.5]) {
      v.q.set(x, y, z + rig.lane).sub(v.target)
      const depth = v.q.dot(v.fwd)
      dist = Math.max(dist, Math.abs(v.q.dot(v.right)) / (tanH * c.fw) - depth, Math.abs(v.q.dot(v.up)) / (tanV * c.fh) - depth)
    }
    dist *= 1 + (1 - ie) * 0.3

    // Haze starts just behind the subject and swallows the far road.
    state.scene.fog.near = dist + 6
    state.scene.fog.far = dist + 210

    camera.position.copy(v.target).addScaledVector(v.dir, dist)
    camera.lookAt(v.target)
    camera.setViewOffset(size.width, size.height, -c.off * size.width, -c.down * size.height, size.width, size.height)
  })
  return null
}

export default function Stage({ active = true }) {
  const phone = typeof window !== 'undefined' && window.innerWidth < 900
  const ground = useRef()
  return (
    <Canvas
      shadows
      style={{ pointerEvents: 'none' }}
      dpr={[1, phone ? 1.5 : 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [-30, 6, -30], fov: 27, near: 0.5, far: 420 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMappingExposure = 0.96 }}
    >
      <fog attach="fog" args={['#eef6f8', 40, 170]} />
      <Sky ground={ground} />

      {/* A photographed sky lights the scene and is what the paint, glass and chrome reflect. */}
      <Environment files="/hdri/kloofendal_48d_partly_cloudy_puresky.hdr" />

      <Suspense fallback={null}>
        <World ground={ground} />
        <Landmarks />
        <Scene />
      </Suspense>
      {!phone && (
        <ContactShadows position={[-6.5, 0.012, 0]} scale={[34, 10]} far={3} blur={2} opacity={0.5} resolution={1024} color="#000000" />
      )}
      <Rig />
    </Canvas>
  )
}
