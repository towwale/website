import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { rig, SPOT, SLOW, DEPOT, YARD_Z, CAR_START_X } from './rig.js'
import Fleet from './Fleet.jsx'
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
  const lamp = (x) => { const at = x + rig.dist; return at < SPOT.garage - 80 || at > SPOT.garage + 100 ? 1 : 0 }
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
      <Row count={6} spacing={32} place={(o, x) => { o.position.set(x, 5.4, MEDIAN); o.rotation.set(0, 0, 0); o.scale.setScalar(lamp(x)) }}>
        <cylinderGeometry args={[0.08, 0.13, 9, 12]} />
        <meshStandardMaterial color="#8d9196" metalness={0.8} roughness={0.4} />
      </Row>
      <Row count={6} spacing={32} place={(o, x) => { o.position.set(x, 9.8, MEDIAN); o.rotation.set(0, 0, 0); o.scale.setScalar(lamp(x)) }}>
        <boxGeometry args={[0.12, 0.12, 7.4]} />
        <meshStandardMaterial color="#8d9196" metalness={0.8} roughness={0.4} />
      </Row>
      <Row count={12} spacing={16} place={(o, x, i) => { o.position.set(x + (i % 2 ? 8 : -8) - 8, 9.72, MEDIAN + (i % 2 ? 3.5 : -3.5)); o.rotation.set(0, 0, 0); o.scale.setScalar(lamp(x + (i % 2 ? 8 : -8) - 8)) }}>
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
    arm.current.rotation.x = -rig.barrier * 1.52
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
        {/* Booths stand clear of the truck's lane, and the arm swings up from the near booth */}
        <Block at={[2, 1.3, -2.15]} size={[2.4, 2.6, 0.8]} color="#f1efe6" />
        <Block at={[2, 1.3, 2.15]} size={[2.4, 2.6, 0.8]} color="#f1efe6" />
        <group ref={arm} position={[0.4, 1.1, -1.7]}>
          <Block at={[0, 0, 1.6]} size={[0.12, 0.12, 3.2]} color="#c8161d" />
        </group>
      </group>

      <Yard />

    </group>
  )
}

/* ---------- the yard ---------- */
// Where the trip ends, on the near side of the road at ground level. It is two places side by
// side behind one chain-link fence. First the repair yard: accident-damaged cars parked in
// marked bays, and a drop bay where the truck sets its car down. Then the depot: a row of bays
// where the fleet stands nose-out, with one bay left empty for the truck to back into.
const G = SPOT.garage
const YARD = { from: G - 68, to: G + 72, front: LEFT - 0.3, back: -45, wall: G + 20 }
const MODULE = 1.91
const run = (count, place) => Array.from({ length: count }, (_, i) => place(i))
const FENCE = [
  ...run(Math.ceil((YARD.to - YARD.from) / MODULE), (i) => [YARD.from + i * MODULE, 0, YARD.back, 0]),
  ...run(14, (i) => [YARD.from, 0, YARD.back + i * MODULE, -Math.PI / 2]),
  ...run(14, (i) => [YARD.to, 0, YARD.back + i * MODULE, -Math.PI / 2]),
  // between the repair yard and the depot
  ...run(8, (i) => [YARD.wall, 0, YARD.back + i * MODULE, -Math.PI / 2]),
]

// Repair yard: two rows of bays, cars parked square to the fence. Not machine-perfect: each
// stands a little off line, the way cars are left by hand.
const PITCH = 3.3
const ROWS = [-41.7, -28.8]
const off = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 43758.5453 % 1 // steady scatter, -1..1
const BAYS = ROWS.flatMap((z, r) => run(24, (i) => ({ x: G - 63 + i * PITCH, z, n: r * 24 + i })))
const COVER = new Set([5, 14, 30, 41])
const EMPTY = new Set([9, 20, 27, 37, 45])
const parked = BAYS.filter((b) => !COVER.has(b.n) && !EMPTY.has(b.n))
// The two wreck models are built facing different ways: one needs a quarter turn to stand in a bay.
const WRECKS_A = parked.filter((b) => b.n % 2 === 0).map((b) => [b.x + off(b.n, 1) * 0.12, 0, b.z + off(b.n, 2) * 0.3, Math.PI / 2 + off(b.n, 3) * 0.04])
const WRECKS_B = parked.filter((b) => b.n % 2 === 1).map((b) => [b.x + off(b.n, 1) * 0.12, 0, b.z + off(b.n, 2) * 0.3, (b.n % 4 === 1 ? 0 : Math.PI) + off(b.n, 3) * 0.04])
const COVERED = BAYS.filter((b) => COVER.has(b.n)).map((b) => [b.x, 0, b.z, Math.PI / 2])
// Workshop clutter kept to the edges: drums by the side fence, tyres stacked against the dividing fence.
const BARRELS = [[G - 66, 0, -20.5], [G - 66.1, 0, -21.4], [G - 65.2, 0, -21], [G - 66, 0, -22.4], [G + 18.6, 0, -34.2], [G + 18.7, 0, -35.1]]
const TYRES_FLAT = [
  ...[0, 1, 2, 3, 4, 5].map((i) => [G + 18.6, 0.085 + i * 0.17, -31.4, i * 0.9, 1, -Math.PI / 2]),
  ...[0, 1, 2, 3, 4].map((i) => [G + 18.6, 0.085 + i * 0.17, -32.2, i * 0.5, 1, -Math.PI / 2]),
  ...[0, 1, 2, 3].map((i) => [G + 18.6, 0.085 + i * 0.17, -33, i * 1.3, 1, -Math.PI / 2]),
  ...[0, 1, 2, 3, 4].map((i) => [G + 17.8, 0.085 + i * 0.17, -31.8, i * 0.7, 1, -Math.PI / 2]),
  ...[0, 1, 2].map((i) => [G + 17.8, 0.085 + i * 0.17, -32.6, i * 1.1, 1, -Math.PI / 2]),
]

