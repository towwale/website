import { cloneElement } from 'react'

// Line-art scenes for the service cards. Lines use currentColor; amber parts use CSS classes.

function Wheel({ x, y, r }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ill-spin">
        <circle r={r} />
        <circle r={r * 0.42} />
        <path d={`M0 ${-r * 0.42}V${-r * 0.85}M0 ${r * 0.42}V${r * 0.85}M${-r * 0.42} 0H${-r * 0.85}M${r * 0.42} 0H${r * 0.85}`} />
      </g>
    </g>
  )
}

// A side-on car, 192 wide, wheels sitting at y≈150.
function Car({ transform }) {
  return (
    <g transform={transform}>
      <path className="ill-paint" d="M30 148V130q0-8 10-10l30-4 26-22q6-6 16-6h48q10 0 18 8l22 20 14 4q8 2 8 12v16z" />
      <path className="ill-glass" d="M104 98h36v16H86zM146 98h14q6 0 10 6l8 10h-32z" />
      <path d="M150 128h10" />
      <rect className="ill-light" x="212" y="124" width="8" height="5" rx="1.5" />
      <Wheel x={64} y={150} r={15} />
      <Wheel x={186} y={150} r={15} />
    </g>
  )
}

function Cab({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 54V8q0-8 8-8h42l30 32v22z" />
      <path className="ill-glass" d="M12 10h34l22 22H12z" />
      <rect className="ill-amber ill-blink" x="20" y="-9" width="18" height="7" rx="2" />
      <rect className="ill-light" x="74" y="40" width="7" height="6" rx="1.5" />
    </g>
  )
}

