// Shared state between the page (scroll, pointer) and the 3D stage.
// Plain mutable objects: the render loop reads them every frame without React re-renders.

// u is where the story is, in scenes: 0 hero, 1 the call, 2 breakdown, 3 loading, 4 charges,
// 5 services, 6 cities, 7 questions, 8 delivered, 9 booking, 10 footer. The fraction is how
// far through that scene the page has been scrolled.
// ready: the models have loaded and drawn. go: the preloader has lifted and the intro may play.
// spin / spinTo: degrees the visitor has dragged the camera round the truck in the hero.
export const stage = { u: 0, mouseX: 0, mouseY: 0, spin: 0, spinTo: 0, held: false, ready: false, go: false }

// The moving parts of the scene.
export const rig = {
  pin: 0,      // 0..1, the location pin over the stranded car
  hood: 1,     // 1 = bonnet up, 0 = closed (only for car models that have one)
  slide: 0,    // how far the bed has slid back, in metres
  tilt: 0,     // bed tilt, in radians
  carT: 0,     // 0 = car on the road behind the truck, 1 = car at rest on the bed
  strapped: false,
  gap: 0,      // how far the car is from its loading spot behind the truck: + ahead, - further back
  dist: 0,     // metres the truck has travelled along the route, from scroll
  idle: 0,     // extra metres rolled while cruising in the hero, from time
  roadAt: 0,   // dist + idle: where the repeating road surface is under the truck
  barrier: 0,  // 0..1, the toll barrier lifting
  lane: 0,     // metres the truck is off its lane's centre line: + toward the far side, - toward the near verge
  heading: 0,  // radians the truck is turned from straight ahead, + toward the far side
  carZ: 0,     // the same two for the car: on its own until loaded, then with the truck, then left in the yard
  carYaw: 0,
  slot: -1,    // which service is on show while the truck passes the service cards (0..8, fractional), else -1
  clock: 6,    // time of day shown on screen, in hours
  night: 0,    // kept at 0: the story stays in daylight
  rolled: 0,   // metres the wheels have rolled: counts back when the truck reverses
}

export const SLIDE_MAX = 4.4
export const TILT_MAX = 0.2744 // 15.7 degrees: the angle at which the bed's tail meets the road

const clamp = (v) => Math.min(1, Math.max(0, v))
const ease = (t) => t * t * (3 - 2 * t)
export const span = (p, a, b) => ease(clamp((p - a) / (b - a)))

/* ---------- the route ---------- */
export const CAR_START_X = -14.6
// Where things stand along the road, in metres from the start.
export const SPOT = {
  car: 232,
  toll: 360,
  jobs: [452, 498, 544, 590, 636, 682],
  boards: [752, 800, 848, 892],
  garage: 1092, // where the truck stops to unload, in the repair yard
}
const LOAD_AT = SPOT.car - CAR_START_X // truck position with the car in loading position behind it
const OVER = 9 // metres the truck runs past its loading position before backing up to the car
const LOADING = [2.45, 3.95]
// The ending plays while the "delivered" section is pinned, which lasts until 8.86.
const UNLOADING = [8.15, 8.42]
// After unloading the truck drives on to the depot next door, swings out, and backs into its bay.
const FORWARD = [8.44, 8.61]
const REVERSE = [8.64, 8.84]

// Distance against story position. The third value says how the leg ending there is driven:
// in = pulling away from rest, out = coming to rest, both, or (default) steady.
const ROUTE = [
  [0, 0], [1, 60], [2, 160],
  [2.3, LOAD_AT + OVER, 'out'], [2.45, LOAD_AT, 'both'], [4, LOAD_AT],
  [4.3, 292, 'in'], [5, 424], [6, 722], [7, 902],
  [7.8, 1030],
  [8.13, SPOT.garage, 'out'], [11, SPOT.garage],
]
export function distAt(u) {
  let i = 0
  while (i < ROUTE.length - 2 && u > ROUTE[i + 1][0]) i++
  const [u0, d0] = ROUTE[i], [u1, d1, how] = ROUTE[i + 1]
  let t = clamp((u - u0) / (u1 - u0))
  if (how === 'in') t = t * t
  else if (how === 'out') t = 1 - (1 - t) * (1 - t)
  else if (how === 'both') t = ease(t)
  return d0 + (d1 - d0) * t
}

