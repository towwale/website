// One fence module from Poly Haven's chain-link kit: a wire panel with a post at its left end,
// starting at x = 0 and running along +x, standing on y = 0.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, flatten, textureCompress, meshopt, getBounds } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'
await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const [SRC, OUT] = process.argv.slice(2)
const doc = await io.read(SRC)
await doc.transform(flatten())
const root = doc.getRoot()
const keep = { modular_chainlink_fence_double: null, modular_chainlink_fence_post: null }
for (const n of root.listNodes()) { if (n.getName() in keep && !keep[n.getName()]) keep[n.getName()] = n; else if (n.getMesh()) n.dispose() }
const panel = keep.modular_chainlink_fence_double, post = keep.modular_chainlink_fence_post
const pb = getBounds(panel), qb = getBounds(post)
const shift = (n, d) => { const m = n.getMatrix(); m[12] += d[0]; m[13] += d[1]; m[14] += d[2]; n.setMatrix(m) }
shift(panel, [-pb.min[0], 0, -(pb.min[2] + pb.max[2]) / 2])
shift(post, [-(qb.min[0] + qb.max[0]) / 2, 0, -(qb.min[2] + qb.max[2]) / 2])
await doc.transform(dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 82 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
const b = getBounds(root.listScenes()[0])
console.log('fence module', b.min.map((v) => +v.toFixed(2)), b.max.map((v) => +v.toFixed(2)), 'alpha', root.listMaterials().map((m) => m.getName().slice(-5) + ':' + m.getAlphaMode()).join(' '))
await io.write(OUT, doc)
