// The Towwala wordmark: "Tow" heavy, "wala" light in amber. Same typeface, two weights.
export default function Logo({ className = '' }) {
  return (
    <span className={`brand ${className}`}>
      <span className="brand__tow">Tow</span><span className="brand__wala">wala</span>
    </span>
  )
}