// Sideways position. The highway has three lanes each way; the truck runs in the middle one
// (z = 0) and the stranded car stands in the slow lane to its left. So the truck passes the
// car without leaving its lane, pulls in ahead of it, and backs up the last few metres.
// At the end it turns off the road into the yard.
export const SLOW = -3.5     // the left lane: where the stranded car stands, and where the truck loads it
export const YARD_Z = -15.6
const PASSED = SPOT.car + 10.4 // here the truck's tail is clear of the car
const PULL = -2.4            // how far it has pulled in by the time it stops
function laneOf(u, d) {
  if (u < 2.3) return PULL * ease(clamp((d - PASSED) / (LOAD_AT + OVER - PASSED)))
  if (u < LOADING[0]) return PULL + (SLOW - PULL) * ease(clamp((LOAD_AT + OVER - d) / OVER))
  const back = SLOW * (1 - span(d, LOAD_AT + 2, LOAD_AT + 50))
  const yard = YARD_Z * span(d, SPOT.garage - 72, SPOT.garage - 4)
  return back + yard
}

/* ---------- parking at the depot ---------- */
// The depot is a row of bays along the back of the yard: trucks stand nose-out, facing the road.
// `slot` is the empty bay the truck backs into, `z` where a parked truck's origin sits.
export const DEPOT = { slot: SPOT.garage + 44, z: -36, bay: 4.4 }
const BACK = 4.9 // the rear axles are this far behind the truck's origin: they are what follows the path
const SWING = 55 * Math.PI / 180 // how far the truck has turned toward the road when it stops to reverse
const TURN = [DEPOT.slot + 8.5, -15] // where the rear axles are at that moment
const turnDir = [Math.cos(SWING), Math.sin(SWING)]
// Each leg is a cubic curve of [along the road, across]: out and round, then back into the bay.
const LEG_OUT = [
  [SPOT.garage - BACK, YARD_Z], [SPOT.garage - BACK + 24, YARD_Z],
  [TURN[0] - 14 * turnDir[0], TURN[1] - 14 * turnDir[1]], TURN,
]
const LEG_IN = [
  TURN, [TURN[0] - 7 * turnDir[0], TURN[1] - 7 * turnDir[1]],
  [DEPOT.slot, DEPOT.z - BACK + 13], [DEPOT.slot, DEPOT.z - BACK],
]
const at = [0, 0, 0, 0]
function curve(c, t) {
  const m = 1 - t
  for (let i = 0; i < 2; i++) {
    at[i] = m * m * m * c[0][i] + 3 * m * m * t * c[1][i] + 3 * m * t * t * c[2][i] + t * t * t * c[3][i]
    at[i + 2] = 3 * (m * m * (c[1][i] - c[0][i]) + 2 * m * t * (c[2][i] - c[1][i]) + t * t * (c[3][i] - c[2][i]))
  }
  return at
}
// Length of a leg up to t, from a table measured once.
function lengths(c) {
  const table = [0]
  let px = c[0][0], pz = c[0][1]
  for (let i = 1; i <= 48; i++) {
    const p = curve(c, i / 48)
    table.push(table[i - 1] + Math.hypot(p[0] - px, p[1] - pz))
    px = p[0]; pz = p[1]
  }
  return table
}
const OUT_LENGTH = lengths(LEG_OUT)
const IN_LENGTH = lengths(LEG_IN)
const lengthAt = (table, t) => {
  const f = clamp(t) * 48, i = Math.min(47, Math.floor(f))
  return table[i] + (table[i + 1] - table[i]) * (f - i)
}

// Where the truck is and which way it faces at story position u: { d, lane, heading, rolled }.
const place = { d: 0, lane: 0, heading: 0, rolled: 0 }
function poseAt(u) {
  if (u <= FORWARD[0]) {
    const d = distAt(u)
    place.d = d; place.lane = laneOf(u, d); place.rolled = d
    // Heading follows the path actually driven, forwards or in reverse.
    const e = 0.004, dd = distAt(u + e) - distAt(u - e)
    place.heading = Math.abs(dd) > 1e-4 ? Math.atan((laneOf(u + e, distAt(u + e)) - laneOf(u - e, distAt(u - e))) / dd) : 0
    return place
  }
  const backing = u >= REVERSE[0]
  const t = backing ? span(u, REVERSE[0], REVERSE[1]) : span(u, FORWARD[0], FORWARD[1])
  const p = curve(backing ? LEG_IN : LEG_OUT, t)
  // Driving forward the truck faces the way it moves; backing up it faces the other way.
  const h = backing ? Math.atan2(-p[3], -p[2]) : Math.atan2(p[3], p[2])
  place.heading = h
  place.d = p[0] + BACK * Math.cos(h)
  place.lane = p[1] + BACK * Math.sin(h)
  place.rolled = SPOT.garage + (backing ? OUT_LENGTH[48] - lengthAt(IN_LENGTH, t) : lengthAt(OUT_LENGTH, t))
  return place
}
// For checking the route outside the browser.
export const poseFor = (u) => ({ ...poseAt(u) })

