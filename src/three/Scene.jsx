import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Loads, { carWeight, fadeable, setFade } from './Loads.jsx'
import { rig, stage, carPose, bedPoint, PIVOT, CAR_START_X } from './rig.js'

// The tow truck, the car it recovers and the small props around them.
// Models are in public/models (see CREDITS.md). World units are metres, truck facing +x.

const TRUCK_URL = '/models/truck.glb'
const CAR_URL = '/models/brezza.glb'

// The truck model is authored in centimetres, facing +z, and a little oversized.
const TRUCK_SCALE = 0.0092
const LATERAL = new THREE.Vector3(1, 0, 0) // the truck model faces +z, so its axles lie along x
const SPIN_MAX = 7.5 // radians a second: about 7 degrees a frame, well inside the stud spacing
const pose = { x: 0, y: 0, rot: 0, roll: 0 }
const A = [0, 0]
const B = [0, 0]

// Stretch a unit-height cylinder between two points in the x/y plane.
function stretch(mesh, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  mesh.position.x = (a[0] + b[0]) / 2
  mesh.position.y = (a[1] + b[1]) / 2
  mesh.scale.y = Math.hypot(dx, dy)
  mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2
}

// The direction a wheel's axle really points, in the mesh's own coordinates. A wheel is a
// squat disc, so its vertices spread least along the axle: that is the smallest principal
// axis of the vertex cloud. (The bounding box cannot tell: this model's front wheels were
// built turned on full lock, and a turned wheel's box is not lined up with its axle.)
function axleOf(geometry) {
  const pos = geometry.attributes.position
  const index = geometry.index
  const count = index ? index.count / 3 : pos.count / 3
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), mid = new THREE.Vector3(), cross = new THREE.Vector3()
  // Weigh by surface area, not by vertex, so finely modelled patches (valve, wheel nuts) do not pull the answer.
  const tri = (i) => {
    const i0 = index ? index.getX(i * 3) : i * 3, i1 = index ? index.getX(i * 3 + 1) : i * 3 + 1, i2 = index ? index.getX(i * 3 + 2) : i * 3 + 2
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2)
    mid.copy(a).add(b).add(c).divideScalar(3)
    return cross.subVectors(b, a).cross(c.sub(a)).length() / 2
  }
  let total = 0, mx = 0, my = 0, mz = 0
  for (let i = 0; i < count; i++) { const w = tri(i); total += w; mx += mid.x * w; my += mid.y * w; mz += mid.z * w }
  mx /= total; my /= total; mz /= total
  let xx = 0, yy = 0, zz = 0, xy = 0, xz = 0, yz = 0
  for (let i = 0; i < count; i++) {
    const w = tri(i)
    const x = mid.x - mx, y = mid.y - my, z = mid.z - mz
    xx += w * x * x; yy += w * y * y; zz += w * z * z; xy += w * x * y; xz += w * x * z; yz += w * y * z
  }
  // Smallest eigenvector of the covariance, by inverse power iteration (shifted to stay stable).
  const m = new THREE.Matrix3().set(xx, xy, xz, xy, yy, yz, xz, yz, zz)
  const shift = (xx + yy + zz) * 1e-6
  m.elements[0] += shift; m.elements[4] += shift; m.elements[8] += shift
  const inverse = m.clone().invert()
  const v = new THREE.Vector3(1, 0.3, 0.2).normalize()
  for (let i = 0; i < 60; i++) v.applyMatrix3(inverse).normalize()
  return v
}

