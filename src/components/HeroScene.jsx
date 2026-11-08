import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { heroState, reducedMotion } from '../lib/scroll.js'
import { business } from '../config.js'

const BG = { night: '#06080b', day: '#e9e4d9' }
const SPEED = reducedMotion ? 0 : 9 // road units per second
const lerp = (a, b, t) => a + (b - a) * t

/* ---------- materials ---------- */
function useMaterials() {
  return useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: '#ffb400', metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }),
    carPaint: new THREE.MeshPhysicalMaterial({ color: '#9e0f1c', metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0b1118', metalness: 0.9, roughness: 0.04 }),
    dark: new THREE.MeshStandardMaterial({ color: '#14181e', metalness: 0.5, roughness: 0.55 }),
    steel: new THREE.MeshStandardMaterial({ color: '#2b3038', metalness: 0.85, roughness: 0.35 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#dfe3e8', metalness: 1, roughness: 0.12 }),
    tyre: new THREE.MeshStandardMaterial({ color: '#0a0b0d', roughness: 0.92 }),
    head: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff4dc', emissiveIntensity: 9, toneMapped: false }),
    tail: new THREE.MeshStandardMaterial({ color: '#ff2a1f', emissive: '#ff1a10', emissiveIntensity: 6, toneMapped: false }),
    beacon: new THREE.MeshStandardMaterial({ color: '#ff9a00', emissive: '#ff8200', emissiveIntensity: 10, toneMapped: false }),
    amber: new THREE.MeshStandardMaterial({ color: '#ffb400', emissive: '#ffb400', emissiveIntensity: 0.4 }),
  }), [])
}

/* ---------- canvas textures ---------- */
function useDecal() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024; c.height = 96
    const g = c.getContext('2d')
    g.fillStyle = '#14181e'; g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = '#ffb400'
    g.font = '800 64px "Inter Tight", Arial, sans-serif'
    g.textBaseline = 'middle'
    g.fillText('TOWWALA', 28, 50)
    g.font = '600 34px "Inter Tight", Arial, sans-serif'
    g.fillStyle = '#e9e4d8'
    g.textAlign = 'right'
    g.fillText(`24x7 ROADSIDE  ·  ${business.phoneDisplay}`, c.width - 28, 52)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [])
}

function useGlow() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, 'rgba(255,214,150,1)')
    grd.addColorStop(0.4, 'rgba(255,180,90,.35)')
    grd.addColorStop(1, 'rgba(255,160,60,0)')
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
}

/* ---------- truck ---------- */
function Wheel({ position, r = 0.46, w = 0.36, m, spin = true }) {
  const ref = useRef()
  useFrame((_, dt) => { if (spin) ref.current.rotation.z -= (SPEED / r) * dt })
  return (
    <group position={position} ref={ref}>
      <mesh rotation-x={Math.PI / 2} material={m.tyre} castShadow>
        <cylinderGeometry args={[r, r, w, 40]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} material={m.chrome}>
        <cylinderGeometry args={[r * 0.56, r * 0.56, w + 0.02, 10]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} material={m.dark}>
        <cylinderGeometry args={[r * 0.2, r * 0.2, w + 0.04, 16]} />
      </mesh>
    </group>
  )
}

function Beacon({ m }) {
  const light = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const on = reducedMotion ? 1 : Math.max(0, Math.sin(t * 8)) ** 0.5
    m.beacon.emissiveIntensity = 1 + on * 12
    light.current.intensity = on * 14
  })
  return (
    <group position={[2.45, 2.47, 0]}>
      <mesh material={m.dark}><boxGeometry args={[0.46, 0.08, 1.4]} /></mesh>
      {[-0.48, 0, 0.48].map((z) => (
        <mesh key={z} position={[0, 0.1, z]} material={m.beacon}>
          <boxGeometry args={[0.28, 0.14, 0.32]} />
        </mesh>
      ))}
      <pointLight ref={light} color="#ff9000" distance={9} decay={1.6} position={[0, 0.5, 0]} />
    </group>
  )
}

function Headlights({ m, day }) {
  const target = useMemo(() => { const o = new THREE.Object3D(); o.position.set(14, -0.4, 0); return o }, [])
  const beam = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#fff1d0', transparent: true, opacity: day ? 0 : 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), [day])
  return (
    <group>
      <primitive object={target} />
      {[0.72, -0.72].map((z) => (
        <group key={z} position={[3.3, 1.08, z]}>
          <mesh material={m.head}><boxGeometry args={[0.05, 0.16, 0.34]} /></mesh>
          <mesh material={beam} position={[3.2, -0.35, 0]} rotation-z={Math.PI / 2 + 0.12}>
            <coneGeometry args={[1.1, 6.4, 32, 1, true]} />
          </mesh>
        </group>
      ))}
      <spotLight position={[3.4, 1.1, 0]} target={target} angle={0.55} penumbra={0.6} intensity={day ? 12 : 60} distance={22} color="#fff1d6" castShadow />
    </group>
  )
}

