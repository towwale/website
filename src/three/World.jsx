import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { rig, SPOT, SLOW } from './rig.js'
import { WRECK_A_URL, WRECK_B_URL } from './Loads.jsx'

// The highway the truck works on: a six-lane flyover, three lanes each way either side of a
// median, with service roads on the ground below. The truck stays at the origin in the
// middle lane of its carriageway: when it drives, the deck and everything on it stream past.
// India drives on the left, so the median is on the truck's right.
// Surfaces are photographed materials and props are scanned objects from Poly Haven (CC0).
const LANE = 3.5
const LEFT = -6.75        // left edge of the tarmac (three lanes and a shoulder to the truck's left)
const RIGHT = 18.75       // right edge, beyond the opposite carriageway
const MEDIAN = 6          // z of the middle of the median
const WIDTH = RIGHT - LEFT
const MID = (LEFT + RIGHT) / 2
const TILE = 12           // metres between lane dashes
const LENGTH = 480
const LOOP = 192          // deck furniture repeats over this distance
const DROP = 8.5          // how far the ground lies below the deck
const PROP = (name) => `/models/props/${name}.glb`
const PALE_CONCRETE = new THREE.Color(1.25, 1.24, 1.2)

// Height of the ground under the road at a point on the route: the flyover runs most of the
// way, then comes down to ground level before the yard.
export const groundAt = (at) => {
  const t = Math.min(1, Math.max(0, (at - (SPOT.garage - 150)) / 70))
  return -DROP + (DROP - 0.03) * t * t * (3 - 2 * t)
}

// Past this point the flyover is coming down: the deck stands on a walled ramp, not on piers.
const RAMP = SPOT.garage - 126

// Lane markings only, on a clear background: they lie over the asphalt.
function linesTexture() {
  const c = document.createElement('canvas')
  c.width = 1024; c.height = 1024
  const g = c.getContext('2d')
  const m = 1024 / WIDTH
  const y = (z) => (z - LEFT) * m
  const solid = (z, colour) => { g.fillStyle = colour; g.fillRect(0, y(z) - 0.08 * m, 1024, 0.16 * m) }
  const dash = (z) => { g.fillStyle = 'rgba(241,239,230,0.92)'; g.fillRect(0, y(z) - 0.07 * m, 1024 * (4.5 / TILE), 0.14 * m) }
  solid(LEFT + 1.5, 'rgba(241,239,230,0.92)')
  dash(-LANE / 2); dash(LANE / 2)
  solid(MEDIAN - 0.9, 'rgba(255,194,14,0.95)')
  solid(MEDIAN + 0.9, 'rgba(255,194,14,0.95)')
  dash(MEDIAN + 0.75 + LANE); dash(MEDIAN + 0.75 + LANE * 2)
  solid(RIGHT - 1.5, 'rgba(241,239,230,0.92)')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = THREE.RepeatWrapping
  t.repeat.set(LENGTH / TILE, 1)
  t.anisotropy = 8
  return t
}

// The flyover's shadow on the ground: dark, soft at both edges.
function shadeTexture() {
  const c = document.createElement('canvas')
  c.width = 4; c.height = 128
  const g = c.getContext('2d')
  const fade = g.createLinearGradient(0, 0, 0, 128)
  fade.addColorStop(0, 'rgba(8,10,14,0)'); fade.addColorStop(0.1, 'rgba(8,10,14,1)')
  fade.addColorStop(0.9, 'rgba(8,10,14,1)'); fade.addColorStop(1, 'rgba(8,10,14,0)')
  g.fillStyle = fade; g.fillRect(0, 0, 4, 128)
  return new THREE.CanvasTexture(c)
}

// A two-lane service road: edge lines and a broken centre line on a clear background.
function serviceTexture() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(241,239,230,0.8)'
  g.fillRect(0, 6, 512, 4); g.fillRect(0, 118, 512, 4)
  g.fillRect(0, 62, 190, 4)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