// Give a wheel a pivot at its own centre so it can spin, and set it straight: whatever angle
// it was modelled at, its axle ends up across the vehicle (`lateral`, in the model's space).
const scale = new THREE.Vector3()
function spinner(mesh, lateral) {
  mesh.geometry.computeBoundingBox()
  const size = mesh.geometry.boundingBox.getSize(new THREE.Vector3())
  mesh.getWorldScale(scale)
  const radius = (Math.max(size.x, size.y, size.z) * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z))) / 2 || 1

  const centre = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3())
  const pivot = new THREE.Group()
  mesh.parent.add(pivot)
  pivot.position.copy(mesh.parent.worldToLocal(centre))
  pivot.quaternion.copy(mesh.quaternion)
  pivot.updateMatrixWorld(true)
  pivot.attach(mesh)

  // Across the vehicle, in the pivot's own coordinates. The wheel spins about this.
  const axis = lateral.clone().applyQuaternion(pivot.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize()
  const axle = axleOf(mesh.geometry)
  if (axle.dot(axis) < 0) axle.negate()
  // A wheel within a few degrees is already straight; only one built on lock is turned back.
  const steer = THREE.MathUtils.radToDeg(axle.angleTo(axis))
  if (steer > 6) {
    const straighten = new THREE.Quaternion().setFromUnitVectors(axle, axis)
    mesh.position.applyQuaternion(straighten)
    mesh.quaternion.premultiply(straighten)
  }

  // Spin so the top of the wheel moves toward the front of the vehicle (+z in the model).
  return { pivot, axis, sign: 1, radius, steer }
}

// Brightest at the lamp, gone by the far end of the beam.
function beamTexture() {
  const c = document.createElement('canvas')
  c.width = 4; c.height = 128
  const g = c.getContext('2d')
  const fade = g.createLinearGradient(0, 0, 0, 128)
  fade.addColorStop(0, 'rgba(255,255,255,1)'); fade.addColorStop(0.35, 'rgba(255,255,255,0.3)'); fade.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = fade; g.fillRect(0, 0, 4, 128)
  return new THREE.CanvasTexture(c)
}

function doorTexture() {
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
  return t
}