function Truck({ day }) {
  const m = useMaterials()
  const decal = useDecal()
  const body = useRef()
  useFrame(({ clock }) => {
    if (reducedMotion) return
    const t = clock.elapsedTime
    body.current.position.y = Math.sin(t * 13) * 0.01 + Math.sin(t * 2.3) * 0.008
    body.current.rotation.x = Math.sin(t * 1.7) * 0.003
  })

  return (
    <group>
      <group ref={body}>
        {/* chassis */}
        <mesh position={[0, 0.7, 0]} material={m.dark} castShadow><boxGeometry args={[6.7, 0.26, 1.6]} /></mesh>
        {/* cab-over cab */}
        <RoundedBox args={[1.65, 1.6, 2.08]} radius={0.18} smoothness={6} position={[2.45, 1.62, 0]} material={m.paint} castShadow />
        <RoundedBox args={[0.08, 0.66, 1.86]} radius={0.04} position={[3.27, 1.96, 0]} material={m.glass} />
        {[1.045, -1.045].map((z) => (
          <RoundedBox key={z} args={[0.95, 0.52, 0.04]} radius={0.02} position={[2.6, 1.98, z]} material={m.glass} />
        ))}
        {/* grille, bumper, mirrors */}
        <mesh position={[3.28, 1.24, 0]} material={m.dark}><boxGeometry args={[0.04, 0.34, 1.1]} /></mesh>
        {[-0.12, 0, 0.12].map((y) => (
          <mesh key={y} position={[3.31, 1.24 + y, 0]} material={m.chrome}><boxGeometry args={[0.02, 0.025, 1.06]} /></mesh>
        ))}
        <mesh position={[3.32, 0.78, 0]} material={m.chrome} castShadow><boxGeometry args={[0.16, 0.22, 2.12]} /></mesh>
        {[1.18, -1.18].map((z) => (
          <group key={z} position={[3.05, 1.9, z]}>
            <mesh material={m.dark}><boxGeometry args={[0.05, 0.05, 0.2]} /></mesh>
            <mesh position={[0, -0.05, z > 0 ? 0.12 : -0.12]} material={m.dark}><boxGeometry args={[0.08, 0.32, 0.06]} /></mesh>
          </group>
        ))}
        <Headlights m={m} day={day} />
        <Beacon m={m} />

        {/* flatbed */}
        <mesh position={[-0.85, 1.04, 0]} material={m.steel} castShadow receiveShadow><boxGeometry args={[4.7, 0.16, 2.16]} /></mesh>
        {[1.09, -1.09].map((z) => (
          <mesh key={z} position={[-0.85, 1.04, z]} material={m.amber}><boxGeometry args={[4.7, 0.17, 0.02]} /></mesh>
        ))}
        {/* side skirt with branding */}
        {[1.0, -1.0].map((z) => (
          <group key={z} position={[-0.85, 0.8, z]}>
            <mesh material={m.dark}><boxGeometry args={[4.4, 0.3, 0.04]} /></mesh>
            <mesh position={[0, 0, z > 0 ? 0.025 : -0.025]} rotation-y={z > 0 ? 0 : Math.PI}>
              <planeGeometry args={[4.36, 0.28]} />
              <meshStandardMaterial map={decal} roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* headboard + winch */}
        <mesh position={[1.45, 1.42, 0]} material={m.dark} castShadow><boxGeometry args={[0.12, 0.64, 2.02]} /></mesh>
        <mesh position={[1.31, 1.28, 0]} rotation-x={Math.PI / 2} material={m.chrome}><cylinderGeometry args={[0.12, 0.12, 0.7, 20]} /></mesh>
        {/* tail lights */}
        {[0.82, -0.82].map((z) => (
          <mesh key={z} position={[-3.22, 0.96, z]} material={m.tail}><boxGeometry args={[0.04, 0.12, 0.34]} /></mesh>
        ))}

        {/* the rescued car */}
        <group position={[-0.95, 1.12, 0]}>
          <RoundedBox args={[3.2, 0.52, 1.72]} radius={0.22} smoothness={6} position={[0, 0.48, 0]} material={m.carPaint} castShadow />
          <RoundedBox args={[1.85, 0.5, 1.52]} radius={0.22} smoothness={6} position={[-0.2, 0.93, 0]} material={m.glass} castShadow />
          <RoundedBox args={[1.4, 0.08, 1.5]} radius={0.04} position={[-0.25, 1.17, 0]} material={m.carPaint} />
          {[0.56, -0.56].map((z) => (
            <mesh key={z} position={[1.6, 0.53, z]} material={m.head}><boxGeometry args={[0.02, 0.08, 0.34]} /></mesh>
          ))}
          {[1.02, -1.02].map((x) => [0.86, -0.86].map((z) => (
            <Wheel key={`${x}${z}`} position={[x, 0.3, z]} r={0.3} w={0.24} m={m} spin={false} />
          )))}
          {[1.02, -1.02].map((x) => (
            <mesh key={x} position={[x, 0.36, 0]} material={m.amber}><boxGeometry args={[0.06, 0.02, 1.98]} /></mesh>
          ))}
        </group>
      </group>

      {[2.35, -1.2, -2.28].map((x) => [0.9, -0.9].map((z) => (
        <Wheel key={`${x}${z}`} position={[x, 0.46, z]} m={m} />
      )))}
    </group>
  )
}

/* ---------- world ---------- */
const LOOP = 120

function Scroller({ count, spacing, children }) {
  const group = useRef()
  useFrame((_, dt) => {
    group.current.children.forEach((c) => {
      c.position.x -= SPEED * dt
      if (c.position.x < -LOOP / 2) c.position.x += count * spacing
    })
  })
  return <group ref={group}>{Array.from({ length: count }, (_, i) => children(i, -LOOP / 2 + i * spacing))}</group>
}

function Streetlights({ day }) {
  const glow = useGlow()
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffcf8a', emissiveIntensity: day ? 0.2 : 7, toneMapped: false }), [day])
  const pole = useMemo(() => new THREE.MeshStandardMaterial({ color: day ? '#7d838c' : '#1a1e24', metalness: 0.8, roughness: 0.4 }), [day])
  const pool = useMemo(() => new THREE.MeshBasicMaterial({ map: glow, transparent: true, opacity: day ? 0 : 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), [glow, day])
  return (
    <Scroller count={10} spacing={12}>
      {(i, x) => (
        <group key={i} position={[x, 0, -4.6]}>
          <mesh position={[0, 3.2, 0]} material={pole}><cylinderGeometry args={[0.06, 0.09, 6.4, 10]} /></mesh>
          <mesh position={[0, 6.35, 0.8]} material={pole}><boxGeometry args={[0.08, 0.08, 1.7]} /></mesh>
          <mesh position={[0, 6.28, 1.55]} material={lamp}><boxGeometry args={[0.5, 0.06, 0.24]} /></mesh>
          <mesh position={[0, 0.02, 2.2]} rotation-x={-Math.PI / 2} material={pool}><planeGeometry args={[7, 7]} /></mesh>
        </group>
      )}
    </Scroller>
  )
}

function Barrier({ day }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: day ? '#a9afb7' : '#3a3f47', metalness: 0.9, roughness: 0.3 }), [day])
  const refl = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffb400', emissive: '#ff9a00', emissiveIntensity: day ? 0.5 : 2.5, toneMapped: false }), [day])
  return (
    <>
      <mesh position={[0, 0.55, -4.1]} material={mat}><boxGeometry args={[LOOP * 2, 0.22, 0.05]} /></mesh>
      <Scroller count={40} spacing={3}>
        {(i, x) => (
          <group key={i} position={[x, 0, -4.1]}>
            <mesh position={[0, 0.3, 0]} material={mat}><boxGeometry args={[0.08, 0.6, 0.08]} /></mesh>
            <mesh position={[0, 0.55, 0.04]} material={refl}><boxGeometry args={[0.1, 0.05, 0.01]} /></mesh>
          </group>
        )}
      </Scroller>
    </>
  )
}