// How far through loading (0..1) and unloading (0..1) the story is.
export const loadingAt = (u) => clamp((u - LOADING[0]) / (LOADING[1] - LOADING[0]))
export const unloadingAt = (u) => clamp((u - UNLOADING[0]) / (UNLOADING[1] - UNLOADING[0]))

// Set every moving part for story position u.
export function applyStory(u) {
  const { d, lane, heading, rolled } = poseAt(u)
  const q = loadingAt(u)
  const r = unloadingAt(u)
  rig.dist = d
  rig.lane = lane
  rig.heading = heading
  rig.rolled = rolled
  rig.slide = SLIDE_MAX * (span(q, 0.05, 0.24) - span(q, 0.76, 0.95) + span(r, 0.04, 0.24) - span(r, 0.78, 0.96))
  rig.tilt = TILT_MAX * (span(q, 0.13, 0.34) - span(q, 0.68, 0.84) + span(r, 0.12, 0.34) - span(r, 0.7, 0.86))
  rig.carT = span(q, 0.36, 0.66) - span(r, 0.38, 0.68)
  rig.strapped = q > 0.95 && r < 0.03
  // Before loading the car waits at its spot on the road; after unloading it stays in the repair yard.
  const carried = u >= LOADING[0] && u < UNLOADING[1] - 0.02
  rig.gap = u < LOADING[0] ? LOAD_AT - d : carried ? 0 : SPOT.garage - d
  rig.carZ = u < LOADING[0] ? SLOW : carried ? rig.lane : YARD_Z
  rig.carYaw = carried ? rig.heading : 0
  rig.slot = u >= 5 && u <= 6 ? (u - 5) * 8 : -1
  rig.pin = span(u, 1.1, 1.6) * (1 - span(u, 2.5, 2.7))
  rig.barrier = span(d, SPOT.toll - 30, SPOT.toll - 9)
  rig.clock = 6 + u
}

// The captions of the loading scene: which one is showing.
export const LOAD_STEPS = [0, 0.02, 0.36, 0.68] // against loadingAt(u); the first shows from scene 2
export const loadStepAt = (u) => {
  const q = loadingAt(u)
  let i = 0
  while (i < LOAD_STEPS.length - 1 && q >= LOAD_STEPS[i + 1]) i++
  return i
}

/* ---------- bed and car geometry (metres, truck facing +x) ---------- */
// The bed pivots about this point at the back of the chassis.
// It sits at the very end of the frame rails, so the tilting bed clears the truck's own tail.
export const PIVOT = { x: -7.25, y: 1.08 }
const DECK_TOP = 0.1    // deck surface above the pivot
const CAR_REST = 4.4    // where the car's centre sits on the bed, measured along the bed from the pivot
const AXLE = 1.25       // half the car's wheelbase

function deckPoint(l, tilt, out) {
  const c = Math.cos(tilt), s = Math.sin(tilt)
  out[0] = PIVOT.x + l * c - DECK_TOP * s
  out[1] = PIVOT.y + l * s + DECK_TOP * c
  return out
}

// A point fixed to the sliding bed: `l` along the bed, `h` above the pivot line.
export function bedPoint(l, h, out) {
  const c = Math.cos(rig.tilt), s = Math.sin(rig.tilt)
  const x = l - rig.slide
  out[0] = PIVOT.x + x * c - h * s
  out[1] = PIVOT.y + x * s + h * c
  return out
}

const front = [0, 0]
const rear = [0, 0]
const foot = [0, 0]

// Where the car is: on the road, climbing the tilted bed, or riding on it.
// Writes { x, y, rot, roll } where roll is the distance its wheels have turned.
export function carPose(out) {
  const end = CAR_REST - SLIDE_MAX
  const s = Math.sin(TILT_MAX), c = Math.cos(TILT_MAX)
  const lFoot = -(PIVOT.y + DECK_TOP * c) / s // where the deck line meets the road
  deckPoint(lFoot, TILT_MAX, foot)
  const start = lFoot + (CAR_START_X - foot[0])

  if (rig.carT >= 1) {
    deckPoint(CAR_REST - rig.slide, rig.tilt, front)
    out.x = front[0]; out.y = front[1]; out.rot = rig.tilt; out.roll = end - start
    return out
  }

  const a = start + (end - start) * rig.carT
  const at = (l, p) => {
    if (l >= lFoot) return deckPoint(l, TILT_MAX, p)
    p[0] = foot[0] + (l - lFoot); p[1] = 0
    return p
  }
  at(a + AXLE, front)
  at(a - AXLE, rear)
  out.x = (front[0] + rear[0]) / 2
  out.y = (front[1] + rear[1]) / 2
  out.rot = Math.atan2(front[1] - rear[1], front[0] - rear[0])
  out.roll = a - start
  return out
}