/* ---------- truck ---------- */
function Truck() {
  const { scene } = useGLTF(TRUCK_URL, false, true)
  const door = useMemo(doorTexture, [])
  const body = useRef()
  const frame = useRef()
  const rams = useRef([])
  const flash = useRef()
  const spot = useRef()
  const last = useRef(0)
  const glow = useMemo(() => ({
    lamp: new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#ffe9b0', emissiveIntensity: 0, toneMapped: false, transparent: true, opacity: 0 }),
    tail: new THREE.MeshStandardMaterial({ color: '#7a0d0d', emissive: '#ff2a1a', emissiveIntensity: 0.5, toneMapped: false }),
    beam: new THREE.MeshBasicMaterial({ map: beamTexture(), color: '#ffe7b0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
  }), [])

  // Set the model up once: it is cached, and React may run this more than once.
  const parts = useMemo(() => {
    if (scene.userData.parts) return scene.userData.parts
    scene.updateMatrixWorld(true)
    let beacon = null
    scene.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      const m = o.material
      if (m.name === 'Paint') {
        m.color.set('#ee9a00')
        m.metalness = 0.2; m.roughness = 0.34
        m.clearcoat = 1; m.clearcoatRoughness = 0.08
        m.envMapIntensity = 0.9
      }
      if (o.name === 'Beacon') {
        o.material = m.clone()
        o.material.emissive = new THREE.Color('#ff8a00')
        o.material.emissiveMap = null
        beacon = o.material
      }
    })

    const wheels = ['Wheel_FL', 'Wheel_FR', 'Wheel_RL1', 'Wheel_RL2', 'Wheel_RR1', 'Wheel_RR2']
      .map((name) => scene.getObjectByName(name)).filter((o) => o?.isMesh).map((o) => spinner(o, LATERAL))

    // The bed hangs off two nested groups: the outer one tilts about the back of the chassis,
    // the inner one slides along the bed.
    const bed = scene.getObjectByName('Bed')
    const tilt = new THREE.Group()
    const slide = new THREE.Group()
    tilt.position.set(0, PIVOT.y / TRUCK_SCALE, PIVOT.x / TRUCK_SCALE)
    scene.add(tilt)
    tilt.add(slide)
    tilt.updateMatrixWorld(true)
    if (bed) slide.attach(bed)

    scene.userData.parts = { wheels, tilt, slide, beacon }
    return scene.userData.parts
  }, [scene])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const step = Math.min(dt, 0.05)

    parts.tilt.rotation.x = -rig.tilt
    parts.slide.position.z = -rig.slide / TRUCK_SCALE
    // Wheels turn with the distance covered: forward over time, backward as the truck reverses.
    // At road speed a true spin steps further per frame than the stud pattern repeats, which
    // reads as stutter and backward rotation. So the visible spin eases off to a steady rate.
    const rate = (rig.roadAt - last.current) / step
    last.current = rig.roadAt
    for (const w of parts.wheels) {
      const r = w.radius * TRUCK_SCALE
      w.pivot.rotateOnAxis(w.axis, w.sign * SPIN_MAX * Math.tanh(rate / r / SPIN_MAX) * step)
    }

    // The truck leaves its lane to overtake and to turn into the yard.
    body.current.position.z = rig.lane
    body.current.rotation.y = -rig.heading

    // The tilt frame hinges at the back of the chassis and is pushed up by two rams.
    frame.current.rotation.z = rig.tilt
    const c = Math.cos(rig.tilt), s = Math.sin(rig.tilt)
    B[0] = PIVOT.x + 3.5 * c + 0.16 * s
    B[1] = PIVOT.y + 3.5 * s - 0.16 * c
    for (const ram of rams.current) {
      A[0] = -5.35; A[1] = 0.66
      stretch(ram, A, B)
    }

    const on = Math.sin(t * 8) > 0 ? 1 : 0
    if (parts.beacon) parts.beacon.emissiveIntensity = 0.3 + on * (4 + rig.night * 6)
    flash.current.intensity = on * (5 + rig.night * 22)
    glow.beam.opacity = rig.night * 0.16
    glow.lamp.emissiveIntensity = rig.night * 8
    glow.lamp.opacity = Math.min(1, rig.night * 6)
    glow.tail.emissiveIntensity = 0.5 + rig.night * 5
    spot.current.intensity = rig.night * 260
  })

  return (
    <group ref={body}>
      <group rotation-y={Math.PI / 2} scale={TRUCK_SCALE}>
        <primitive object={scene} />
      </group>

      {/* Tilt frame: two rails the bed slides along, hinged at the tail of the chassis */}
      <group ref={frame} position={[PIVOT.x, PIVOT.y, 0]}>
        {[0.43, -0.43].map((z) => (
          <mesh key={z} position={[3.3, -0.1, z]} castShadow>
            <boxGeometry args={[6.9, 0.16, 0.11]} />
            <meshStandardMaterial color="#1b1c1f" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        {[0.5, 2.4, 4.4, 6.4].map((x) => (
          <mesh key={x} position={[x, -0.12, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.86]} />
            <meshStandardMaterial color="#1b1c1f" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, -0.1, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 1.04, 16]} />
          <meshStandardMaterial color="#8d9196" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Company name on both doors */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[2.3, 1.62, side * 1.172]} rotation-y={side > 0 ? 0 : Math.PI}>
          <planeGeometry args={[0.92, 0.23]} />
          <meshStandardMaterial map={door} transparent roughness={0.4} metalness={0.1} polygonOffset polygonOffsetFactor={-4} />
        </mesh>
      ))}

      {[0.24, -0.24].map((z, i) => (
        <mesh key={z} ref={(el) => { rams.current[i] = el }} position-z={z}>
          <cylinderGeometry args={[0.05, 0.085, 1, 16]} />
          <meshStandardMaterial color="#cfd3d8" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      <pointLight ref={flash} color="#ff9000" distance={9} decay={1.8} position={[1.2, 3.4, 0]} />

      {/* Lamps: they come up as the light goes */}
      {[0.86, -0.86].map((z) => (
        <group key={z}>
          <mesh position={[4.34, 1.02, z]} material={glow.lamp}>
            <sphereGeometry args={[0.065, 16, 12]} />
          </mesh>
          <mesh position={[4.3 + 9, 1.02, z]} rotation-z={Math.PI / 2} material={glow.beam}>
            <coneGeometry args={[2.3, 18, 28, 1, true]} />
          </mesh>
          <mesh position={[-7.42, 0.98, z * 1.04]} material={glow.tail}>
            <boxGeometry args={[0.04, 0.12, 0.3]} />
          </mesh>
        </group>
      ))}
      <spotLight ref={spot} color="#ffe2a8" position={[4.4, 1.1, 0]} angle={0.5} penumbra={0.8} distance={46} decay={1.6} intensity={0} target-position={[30, 0, 0]} />
    </group>
  )
}

/* ---------- car ---------- */
function Car() {
  const { scene, animations } = useGLTF(CAR_URL, false, true)
  const carrier = useRef()
  const root = useRef()
  const cable = useRef()
  const straps = useRef()
  const tint = useRef(false)
  const shown = useRef(1)
  const hazard = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffa200', emissive: '#ff8a00', emissiveIntensity: 0.2, roughness: 0.3 }), [])

  const parts = useMemo(() => {
    if (scene.userData.parts) return scene.userData.parts
    scene.updateMatrixWorld(true)
    scene.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      const m = o.material
      // Body colour: a deep red that stands off the yellow truck. Glass gets a proper tint.
      if (m.name === 'primary') { m.color.set('#c8161d'); m.metalness = 0.35; m.roughness = 0.22; m.envMapIntensity = 1.1 }
      if (m.name.startsWith('glass')) { m.color.set('#141a20'); m.opacity = 0.5; m.roughness = 0.06; m.metalness = 0; m.envMapIntensity = 1.4; m.depthWrite = false }
    })
    const wheels = ['WheelFL', 'WheelFR', 'WheelRL', 'WheelRR'].map((n) => scene.getObjectByName(n)).filter(Boolean)
    wheels.forEach((w) => { w.userData.base = w.rotation.x })
    const box = new THREE.Box3().setFromObject(wheels[0] ?? scene)
    const radius = wheels.length ? (box.max.y - box.min.y) / 2 || 0.33 : 0.33
    // Play only the bonnet from the model's open/close clip.
    const mixer = new THREE.AnimationMixer(scene)
    let action = null
    const clip = animations.find((a) => a.name === 'open') ?? animations[0]
    if (clip) {
      const hood = new THREE.AnimationClip('hood', clip.duration, clip.tracks.filter((t) => t.name.startsWith('Hood')))
      action = mixer.clipAction(hood)
      action.play()
      action.paused = true
    }
    const fade = fadeable(scene)
    const paint = fade.filter((m) => m.name === 'primary')
    scene.userData.parts = { wheels, radius, mixer, action, paint, fade }
    return scene.userData.parts
  }, [scene, animations])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    carPose(pose)
    carrier.current.position.z = rig.carZ
    carrier.current.rotation.y = -rig.carYaw
    root.current.position.set(pose.x + rig.gap, pose.y, 0)
    // On the services stretch the car makes way for the other loads, and comes back blue for "car towing".
    const weight = carWeight()
    root.current.visible = Math.abs(rig.gap) < 260 && weight > 0.001
    if (weight !== shown.current) { shown.current = weight; setFade(parts.fade, weight) }
    const blue = rig.slot > 2 && rig.slot < 5
    if (blue !== tint.current) { tint.current = blue; for (const m of parts.paint) m.color.set(blue ? '#1d4fbf' : '#c8161d') }
    root.current.rotation.z = pose.rot
    for (const w of parts.wheels) w.rotation.x = w.userData.base + pose.roll / parts.radius

    if (parts.action) {
      parts.action.time = rig.hood * parts.action.getClip().duration * 0.999
      parts.mixer.update(0)
    }

    straps.current.visible = rig.strapped && weight > 0.6
    hazard.emissiveIntensity = rig.carT < 1 && Math.sin(t * 5) > 0 ? 4 : 0.2

    // Winch cable: from the drum at the front of the bed to the tow eye under the car's nose.
    const winching = rig.carT > 0.002 && !rig.strapped
    cable.current.visible = winching
    if (winching) {
      bedPoint(8.1, 0.34, A)
      const c = Math.cos(pose.rot), s = Math.sin(pose.rot)
      B[0] = pose.x + 1.98 * c - 0.34 * s
      B[1] = pose.y + 1.98 * s + 0.34 * c
      stretch(cable.current, A, B)
    }
  })

  return (
    <group ref={carrier}>
      <group ref={root} position={[CAR_START_X, 0, 0]}>
        {/* The model faces -z with its axles either side of z = -0.05; turn it to face +x and centre it. */}
        <group rotation-y={-Math.PI / 2} position={[-0.05, 0, 0]}>
          <primitive object={scene} />
        </group>
        {[[1.93, 0.86, 0.74], [-1.9, 0.98, 0.72]].map(([x, y, w]) => [w, -w].map((z) => (
          <mesh key={`${x}${z}`} position={[x, y, z]} material={hazard}><sphereGeometry args={[0.04, 12, 8]} /></mesh>
        )))}
        <group ref={straps} visible={false}>
          {[1.25, -1.25].map((x) => [0.84, -0.84].map((z) => [-1, 1].map((d) => (
            <mesh key={`${x}${z}${d}`} position={[x + d * 0.27, 0.19, z]} rotation-z={-d * 0.72}>
              <boxGeometry args={[0.36, 0.028, 0.045]} />
              <meshStandardMaterial color="#f2b400" roughness={0.8} />
            </mesh>
          ))))}
        </group>
      </group>
      <mesh ref={cable} visible={false}>
        <cylinderGeometry args={[0.014, 0.014, 1, 6]} />
        <meshStandardMaterial color="#2a2d31" metalness={0.9} roughness={0.4} />
      </mesh>
    </group>
  )
}