// A photographed surface: colour, bumps and roughness, tiled every `size` metres.
function useSurface(name, width, depth, size) {
  const maps = useTexture({ map: `/textures/${name}_diff.jpg`, normalMap: `/textures/${name}_nor.jpg`, roughnessMap: `/textures/${name}_rough.jpg` })
  return useMemo(() => {
    const out = {}
    for (const [key, source] of Object.entries(maps)) {
      const t = source.clone()
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(width / size, depth / size)
      t.anisotropy = 8
      if (key === 'map') t.colorSpace = THREE.SRGBColorSpace
      t.needsUpdate = true
      out[key] = t
    }
    return out
  }, [maps, width, depth, size])
}
const slide = (maps, metres, size) => { for (const t of Object.values(maps)) t.offset.x = (metres / size) % 1 }

const wrap = (x) => ((((x + LOOP / 2) % LOOP) + LOOP) % LOOP) - LOOP / 2
const dummy = new THREE.Object3D()

// A row of identical things along the road that slide past and come round again.
function Row({ count, spacing, place, children, ...rest }) {
  const mesh = useRef()
  useFrame(() => {
    for (let i = 0; i < count; i++) {
      place(dummy, wrap(i * spacing - rig.roadAt), i)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false} castShadow receiveShadow {...rest}>{children}</instancedMesh>
}

// Many copies of one scanned prop. Each place is [x, y, z, turn, scale, tipX, tipZ].
function Scatter({ url, places }) {
  const { scene } = useGLTF(url, false, true)
  const meshes = useMemo(() => {
    scene.updateMatrixWorld(true)
    const out = []
    scene.traverse((o) => { if (o.isMesh) out.push(o) })
    return out
  }, [scene])
  return meshes.map((mesh, i) => <Copies key={i} mesh={mesh} places={places} />)
}
function Copies({ mesh, places }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const at = new THREE.Object3D()
    const m = new THREE.Matrix4()
    places.forEach(([x, y, z, turn = 0, k = 1, tipX = 0, tipZ = 0], i) => {
      at.position.set(x, y, z); at.rotation.set(tipX, turn, tipZ); at.scale.setScalar(k); at.updateMatrix()
      ref.current.setMatrixAt(i, m.multiplyMatrices(at.matrix, mesh.matrixWorld))
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [mesh, places])
  return <instancedMesh ref={ref} args={[mesh.geometry, mesh.material, places.length]} castShadow receiveShadow frustumCulled={false} />
}

export default function World() {
  const lines = useMemo(linesTexture, [])
  const asphalt = useSurface('asphalt_02', LENGTH, WIDTH, 4.3)
  const concrete = useSurface('concrete_wall_008', 6, 1, 2)
  const pier = useSurface('concrete_wall_008', 3, 3, 2.5)

  useFrame(() => {
    lines.offset.x = (rig.roadAt / TILE) % 1
    slide(asphalt, rig.roadAt, 4.3)
  })

  // The parapets, median barrier, lamps and piers ride with the deck. A piece is hidden where
  // the road has come down to the ground, so nothing stands across the yard's entrance.
  const high = (x) => groundAt(x + rig.dist) < -1.2
  const piered = (x) => x + rig.dist < RAMP
  const seg = (z, y) => (o, x) => { o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.scale.setScalar(high(x) ? 1 : 0) }
  return (
    <group>
      {/* Deck: the slab, the tarmac on it, the paint on that */}
      <mesh position={[0, -0.7, MID]} receiveShadow castShadow>
        <boxGeometry args={[LENGTH, 1.36, WIDTH + 1.4]} />
        <meshStandardMaterial color="#b9b8b2" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, MID]} receiveShadow>
        <planeGeometry args={[LENGTH, WIDTH]} />
        <meshStandardMaterial {...asphalt} color="#8a8b8e" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, MID]}>
        <planeGeometry args={[LENGTH, WIDTH]} />
        <meshStandardMaterial map={lines} transparent roughness={0.7} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>

      {/* Far edge: a concrete parapet in six-metre castings with a steel rail on top */}
      <Row count={32} spacing={6} place={seg(RIGHT + 0.35, 0.5)}>
        <boxGeometry args={[5.94, 1, 0.5]} />
        <meshStandardMaterial map={concrete.map} normalMap={concrete.normalMap} roughness={0.92} color={PALE_CONCRETE} />
      </Row>
      <Row count={32} spacing={6} place={seg(RIGHT + 0.35, 1.22)}>
        <boxGeometry args={[6, 0.07, 0.07]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.9} roughness={0.3} />
      </Row>
      {/* Near edge: a low kerb with an open steel railing, so the work on the road stays in view */}
      <Row count={32} spacing={6} place={seg(LEFT - 0.35, 0.19)}>
        <boxGeometry args={[5.94, 0.38, 0.5]} />
        <meshStandardMaterial map={concrete.map} normalMap={concrete.normalMap} roughness={0.92} color={PALE_CONCRETE} />
      </Row>
      <Row count={96} spacing={2} place={seg(LEFT - 0.35, 0.74)}>
        <boxGeometry args={[0.07, 0.72, 0.07]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.9} roughness={0.3} />
      </Row>
      {[0.76, 1.1].map((y) => (
        <Row key={y} count={32} spacing={6} place={seg(LEFT - 0.35, y)}>
          <boxGeometry args={[6, 0.06, 0.06]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.9} roughness={0.3} />
        </Row>
      ))}

      {/* Median: a concrete barrier with lamp columns carrying an arm over each carriageway */}
      <Row count={32} spacing={6} place={(o, x) => { o.position.set(x, 0.45, MEDIAN); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1) }}>
        <boxGeometry args={[5.94, 0.9, 0.6]} />
        <meshStandardMaterial map={concrete.map} normalMap={concrete.normalMap} roughness={0.92} color={PALE_CONCRETE} />
      </Row>
      <Row count={6} spacing={32} place={(o, x) => { o.position.set(x, 5.4, MEDIAN); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1) }}>
        <cylinderGeometry args={[0.08, 0.13, 9, 12]} />
        <meshStandardMaterial color="#8d9196" metalness={0.8} roughness={0.4} />
      </Row>
      <Row count={6} spacing={32} place={(o, x) => { o.position.set(x, 9.8, MEDIAN); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1) }}>
        <boxGeometry args={[0.12, 0.12, 7.4]} />
        <meshStandardMaterial color="#8d9196" metalness={0.8} roughness={0.4} />
      </Row>
      <Row count={12} spacing={16} place={(o, x, i) => { o.position.set(x + (i % 2 ? 8 : -8) - 8, 9.72, MEDIAN + (i % 2 ? 3.5 : -3.5)); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1) }}>
        <boxGeometry args={[0.8, 0.1, 0.36]} />
        <meshStandardMaterial color="#e9e6dc" roughness={0.5} />
      </Row>

      {/* Piers: a crosshead on two columns, as tall as the ground is far below */}
      <Row count={6} spacing={32} place={(o, x) => { o.position.set(x, -2.1, MID); o.rotation.set(0, 0, 0); o.scale.setScalar(piered(x) ? 1 : 0) }}>
        <boxGeometry args={[2.6, 1.5, WIDTH - 2]} />
        <meshStandardMaterial map={pier.map} normalMap={pier.normalMap} roughness={0.92} color={PALE_CONCRETE} />
      </Row>
      {[MID - 6.5, MID + 6.5].map((z) => (
        <Row key={z} count={6} spacing={32} place={(o, x) => { const h = -groundAt(x + rig.dist) - 2.8; o.position.set(x, -2.8 - h / 2, z); o.rotation.set(0, 0, 0); o.scale.set(piered(x) ? 1 : 0, Math.max(0.01, h), piered(x) ? 1 : 0) }}>
          <cylinderGeometry args={[1.05, 1.05, 1, 24]} />
          <meshStandardMaterial map={pier.map} normalMap={pier.normalMap} roughness={0.92} color={PALE_CONCRETE} />
        </Row>
      ))}
    </group>
  )
}

