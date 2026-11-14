// The small tow truck parked at the depot: already in metres, facing +x, on the ground.
// Joined into as few meshes as its materials allow, textures 1k webp.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, flatten, join, textureCompress, meshopt, getBounds } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'
await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const [SRC, OUT] = process.argv.slice(2)
const doc = await io.read(SRC)
const scene = doc.getRoot().listScenes()[0]
const b = getBounds(scene)
const shell = doc.createNode('TowLite').setTranslation([-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2])
for (const child of scene.listChildren()) shell.addChild(child)
scene.addChild(shell)
await doc.transform(flatten(), dedup(), join({ keepNamed: false }), weld(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 84 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
const n = getBounds(scene)
console.log('meshes', doc.getRoot().listMeshes().length, 'size', n.max.map((v, i) => +(v - n.min[i]).toFixed(2)), 'min', n.min.map((v) => +v.toFixed(2)))
await io.write(OUT, doc)
