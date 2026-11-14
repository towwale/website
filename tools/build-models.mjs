// Rebuilds public/models from the original downloads (see CREDITS.md for the sources).
// Run from a folder holding the unpacked downloads as truck/source/ and car/:
//   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp
//   node build-models.mjs /path/to/website/public/models
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, simplify, textureCompress, meshopt, compactPrimitive } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const OUT = process.argv[2]

/* ---------- truck ---------- */
{
  const doc = await io.read('truck/source/Kenworth T440 Tow Truck.glb')
  const root = doc.getRoot()
  const scene = root.listScenes()[0]
  const byName = (s) => root.listNodes().find((n) => n.getName().includes(s))

  // Manufacturer badges and the static winch wire are not needed.
  for (const name of ['kenworth_emblems', 'Line007_wire']) { const n = byName(name); n?.dispose() }

  // The platform mesh holds both the sliding bed and parts bolted to the chassis.
  // Split it by connected piece: anything sitting at deck height and behind the cab is the bed.
  const platform = byName('tow_platform')
  const prim = platform.getMesh().listPrimitives()[0]
  const pos = prim.getAttribute('POSITION'), idx = prim.getIndices()
  const wm = platform.getWorldMatrix()
  const n = pos.getCount(), P = [], key = new Map(), rep = new Int32Array(n)
  for (let i = 0; i < n; i++) {
    const p = pos.getElement(i, [])
    const w = [wm[0]*p[0]+wm[4]*p[1]+wm[8]*p[2]+wm[12], wm[1]*p[0]+wm[5]*p[1]+wm[9]*p[2]+wm[13], wm[2]*p[0]+wm[6]*p[1]+wm[10]*p[2]+wm[14]]
    P.push(w)
    const k = w.map((v) => Math.round(v * 10)).join(',')
    if (!key.has(k)) key.set(k, i)
    rep[i] = key.get(k)
  }
  const parent = new Int32Array(n).map((_, i) => i)
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a] } return a }
  const tris = idx.getCount() / 3
  for (let t = 0; t < tris; t++) {
    const a = find(rep[idx.getScalar(t*3)])
    parent[find(rep[idx.getScalar(t*3+1)])] = a
    parent[find(rep[idx.getScalar(t*3+2)])] = a
  }
  const comp = new Map()
  for (let t = 0; t < tris; t++) {
    const r = find(rep[idx.getScalar(t*3)])
    let c = comp.get(r); if (!c) { c = { minY: 1e9, maxZ: -1e9 }; comp.set(r, c) }
    for (let j = 0; j < 3; j++) { const p = P[idx.getScalar(t*3+j)]; c.minY = Math.min(c.minY, p[1]); c.maxZ = Math.max(c.maxZ, p[2]) }
  }
  const bedIdx = [], fixedIdx = []
  for (let t = 0; t < tris; t++) {
    const c = comp.get(find(rep[idx.getScalar(t*3)]))
    const target = c.minY >= 112 && c.maxZ < 200 ? bedIdx : fixedIdx
    target.push(idx.getScalar(t*3), idx.getScalar(t*3+1), idx.getScalar(t*3+2))
  }
  console.log('platform split: bed', bedIdx.length / 3, 'fixed', fixedIdx.length / 3)
  const makePart = (name, indices) => {
    const p = prim.clone()
    for (const sem of prim.listSemantics()) p.setAttribute(sem, prim.getAttribute(sem).clone())
    p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)))
    compactPrimitive(p)
    const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(p)).setMatrix(platform.getMatrix())
    return node
  }
  const bedMesh = makePart('BedDeck', bedIdx)
  const fixedMesh = makePart('ChassisGear', fixedIdx)
  platform.dispose()
  scene.addChild(fixedMesh)

  // Everything that rides on the bed goes under one node so it can slide and tilt together.
  const bed = doc.createNode('Bed')
  scene.addChild(bed)
  bed.addChild(bedMesh)
  for (const name of ['cones_cones', 'Object010_kenworth_taillights', 'flash_lights_glass', 'flash_lights_lamps', 'flash_lights_chrome', 'flash_lights_plastic_flash_lights_plastic_0_0', 'flash_lights_plastic_flash_lights_plastic_0']) {
    const node = root.listNodes().find((x) => x.getName().startsWith(name))
    if (node) bed.addChild(node); else console.log('missing', name)
  }

  const rename = { wheel_FL001: 'Wheel_FR', wheel_FL_: 'Wheel_FL', wheel_RR1: 'Wheel_RR1', wheel_RR2: 'Wheel_RR2', wheel_RL1: 'Wheel_RL1', wheel_RL2: 'Wheel_RL2', kenworth_cabin: 'Cabin', flash_lights_lamps: 'Beacon' }
  for (const node of root.listNodes()) for (const [k, v] of Object.entries(rename)) if (node.getName().startsWith(k)) node.setName(v)
  for (const m of root.listMaterials()) if (m.getName() === 'cabin') m.setName('Paint')

  await doc.transform(
    dedup(), prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(`${OUT}/truck.glb`, doc)
}

/* ---------- car ---------- */
{
  const doc = await io.read('car/mercedes_e_class_w212.glb')
  const root = doc.getRoot()
  // Keep only the hood-and-boot animation; the stranded car sits with its bonnet up.
  for (const a of root.listAnimations()) { if (a.getName() !== 'model_hood_and_trunk_open') a.dispose(); else a.setName('open') }
  for (const name of ['Pedal001', 'Pedal002', 'Pedal003', 'Gauge_Temp', 'Gauge_Speed', 'Gauge_RPM', 'Gauge_Fuel']) root.listNodes().find((n) => n.getName() === name)?.dispose()
  await doc.transform(
    dedup(), weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.0008 }),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 80 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(`${OUT}/car.glb`, doc)
}