function Road({ hq, day }) {
  const asphalt = day ? '#4a4d52' : '#0b0e12'
  const line = useMemo(() => new THREE.MeshBasicMaterial({ color: '#d9d4c7' }), [])
  const edge = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb400' }), [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[LOOP * 2, 40]} />
        {hq ? (
          <MeshReflectorMaterial
            blur={[400, 120]} resolution={1024} mixBlur={1} mixStrength={day ? 3 : 14} mirror={day ? 0.25 : 0.55}
            roughness={0.9} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.3}
            color={asphalt} metalness={day ? 0.2 : 0.6}
          />
        ) : (
          <meshStandardMaterial color={asphalt} roughness={0.6} metalness={day ? 0.1 : 0.5} />
        )}
      </mesh>
      {[3.4, -3.4].map((z) => (
        <mesh key={z} position={[0, 0.012, z]} rotation-x={-Math.PI / 2} material={edge}><planeGeometry args={[LOOP * 2, 0.1]} /></mesh>
      ))}
      <Scroller count={30} spacing={4}>
        {(i, x) => (
          <mesh key={i} position={[x, 0.012, 1.7]} rotation-x={-Math.PI / 2} material={line}><planeGeometry args={[1.8, 0.12]} /></mesh>
        )}
      </Scroller>
      <Scroller count={30} spacing={4}>
        {(i, x) => (
          <mesh key={i} position={[x + 2, 0.012, -1.7]} rotation-x={-Math.PI / 2} material={line}><planeGeometry args={[1.8, 0.12]} /></mesh>
        )}
      </Scroller>
    </group>
  )
}