/* ---------- the ground below ---------- */
// Grass and scrub under the flyover, with a service road either side of it. This is laid out
// along the route, and rises to road level where the flyover ends.
// A strip of ground that follows the lie of the land along the route.
function strip(from, to, depth, lift = 0) {
  const g = new THREE.PlaneGeometry(to - from, depth, Math.round((to - from) / 6), 1)
  g.rotateX(-Math.PI / 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) p.setY(i, groundAt(p.getX(i) + (from + to) / 2) + lift)
  g.computeVertexNormals()
  return g
}

function Ground() {
  const from = -260, to = SPOT.garage + 420, depth = 760
  const end = SPOT.garage - 70 // the service roads run as far as the yard
  const foot = SPOT.garage - 79 // where the ramp meets the ground
  const grass = useSurface('aerial_grass_rock', to - from, depth, 26)
  const tarmac = useSurface('asphalt_02', end - from, 7, 4.3)
  const wall = useSurface('concrete_wall_008', foot - RAMP, DROP, 3)
  const paint = useMemo(() => { const t = serviceTexture(); t.repeat.set((end - from) / 12, 1); return t }, [end])
  const shade = useMemo(shadeTexture, [])
  const land = useMemo(() => strip(from, to, depth), [to])
  const road = useMemo(() => strip(from, end, 7, 0.03), [end])
  const marks = useMemo(() => strip(from, end, 7, 0.045), [end])
  const dark = useMemo(() => strip(from, RAMP + 6, WIDTH + 4, 0.02), [])
  // While the truck cruises on the spot in the opening shot, the ground has to pass too.
  useFrame(() => {
    slide(grass, rig.idle, 26)
    slide(tarmac, rig.idle, 4.3)
    paint.offset.x = (rig.idle / 12) % 1
  })
  return (
    <group>
      <mesh geometry={land} position={[(from + to) / 2, 0, MID]} receiveShadow>
        <meshStandardMaterial map={grass.map} normalMap={grass.normalMap} roughness={1} color="#cfd2c4" envMapIntensity={0.3} />
      </mesh>
      {/* The deck's shadow: the sun is on the truck's side, so it falls a little to the far side */}
      <mesh geometry={dark} position={[(from + RAMP + 6) / 2, 0, MID + 4.6]}>
        <meshBasicMaterial map={shade} transparent opacity={0.5} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {[LEFT - 9, RIGHT + 9].map((z) => (
        <group key={z} position={[(from + end) / 2, 0, z]}>
          <mesh geometry={road} receiveShadow>
            <meshStandardMaterial {...tarmac} color="#9a9b9e" />
          </mesh>
          <mesh geometry={marks}>
            <meshStandardMaterial map={paint} transparent roughness={0.8} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
        </group>
      ))}
      {/* The ramp down to ground level stands on a retaining wall */}
      <mesh position={[(RAMP + foot) / 2, -0.04 - DROP / 2, MID]} castShadow receiveShadow>
        <boxGeometry args={[foot - RAMP, DROP, WIDTH + 1.36]} />
        <meshStandardMaterial map={wall.map} normalMap={wall.normalMap} roughness={0.94} color={PALE_CONCRETE} />
      </mesh>
    </group>
  )
}

