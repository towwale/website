import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { rig, span, PIVOT } from './rig.js'

// What rides on the bed while the truck passes the service cards: one load per service,
// in the same order as the cards. The red car is slot 0 and 3 and is drawn by Scene.jsx;
// this draws the rest. Each load dissolves in as the one before it dissolves out; nothing moves.
export const BIKE_URL = '/models/bike.glb'
export const WRECK_A_URL = '/models/wreck-a.glb'
export const WRECK_B_URL = '/models/wreck-b.glb'

// 0..1 for slot i at the current position along the services scene.
// Neighbouring slots overlap, so one load is always dissolving into the next.
export const slotWeight = (i) => (rig.slot < 0 ? 0 : span(rig.slot, i - 0.14, i + 0.14) * (1 - span(rig.slot, i + 0.86, i + 1.14)))
// The car's own weight: always there outside the services scene, and in slots 0 and 3.
export const carWeight = () => (rig.slot < 0 ? 1 : Math.max(rig.slot < 2 ? 1 - span(rig.slot, 0.86, 1.14) : 0, slotWeight(3), span(rig.slot, 7.72, 8)))

const DECK = [PIVOT.x + 4.4, PIVOT.y + 0.1] // where a load's centre sits, and the deck surface

const PROP = (name) => `/models/props/${name}.glb`
const Strap = ({ from, to }) => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return <mesh position={mid} quaternion={q}><boxGeometry args={[0.04, a.distanceTo(b), 0.008]} /><meshStandardMaterial color="#e9b10c" roughness={0.85} /></mesh>
}

// Every material under an object, cloned so its opacity can be driven on its own.
export function fadeable(object) {
  const mats = []
  object.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = true
    o.receiveShadow = true
    o.material = o.material.clone()
    o.material.userData.opacity = o.material.opacity
    o.material.userData.transparent = o.material.transparent
    mats.push(o.material)
  })
  return mats
}
// Dissolve: fully opaque materials stay opaque (and keep casting shadows) until they start to fade.
export function setFade(mats, w) {
  for (const m of mats) {
    const solid = w > 0.999
    m.transparent = solid ? m.userData.transparent : true
    m.opacity = m.userData.opacity * w
    m.depthWrite = solid ? !m.userData.transparent : w > 0.5
  }
}

function Model({ url, ...rest }) {
  const { scene } = useGLTF(url, false, true)
  const copy = useMemo(() => scene.clone(), [scene])
  return <primitive object={copy} {...rest} />
}

function Bike() {
  return (
    <group>
      {/* The model faces -z; turn it to face the cab. Ratchet straps hold it upright, as on a real carrier. */}
      <Model url={BIKE_URL} rotation-y={-Math.PI / 2} />
      {[1, -1].map((s) => <Strap key={`f${s}`} from={[0.52, 0.92, s * 0.2]} to={[0.8, 0.01, s * 1.0]} />)}
      {[1, -1].map((s) => <Strap key={`r${s}`} from={[-0.5, 0.74, s * 0.12]} to={[-0.78, 0.01, s * 1.0]} />)}
    </group>
  )
}

// Scanned tyres: each lies in the x-y plane as modelled, so a flat one is tipped over.
const FlatTyre = ({ at, turn = 0 }) => <group position={at} rotation-y={turn}><Model url={PROP('old_tyre')} rotation-x={-Math.PI / 2} position={[0, 0.085, 0.3]} /></group>

function Tyres() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => <FlatTyre key={`a${i}`} at={[-1.3, i * 0.17, -0.45]} turn={i * 0.8} />)}
      {[0, 1, 2, 3, 4].map((i) => <FlatTyre key={`b${i}`} at={[-1.3, i * 0.17, 0.45]} turn={i * 0.5} />)}
      {[0, 1, 2, 3].map((i) => <FlatTyre key={`c${i}`} at={[-0.5, i * 0.17, 0]} turn={i * 1.3} />)}
      {[0.3, 0.52, 0.74, 0.96].map((x, i) => <Model key={x} url={PROP('old_tyre')} position={[x, 0, -0.5]} rotation={[0, Math.PI / 2, 0.12 * (i % 2 ? 1 : -1)]} />)}
      {[0.3, 0.52, 0.74].map((x) => <Model key={`r${x}`} url={PROP('old_tyre')} position={[x, 0, 0.5]} rotation-y={Math.PI / 2} />)}
      <Model url={PROP('rusted_wheel_rim_01')} position={[1.5, 0.08, 0.2]} rotation-x={-Math.PI / 2} />
      <Model url={PROP('rusted_wheel_rim_01')} position={[1.5, 0.23, 0.22]} rotation={[-Math.PI / 2, 0, 0.6]} />
    </group>
  )
}

