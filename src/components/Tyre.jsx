// The wheel used for the pointer and for the loose tyres in the footer.
export default function Tyre({ className, innerRef }) {
  return (
    <svg ref={innerRef} className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="31" fill="#0d0e0f" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="#3a3d41" strokeWidth="5" strokeDasharray="3.6 3.6" />
      <circle cx="32" cy="32" r="23" fill="#17191b" />
      <circle cx="32" cy="32" r="17.5" fill="#ffc20e" />
      <g stroke="#0d0e0f" strokeWidth="4.2" strokeLinecap="round">
        <path d="M32 32V17" />
        <path d="M32 32L46.3 27.4" />
        <path d="M32 32L40.8 44.1" />
        <path d="M32 32L23.2 44.1" />
        <path d="M32 32L17.7 27.4" />
      </g>
      <circle cx="32" cy="32" r="5.5" fill="#0d0e0f" />
      <circle cx="32" cy="32" r="1.8" fill="#ffc20e" />
    </svg>
  )
}