/* ---------- camera ---------- */
function Rig() {
  const { camera, size } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const start = useRef(null)

  useFrame((state, dt) => {
    if (start.current === null) start.current = state.clock.elapsedTime
    const intro = reducedMotion ? 1 : Math.min(1, (state.clock.elapsedTime - start.current) / 2.6)
    const ie = 1 - Math.pow(1 - intro, 4)
    const p = heroState.progress
    const pe = p * p * (3 - 2 * p)
    const aspect = size.width / size.height
    const portrait = aspect < 1
    // Wide, short screens (16:9 laptops) get a slightly further camera and the truck pushed right.
    const wide = Math.min(Math.max((aspect - 1.45) / 0.45, 0), 1)
    const d = portrait ? 1.8 : 1.28 + wide * 0.32

    // Shot A: low 3/4 front. Shot B: side tracking shot, closer.
    const ax = 7.4 * d, ay = 1.7 + (portrait ? 1.4 : 0), az = 8.4 * d
    const bx = -2.2 * d, by = 1.25 + (portrait ? 1 : 0), bz = 7.2 * d
    let x = lerp(ax, bx, pe)
    let y = lerp(ay, by, pe)
    let z = lerp(az, bz, pe)
    // Fly-in on load
    x = lerp(x + 10, x, ie); y = lerp(y + 5, y, ie); z = lerp(z + 12, z, ie)
    // Mouse parallax
    x += heroState.mouseX * 0.5
    y += -heroState.mouseY * 0.25

    target.set(x, y, z)
    camera.position.lerp(target, 1 - Math.exp(-dt * 5))
    // Frame the truck to the right of the headline on desktop, above it on phones.
    const la = portrait ? [0.3, -1.7, 0] : [-2.7 - wide * 1.2, 0.9 + wide * 0.2, 2.1]
    const lb = portrait ? [0, -1.1, 0] : [-0.9, 1.0, -0.3]
    look.set(lerp(la[0], lb[0], pe), lerp(la[1], lb[1], pe), lerp(la[2], lb[2], pe))
    camera.lookAt(look)
  })
  return null
}

export default function HeroScene({ active = true, day = false }) {
  const hq = typeof window !== 'undefined' && window.innerWidth > 900
  const bg = day ? BG.day : BG.night
  return (
    <Canvas
      shadows
      dpr={[1, hq ? 1.75 : 1.25]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [18, 7, 20], fov: 30, near: 0.1, far: 120 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, day ? 20 : 16, day ? 64 : 52]} />
      {day ? (
        <>
          {/* Soft late-afternoon sun */}
          <ambientLight intensity={0.75} />
          <hemisphereLight args={['#ffffff', '#c9bfab', 1.1]} />
          <directionalLight position={[-8, 14, 8]} intensity={2.6} color="#fff1dc" castShadow
            shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
          <directionalLight position={[8, 4, -6]} intensity={0.8} color="#ffd9a6" />
        </>
      ) : (
        <>
          <ambientLight intensity={0.22} />
          <hemisphereLight args={['#8fa6c9', '#06080b', 0.35]} />
          <directionalLight position={[-8, 12, 6]} intensity={0.9} color="#b7c8ff" castShadow
            shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
          <directionalLight position={[8, 3, -6]} intensity={0.6} color="#ffb766" />
        </>
      )}

      <Environment key={day ? 'day' : 'night'} resolution={256} frames={1}>
        <Lightformer intensity={day ? 3.2 : 2.2} rotation-x={Math.PI / 2} position={[0, 8, 0]} scale={[14, 6, 1]} />
        <Lightformer intensity={day ? 2.4 : 4} color="#ffc27a" rotation-y={Math.PI / 2} position={[-10, 2, 0]} scale={[20, 1.2, 1]} />
        <Lightformer intensity={day ? 1.6 : 2} color={day ? '#dfe8ff' : '#7fa4ff'} rotation-y={-Math.PI / 2} position={[10, 3, 2]} scale={[20, 1, 1]} />
        <Lightformer intensity={day ? 2 : 1.2} position={[0, 2, 10]} scale={[16, 2, 1]} />
      </Environment>

      <Truck day={day} />
      <Road hq={hq} day={day} />
      <Streetlights day={day} />
      <Barrier day={day} />
      <Rig />

      <EffectComposer multisampling={hq ? 4 : 0} disableNormalPass>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={day ? 0.5 : 1.15} radius={0.75} />
        <Vignette offset={0.25} darkness={day ? 0.22 : 0.75} />
      </EffectComposer>
    </Canvas>
  )
}
