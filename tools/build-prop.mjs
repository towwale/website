// Prepares a downloaded model as a prop: scaled so its longest side on the ground is
// `length` metres, centred on the origin, sitting on y = 0, textures as webp, meshopt-packed.
//   node build-prop.mjs in.glb out.glb length
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, flatten, join, textureCompress, meshopt, getBounds } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'

await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const [SRC, OUT, LENGTH] = process.argv.slice(2)
const doc = await io.read(SRC)
const scene = doc.getRoot().listScenes()[0]
const b = getBounds(scene)
// A length of 0 keeps the model's own size (scanned props are already in metres).
const k = +LENGTH ? +LENGTH / Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]) : 1
const shell = doc.createNode('Prop').setScale([k, k, k]).setTranslation([-((b.min[0] + b.max[0]) / 2) * k, -b.min[1] * k, -((b.min[2] + b.max[2]) / 2) * k])
for (const child of scene.listChildren()) shell.addChild(child)
scene.addChild(shell)
await doc.transform(flatten(), dedup(), join({ keepNamed: false }), weld(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [+(process.argv[5] ?? 1024), +(process.argv[5] ?? 1024)], quality: 80 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
const n = getBounds(scene)
console.log(OUT.split('/').pop(), 'scale', k.toFixed(5), 'size', n.max.map((v, i) => +(v - n.min[i]).toFixed(2)), 'long axis', n.max[0] - n.min[0] > n.max[2] - n.min[2] ? 'x' : 'z')
await io.write(OUT, doc)