function Fuel() {
  return (
    <group>
      {[-1.4, -1.0, -0.6, -0.2].map((x, i) => <Model key={x} url={PROP('metal_jerrycan')} position={[x, 0, -0.35]} rotation-y={0.1 * (i % 2 ? 1 : -1)} />)}
      {[-1.4, -1.0, -0.6, -0.2].map((x, i) => <Model key={`b${x}`} url={PROP('metal_jerrycan')} position={[x, 0, 0.1]} rotation-y={Math.PI + 0.08 * (i % 2 ? 1 : -1)} />)}
      {[0.35, 0.75, 1.15].map((x, i) => <Model key={`p${x}`} url={PROP('plastic_jerrycan')} position={[x, 0, -0.3]} rotation-y={0.3 * i} />)}
      <Model url={PROP('Barrel_01')} position={[0.6, 0, 0.5]} />
      <Model url={PROP('Barrel_01')} position={[1.3, 0, 0.45]} rotation-y={1} />
    </group>
  )
}

function Jumpstart() {
  return (
    <group>
      <Model url={PROP('portable_generator')} position={[-0.5, 0, 0]} rotation-y={0.15} />
      <Model url={PROP('portable_generator')} position={[0.6, 0, 0.1]} rotation-y={-0.2} />
      <Model url={PROP('metal_toolbox')} position={[1.45, 0, -0.2]} rotation-y={0.4} />
    </group>
  )
}

function Lockout() {
  return (
    <group>
      <Model url={PROP('metal_tool_chest')} position={[-0.5, 0, 0]} rotation-y={0.1} />
      <Model url={PROP('metal_toolbox')} position={[0.35, 0, -0.25]} rotation-y={-0.3} />
      <Model url={PROP('metal_toolbox')} position={[0.4, 0, 0.3]} rotation-y={0.5} />
      <Model url={PROP('metal_toolbox')} position={[0.38, 0.3, 0.02]} rotation-y={0.1} />
    </group>
  )
}

// slot index -> load
const LOADS = [
  [1, <Bike key="bike" />],
  [2, <Model key="wreck" url={WRECK_A_URL} scale={0.9} position={[0.2, 0, 0]} />],
  [4, <Jumpstart key="battery" />],
  [5, <Tyres key="tyres" />],
  [6, <Fuel key="fuel" />],
  [7, <Lockout key="key" />],
]

export default function Loads() {
  const root = useRef()
  const slots = useRef([])
  const mats = useRef([])
  useFrame(() => {
    root.current.position.z = rig.lane
    root.current.rotation.y = -rig.heading
    LOADS.forEach(([i], n) => {
      const g = slots.current[n]
      if (!g) return
      // Collect the load's materials once its model has arrived.
      if (!mats.current[n] || mats.current[n].count !== g.userData.count) {
        let count = 0
        g.traverse((o) => { if (o.isMesh) count++ })
        if (count !== g.userData.count) { g.userData.count = count; mats.current[n] = Object.assign(fadeable(g), { count }) }
      }
      const w = slotWeight(i)
      g.visible = w > 0.001
      if (g.visible) setFade(mats.current[n], w)
    })
  })
  return (
    <group ref={root}>
      {LOADS.map(([i, load], n) => (
        <group key={i} ref={(el) => { slots.current[n] = el }} position={[DECK[0], DECK[1], 0]} visible={false}>{load}</group>
      ))}
    </group>
  )
}

useGLTF.preload(BIKE_URL, false, true)
useGLTF.preload(WRECK_A_URL, false, true)
useGLTF.preload(WRECK_B_URL, false, true)