const scenes = {
  // Wheel-lift tow truck pulling a car.
  car: (
    <svg viewBox="0 0 430 190">
      <path className="ill-ground" d="M0 176H430" />
      <path className="ill-motion" d="M4 118h22M0 132h16M10 146h20" />
      <g className="ill-drive">
        <Car transform="rotate(-7 64 165) translate(14 0)" />
        <path className="ill-amber-line" d="M226 142h-22l-6-6" strokeWidth="5" />
        <rect x="222" y="132" width="196" height="20" rx="4" />
        <rect className="ill-amber" x="232" y="100" width="88" height="32" rx="3" />
        <path className="ill-amber-line" d="M244 100l-18-26" strokeWidth="4" />
        <Cab x={330} y={78} />
        <Wheel x={262} y={160} r={16} />
        <Wheel x={382} y={160} r={16} />
      </g>
    </svg>
  ),
  // Flatbed carrying a car.
  flatbed: (
    <svg viewBox="0 0 440 136">
      <path className="ill-ground" d="M0 124H440" />
      <path className="ill-motion" d="M4 74h20M0 88h14" />
      <g className="ill-drive">
        <Car transform="translate(66 -60) scale(.9)" />
        <rect className="ill-amber" x="52" y="78" width="288" height="12" rx="3" />
        <path d="M60 90v12h366" />
        <path className="ill-amber-line" d="M120 78l4-12M250 78l-4-12" strokeDasharray="3 4" />
        <Cab x={346} y={48} s={0.95} />
        <Wheel x={106} y={110} r={13} />
        <Wheel x={144} y={110} r={13} />
        <Wheel x={394} y={110} r={13} />
      </g>
    </svg>
  ),
  // Motorbike strapped on a carrier deck.
  bike: (
    <svg viewBox="0 0 220 112">
      <path className="ill-ground" d="M0 108H220" />
      <rect className="ill-amber" x="20" y="96" width="180" height="6" rx="2" />
      <g className="ill-drive">
        <Wheel x={62} y={78} r={18} />
        <Wheel x={156} y={78} r={18} />
        <path d="M62 78l32-28h30l32 28M94 50l14 28h20M124 50l12-14h12" />
        <path className="ill-amber" d="M102 46q12-10 26 0z" />
        <path className="ill-paint" d="M78 44h26v6H78z" />
      </g>
      <path className="ill-amber-line" d="M40 96l18-34M182 96l-22-30" strokeDasharray="3 4" />
    </svg>
  ),
  // Crane hook lifting a car out of trouble.
  crash: (
    <svg viewBox="0 0 220 112">
      <path className="ill-ground" d="M0 108H220" />
      <path className="ill-amber-line" d="M140 0v26" strokeWidth="3" />
      <path d="M140 26v8a6 6 0 1 1-6 6" />
      <path className="ill-amber-line" d="M138 44l-14 20M142 44l26 24" strokeDasharray="3 3" />
      <g className="ill-lift">
        <Car transform="translate(68 10) scale(.55) rotate(9 126 120)" />
      </g>
      <path className="ill-amber-line" d="M18 104l16-28 16 28z" />
      <path d="M34 86v8M34 99v.5" />
    </svg>
  ),
  // Battery with jump leads.
  battery: (
    <svg viewBox="0 0 220 112">
      <path className="ill-ground" d="M0 108H220" />
      <path d="M90 34C80 6 38 8 30 44M130 34c10-28 52-26 60 10" />
      <rect className="ill-amber" x="24" y="44" width="12" height="10" rx="2" />
      <rect x="184" y="44" width="12" height="10" rx="2" />
      <rect x="68" y="40" width="84" height="64" rx="7" />
      <rect x="82" y="32" width="14" height="8" rx="2" />
      <rect x="124" y="32" width="14" height="8" rx="2" />
      <path className="ill-amber ill-pulse" d="M114 50l-16 22h12l-6 20 20-26h-12l8-16z" />
    </svg>
  ),
  // Tyre with a nail and a jack.
  tyre: (
    <svg viewBox="0 0 220 112">
      <path className="ill-ground" d="M0 108H220" />
      <g transform="translate(86 62)">
        <g className="ill-spin">
          <circle r="42" />
          <circle r="30" strokeDasharray="5 6" />
          <circle r="14" />
          <circle r="3" />
        </g>
      </g>
      <path className="ill-amber-line" d="M118 30l10-10" strokeWidth="3" />
      <circle className="ill-amber" cx="130" cy="18" r="4" />
      <path className="ill-hiss" d="M138 34q8 2 10 10M144 26q12 4 14 16" />
      <path d="M160 108l10-30h24l10 30M170 78v-8h24v8" />
      <path className="ill-amber-line" d="M182 70V56" strokeWidth="4" />
    </svg>
  ),
  // Jerrycan with a falling drop and a fuel gauge.
  fuel: (
    <svg viewBox="0 0 220 112">
      <path className="ill-ground" d="M0 108H220" />
      <path d="M52 36h50l12 12v58H52z" />
      <path d="M64 36v-10h20v10" />
      <path className="ill-amber" d="M60 60h46v38H60z" opacity=".9" />
      <path d="M114 48l18-14 8 8-10 8" />
      <path className="ill-amber ill-drip" d="M138 54q7 9 0 14q-7-5 0-14z" />
      <path d="M160 104a26 26 0 0 1 52 0" />
      <path d="M164 92l4 2M186 78v4M208 92l-4 2" />
      <path className="ill-amber-line ill-needle" d="M186 104l-14-18" strokeWidth="3" />
    </svg>
  ),
  // Car door with a key going in and an unlock arc.
  key: (
    <svg viewBox="0 0 220 112">
      <path className="ill-ground" d="M0 108H220" />
      <path className="ill-paint" d="M30 104V42q0-10 10-10h72l36 34v38z" />
      <path className="ill-glass" d="M42 42h66l26 24H42z" />
      <rect x="108" y="78" width="22" height="6" rx="3" />
      <g className="ill-turn">
        <circle className="ill-amber" cx="176" cy="74" r="12" />
        <circle cx="176" cy="74" r="4" />
        <path className="ill-amber-line" d="M164 78h-24M150 78v6M144 78v4" strokeWidth="4" />
      </g>
      <path className="ill-hiss" d="M190 50a26 26 0 0 1 10 22" />
    </svg>
  ),
}

const lineProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export default function ServiceArt({ name }) {
  const scene = scenes[name]
  if (!scene) return null
  return <div className="bento__art" aria-hidden="true">{cloneElement(scene, lineProps)}</div>
}
