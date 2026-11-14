// Prepares the downloaded Brezza for the site: scaled to real size, wheels grouped on their
// own pivots (WheelFL, WheelFR, WheelRL, WheelRR), meshes merged and thinned, textures as webp.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, simplify, textureCompress, meshopt, flatten, join, getBounds } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const [SRC, OUT] = process.argv.slice(2)
const doc = await io.read(SRC)
const root = doc.getRoot()
const scene = root.listScenes()[0]

// The model is drawn about 15% oversized. Its wheelbase should be the real car's 2.5 m.
const WHEELS = { 'rim_': 'WheelFL', 'rim.001_': 'WheelRL', 'rim.002_': 'WheelFR', 'rim.003_': 'WheelRR' }
const centreOf = (prefix) => {
  const n = root.listNodes().find((x) => x.getName().startsWith(prefix + 'gear_part_blk'))
  const b = getBounds(n)
  return b.min.map((v, i) => (v + b.max[i]) / 2)
}
const wheelbase = Math.abs(centreOf('rim_')[2] - centreOf('rim.001_')[2])
const k = 2.5 / wheelbase
const shell = doc.createNode('Car').setScale([k, k, k])
for (const child of scene.listChildren()) shell.addChild(child)
scene.addChild(shell)
await doc.transform(flatten())

// After flattening every mesh node sits at the top with its world matrix. Hang each wheel's
// parts on a pivot at that wheel's centre.
const tops = root.listNodes().filter((n) => n.getMesh())
for (const [prefix, name] of Object.entries(WHEELS)) {
  const parts = tops.filter((n) => n.getName().startsWith(prefix))
  const b = parts.map((n) => getBounds(n)).reduce((a, c) => ({ min: a.min.map((v, i) => Math.min(v, c.min[i])), max: a.max.map((v, i) => Math.max(v, c.max[i])) }))
  const c = b.min.map((v, i) => (v + b.max[i]) / 2)
  const pivot = doc.createNode(name).setTranslation(c)
  scene.addChild(pivot)
  for (const n of parts) {
    const m = n.getMatrix()
    m[12] -= c[0]; m[13] -= c[1]; m[14] -= c[2]
    n.setMatrix(m)
    pivot.addChild(n)
  }
  console.log(name, parts.length, 'parts at', c.map((v) => +v.toFixed(3)), 'radius', +((b.max[1] - b.min[1]) / 2).toFixed(3))
}

await doc.transform(
  dedup(),
  join({ keepNamed: false }),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.3, error: 0.0015 }),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)
let tris = 0
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? 0) / 3
const b = getBounds(scene)
console.log('scale', k.toFixed(4), 'tris', Math.round(tris), 'meshes', root.listMeshes().length, 'bounds', b.min.map((v) => +v.toFixed(2)), b.max.map((v) => +v.toFixed(2)))
await io.write(OUT, doc)