/* ---------- landmarks ---------- */
// Things that stand at one place on the route. The group slides back as the truck advances,
// so each child is simply placed at its distance along the road.
function Block({ at, size, color = '#f1efe6', ...rest }) {
  return (
    <mesh position={at} castShadow receiveShadow {...rest}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  )
}

export function Landmarks() {
  const root = useRef()
  const arm = useRef()
  useFrame(() => {
    root.current.position.x = -rig.dist
    arm.current.rotation.x = -rig.barrier * 1.35
  })
  return (
    <group ref={root}>
      {/* Breakdown: concrete barriers closing the lane behind the stranded car */}
      <Ground />
      <Scatter url={PROP('concrete_road_barrier')} places={[[SPOT.car - 8, 0, SLOW - 0.9, 0.5], [SPOT.car - 11.4, 0, SLOW + 0.5, 0.5]]} />

      {/* Toll plaza across this carriageway: gantry, booths, a barrier that lifts */}
      <group position={[SPOT.toll, 0, 0]}>
        <Block at={[0, 3.4, LEFT - 0.2]} size={[0.5, 6.8, 0.5]} color="#8d9196" />
        <Block at={[0, 3.4, MEDIAN]} size={[0.5, 6.8, 0.5]} color="#8d9196" />
        <Block at={[0, 6.4, (LEFT + MEDIAN) / 2]} size={[1.2, 1.5, MEDIAN - LEFT + 1]} color="#16171a" />
        {[-LANE, 0, LANE].map((z) => <Block key={z} at={[-0.62, 6.4, z]} size={[0.06, 0.9, 2.4]} color="#ffc20e" />)}
        <Block at={[2, 1.3, -LANE / 2]} size={[2.4, 2.6, 0.9]} color="#f1efe6" />
        <Block at={[2, 1.3, LANE / 2]} size={[2.4, 2.6, 0.9]} color="#f1efe6" />
        <group ref={arm} position={[0.4, 1.1, -LANE / 2 + 0.5]}>
          <Block at={[0, 0, 1.4]} size={[0.12, 0.12, 2.8]} color="#c8161d" />
        </group>
      </group>

      <group position-z={YARD_AT}>
        <Yard />
      </group>

    </group>
  )
}