/* ---------- location pin ---------- */
function Pin() {
  const root = useRef()
  const pin = useRef()
  const ring = useRef()
  const ringMat = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    root.current.position.x = CAR_START_X + rig.gap
    root.current.position.z = rig.carZ
    const drop = rig.pin
    // Falls in with a small bounce, then hovers until the car starts to move.
    const land = 1 - Math.pow(1 - drop, 3)
    const gone = Math.min(1, rig.carT * 12)
    const s = land * (1 - gone)
    pin.current.visible = s > 0.01
    pin.current.scale.setScalar(s)
    pin.current.position.y = 2.05 + (1 - land) * 7 + Math.sin(t * 2.2) * 0.07
    pin.current.rotation.y = t * 0.9

    const pulse = (t * 0.55) % 1
    ring.current.visible = s > 0.5
    ring.current.scale.setScalar(1.6 + pulse * 3.2)
    ringMat.current.opacity = (1 - pulse) * 0.55
  })

  return (
    <group ref={root} position={[CAR_START_X, 0, 0]}>
      <group ref={pin}>
        <mesh position-y={0.62} castShadow>
          <sphereGeometry args={[0.42, 32, 24]} />
          <meshPhysicalMaterial color="#f5a800" roughness={0.3} clearcoat={0.6} clearcoatRoughness={0.15} envMapIntensity={0.6} />
        </mesh>
        <mesh position-y={0.2} rotation-x={Math.PI} castShadow>
          <coneGeometry args={[0.33, 0.62, 32]} />
          <meshPhysicalMaterial color="#f5a800" roughness={0.3} clearcoat={0.6} clearcoatRoughness={0.15} envMapIntensity={0.6} />
        </mesh>
        <mesh position-y={0.62}>
          <sphereGeometry args={[0.17, 24, 16]} />
          <meshStandardMaterial color="#0d0e0f" roughness={0.4} />
        </mesh>
      </group>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial ref={ringMat} color="#f2a200" transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

// Tells the page the models are in and the first frame can be shown.
function Ready() {
  useEffect(() => {
    stage.ready = true
    window.dispatchEvent(new Event('stage:ready'))
  }, [])
  return null
}

export default function Scene() {
  return (
    <>
      <Truck />
      <Car />
      <Loads />
      <Pin />
      <Ready />
    </>
  )
}

useGLTF.preload(TRUCK_URL, false, true)
useGLTF.preload(CAR_URL, false, true)
