import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

// The rest of the fleet, parked at the depot: more of the same flatbed, and two small tow trucks.
// They never move, so each mesh of the model is drawn once for all of them.

export const TRUCK_URL = '/models/truck.glb'
export const TOWLITE_URL = '/models/towlite.glb'
// The truck model is authored in centimetres, facing +z, and a little oversized.
export const TRUCK_SCALE = 0.0092

// The truck model as it was made, before the working truck takes it apart to animate it:
// every mesh with where it sits. Whoever asks first records it; it has to be asked for
// before the model is changed.
export function restOf(scene) {
  if (scene.userData.rest) return scene.userData.rest
  scene.updateMatrixWorld(true)
  const rest = []
  scene.traverse((o) => { if (o.isMesh) rest.push({ geometry: o.geometry, material: o.material, matrix: o.matrixWorld.clone() }) })
  scene.userData.rest = rest
  return rest
}

// The company name, as painted on the doors.
let name = null
export function doorTexture() {
  if (name) return name
  const c = document.createElement('canvas')
  c.width = 1024; c.height = 256
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const paint = () => {
    const g = c.getContext('2d')
    g.clearRect(0, 0, 1024, 256)
    g.fillStyle = '#0d0e0f'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.font = '800 132px "Unbounded", "Arial Black", Arial, sans-serif'
    g.fillText('TOWWALA', 512, 138)
    t.needsUpdate = true
  }
  paint()
  document.fonts?.load?.('800 80px "Unbounded"').then(paint, paint)
  name = t
  return t
}

function Copies({ part, places, fit }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const at = new THREE.Object3D()
    const m = new THREE.Matrix4()
    places.forEach(([x, z, turn], i) => {
      at.position.set(x, 0, z); at.rotation.set(0, turn, 0); at.updateMatrix()
      m.multiplyMatrices(at.matrix, fit).multiply(part.matrix)
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [part, places, fit])
  return <instancedMesh ref={ref} args={[part.geometry, part.material, places.length]} castShadow receiveShadow frustumCulled={false} />
}

// Door lettering for one parked vehicle: `at` is [along, up, half the body width], `size` the plate.
function Lettering({ place, at, size }) {
  const map = useMemo(doorTexture, [])
  const [x, z, turn] = place
  return (
    <group position={[x, 0, z]} rotation-y={turn}>
      {[1, -1].map((side) => (
        <mesh key={side} position={[at[0], at[1], side * at[2]]} rotation-y={side > 0 ? 0 : Math.PI}>
          <planeGeometry args={size} />
          <meshStandardMaterial map={map} transparent roughness={0.4} metalness={0.1} polygonOffset polygonOffsetFactor={-4} />
        </mesh>
      ))}
    </group>
  )
}

// places: [along the road, across, turn] for each vehicle. A turn of 0 faces along the road.
export default function Fleet({ trucks, small }) {
  const truck = useGLTF(TRUCK_URL, false, true)
  const lite = useGLTF(TOWLITE_URL, false, true)
  const big = useMemo(() => restOf(truck.scene), [truck])
  const little = useMemo(() => restOf(lite.scene), [lite])
  const fitBig = useMemo(() => new THREE.Matrix4().makeRotationY(Math.PI / 2).scale(new THREE.Vector3(TRUCK_SCALE, TRUCK_SCALE, TRUCK_SCALE)), [])
  const fitLittle = useMemo(() => new THREE.Matrix4(), [])
  return (
    <group>
      {big.map((part, i) => <Copies key={i} part={part} places={trucks} fit={fitBig} />)}
      {little.map((part, i) => <Copies key={i} part={part} places={small} fit={fitLittle} />)}
      {trucks.map((place, i) => <Lettering key={i} place={place} at={[2.3, 1.62, 1.172]} size={[0.92, 0.23]} />)}
      {small.map((place, i) => <Lettering key={i} place={place} at={[0.84, 0.97, 0.912]} size={[0.6, 0.15]} />)}
    </group>
  )
}
useGLTF.preload(TOWLITE_URL, false, true)