/* ---------- the yard ---------- */
// Where the trip ends: a recovery yard on the near side of the road. Concrete underfoot,
// chain-link fence on three sides, rows and stacks of accident-damaged cars, barrels and
// old tyres. The truck turns in, parks parallel to the road and unloads behind itself;
// that strip is kept clear.
const G = SPOT.garage
// The yard is laid out in its own frame, set back from the road by YARD_AT.
export const YARD_AT = LEFT + 2.1
const YARD = { from: G - 68, to: G + 72, front: LEFT - 0.3 - YARD_AT, back: -36 }
const MODULE = 1.91
const FENCE = [
  ...Array.from({ length: Math.ceil((YARD.to - YARD.from) / MODULE) }, (_, i) => [YARD.from + i * MODULE, 0, YARD.back, 0]),
  ...Array.from({ length: 14 }, (_, i) => [YARD.from, 0, YARD.back + i * MODULE, -Math.PI / 2]),
  ...Array.from({ length: 14 }, (_, i) => [YARD.to, 0, YARD.back + i * MODULE, -Math.PI / 2]),
]
// [along the road from the truck's parking spot, height, across, turn, scale, tipX, tipZ]
const WRECKS_A = [
  [-58, 0, -30, 0.08], [-46, 0, -30.4, -0.05], [-34, 0, -30, 0.12], [-22, 0, -30.3, 3.2], [-10, 0, -30, -0.1], [2, 0, -30.4, 0.06], [14, 0, -30, 3.05], [26, 0, -30.2, -0.08], [40, 0, -30, 0.1], [54, 0, -30.3, 3.2],
  [-46, 1.36, -30.3, 0.3, 1, 0, 0.05], [2, 1.36, -30.2, 3.3, 1, 0.04, 0], [40, 1.36, -30.1, -0.2, 1, 0, -0.05],
  [-56, 0, -21, 1.5], [44, 0, -20, 1.7], [58, 0, -21.5, 1.45],
]
const WRECKS_B = [
  [-52, 0, -30.2, 1.62], [-40, 0, -30, 1.5], [-28, 0, -30.3, 1.66], [-16, 0, -30, 4.7], [-4, 0, -30.2, 1.5], [8, 0, -30, 1.64], [20, 0, -30.3, 4.75], [33, 0, -30, 1.55], [47, 0, -30.2, 1.6],
  [-48, 0, -21.5, 0.2], [-40, 0, -20.5, 3.4], [36, 0, -21, 0.1], [50, 0, -20.6, 3.0],
]
const COVERED = [[-62, 0, -12, 0.1], [62, 0, -13, 3.2], [20, 0, -21, 1.6]]
const BARRELS = [[-64, 0, -6], [-63.2, 0, -6.9], [-64.4, 0, -7.8], [-63.5, 0, -8.6], [66, 0, -27], [67, 0, -27.8], [66.2, 0, -28.8], [30, 0, -22.6], [30.9, 0, -23.2], [-32, 0, -22], [-31.2, 0, -22.9]]
// Old tyres: heaps lying flat, a few leaning on the fence.
const TYRES_FLAT = [
  ...[0, 1, 2, 3, 4].map((i) => [-36, 0.085 + i * 0.17, -24 + 0.3, i * 0.7, 1, -Math.PI / 2]),
  ...[0, 1, 2, 3].map((i) => [-35.2, 0.085 + i * 0.17, -24.6 + 0.3, i * 1.1, 1, -Math.PI / 2]),
  ...[0, 1, 2].map((i) => [-36.4, 0.085 + i * 0.17, -25 + 0.3, i * 0.4, 1, -Math.PI / 2]),
  ...[0, 1, 2, 3, 4, 5].map((i) => [26, 0.085 + i * 0.17, -24 + 0.3, i * 0.9, 1, -Math.PI / 2]),
  ...[0, 1, 2, 3].map((i) => [26.8, 0.085 + i * 0.17, -24.5 + 0.3, i * 0.5, 1, -Math.PI / 2]),
  ...[0, 1].map((i) => [25.4, 0.085 + i * 0.17, -24.8 + 0.3, i, 1, -Math.PI / 2]),
]
const TYRES_UP = [[-37.2, 0, -25.4, 1.4, 1, 0, 0.2], [27.6, 0, -25.3, 1.7, 1, 0, -0.18], [-20, 0, -35.3, 0.1, 1, 0.2, 0], [-19.2, 0, -35.3, -0.1, 1, 0.22, 0]]
const BARRIERS = [[-66.5, 0, -3.6, 0], [-64.8, 0, -3.6, 0], [69, 0, -3.6, 0], [70.7, 0, -3.6, 0]]
const shift = (list) => list.map(([x, ...rest]) => [G + x, ...rest])