// Depot: the working truck's bay and five more of the same flatbed either side of it, then two
// bays for the small tow trucks. Everything is parked tail to the fence, nose to the road.
const NOSE_OUT = -Math.PI / 2
const TRUCKS = [-3, -2, -1, 1, 2].map((i) => [DEPOT.slot + i * DEPOT.bay, DEPOT.z, NOSE_OUT])
const SMALL_BAY = 3.6
const SMALL_FROM = DEPOT.slot + 2.5 * DEPOT.bay
const SMALL = [0, 1].map((i) => [SMALL_FROM + (i + 0.5) * SMALL_BAY, YARD.back + 4.2, NOSE_OUT])

// Painted lines: [along the road, across, length, runs across the road?]
const WHITE = [
  ...ROWS.flatMap((z) => run(25, (i) => [G - 63 + (i - 0.5) * PITCH, z, 5.4, true])),
]
const dropX = G + CAR_START_X
const YELLOW = [
  ...run(7, (i) => [DEPOT.slot + (i - 3.5) * DEPOT.bay, YARD.back + 7.4, 13.6, true]),
  ...run(2, (i) => [SMALL_FROM + (i + 1) * SMALL_BAY, YARD.back + 4, 6.8, true]),
  // the drop bay, where the delivered car is set down
  [dropX, YARD_Z - 1.5, 6.4, false], [dropX, YARD_Z + 1.5, 6.4, false], [dropX - 3.2, YARD_Z, 3, true], [dropX + 3.2, YARD_Z, 3, true],
]

function Lines({ places, color }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const at = new THREE.Object3D()
    places.forEach(([x, z, length, across], i) => {
      at.position.set(x, 0.012, z); at.rotation.set(-Math.PI / 2, 0, across ? Math.PI / 2 : 0); at.scale.set(length, 0.13, 1); at.updateMatrix()
      ref.current.setMatrixAt(i, at.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [places])
  return (
    <instancedMesh ref={ref} args={[null, null, places.length]} frustumCulled={false} receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} roughness={0.85} transparent opacity={0.82} depthWrite={false} polygonOffset polygonOffsetFactor={-3} />
    </instancedMesh>
  )
}

function Yard() {
  const length = YARD.to - YARD.from, depth = YARD.front - YARD.back
  const concrete = useSurface('concrete_floor_worn_001', length, depth, 6)
  return (
    <group>
      <mesh position={[(YARD.from + YARD.to) / 2, 0.004, (YARD.front + YARD.back) / 2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[length, depth]} />
        <meshStandardMaterial map={concrete.map} normalMap={concrete.normalMap} roughness={0.96} color={PALE_CONCRETE} envMapIntensity={0.25} />
      </mesh>
      <Lines places={WHITE} color="#e9e6dc" />
      <Lines places={YELLOW} color="#f2b90f" />
      <Scatter url={PROP('fence')} places={FENCE} />
      <Scatter url={WRECK_A_URL} places={WRECKS_A} />
      <Scatter url={WRECK_B_URL} places={WRECKS_B} />
      <Scatter url={PROP('covered_car')} places={COVERED} />
      <Scatter url={PROP('Barrel_01')} places={BARRELS} />
      <Scatter url={PROP('old_tyre')} places={TYRES_FLAT} />
      <Fleet trucks={TRUCKS} small={SMALL} />
    </group>
  )
}
