// The street bike: scaled to 2.05 m long, centred, on the ground, thinned to about a third, textures 1k webp.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, flatten, join, simplify, textureCompress, meshopt, getBounds } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const [SRC, OUT] = process.argv.slice(2)
const doc = await io.read(SRC)
const scene = doc.getRoot().listScenes()[0]
const b = getBounds(scene)
const k = 2.05 / Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2])
const shell = doc.createNode('Bike').setScale([k, k, k]).setTranslation([-((b.min[0] + b.max[0]) / 2) * k, -b.min[1] * k, -((b.min[2] + b.max[2]) / 2) * k])
for (const child of scene.listChildren()) shell.addChild(child)
scene.addChild(shell)
await doc.transform(flatten(), dedup(), join({ keepNamed: false }), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.32, error: 0.001 }), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
let tris = 0
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? 0) / 3
const n = getBounds(scene)
console.log('bike tris', Math.round(tris), 'size', n.max.map((v, i) => +(v - n.min[i]).toFixed(2)))
await io.write(OUT, doc)