function Yard() {
  const length = YARD.to - YARD.from, depth = YARD.front - YARD.back
  const concrete = useSurface('concrete_floor_worn_001', length, depth, 6)
  const places = useMemo(() => ({
    a: shift(WRECKS_A), b: shift(WRECKS_B), covered: shift(COVERED), barrels: shift(BARRELS),
    flat: shift(TYRES_FLAT), up: shift(TYRES_UP), barriers: shift(BARRIERS),
  }), [])
  return (
    <group>
      <mesh position={[(YARD.from + YARD.to) / 2, 0.004, (YARD.front + YARD.back) / 2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[length, depth]} />
        <meshStandardMaterial map={concrete.map} normalMap={concrete.normalMap} roughness={0.96} color={PALE_CONCRETE} envMapIntensity={0.25} />
      </mesh>
      <Scatter url={PROP('fence')} places={FENCE} />
      <Scatter url={WRECK_A_URL} places={places.a} />
      <Scatter url={WRECK_B_URL} places={places.b} />
      <Scatter url={PROP('covered_car')} places={places.covered} />
      <Scatter url={PROP('Barrel_01')} places={places.barrels} />
      <Scatter url={PROP('old_tyre')} places={places.flat} />
      <Scatter url={PROP('old_tyre')} places={places.up} />
      <Scatter url={PROP('concrete_road_barrier')} places={places.barriers} />
    </group>
  )
}
