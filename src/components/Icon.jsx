// Inline stroke icons on a 24px grid. They take the current text colour.
const paths = {
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  whatsapp: (
    <>
      <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  flatbed: (
    <>
      <path d="M2 14h12V8h4l3.5 4.5V17h-1.5M2 14v3h1.6M8.4 17h7.2" />
      <path d="M4 14v-2l1.6-2.4h4.2l1.6 2.4v2" />
      <circle cx="6" cy="17.2" r="2.2" /><circle cx="17.8" cy="17.2" r="2.2" />
    </>
  ),
  bike: (
    <>
      <circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" />
      <path d="M5.5 16.5l4-6.5H15l3.5 6.5M9.5 10l2.5 6.5M13.5 7H16l1 3" />
    </>
  ),
  crane: (
    <>
      <path d="M12 2.5V7" />
      <circle cx="12" cy="9" r="2" />
      <path d="M12 11v2.5a4 4 0 1 1-6.3-3.3" />
      <path d="M17 6l2.5-2.5M18 10.5h3.5" />
    </>
  ),
  car: (
    <>
      <path d="M3 13l2-5a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1M5 18H4a1 1 0 0 1-1-1v-4h18" />
      <circle cx="7.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /><path d="M9.5 18h5" />
    </>
  ),
  suv: (
    <>
      <path d="M2 16.5V11l2.2-.8L7 6h9.5l3 4.2 2.5.8v5.5h-1.6M4.4 16.5H3" />
      <path d="M6 10.2h13.2M12 6v4.2" />
      <circle cx="6.6" cy="16.8" r="2.2" /><circle cx="17.6" cy="16.8" r="2.2" /><path d="M8.8 16.8h6.6" />
    </>
  ),
  ev: (
    <>
      <path d="M2 16.5v-3l3-1.3 3.4-3.2h6.2l4 3.2 3.4 1.3v3h-1.6M4.2 16.5H3" />
      <circle cx="6.6" cy="16.8" r="2.2" /><circle cx="17.6" cy="16.8" r="2.2" /><path d="M8.8 16.8h6.6" />
      <path d="M12.6 2.5l-2.2 3h2.6l-1.8 3" />
    </>
  ),
  truck: (
    <>
      <path d="M2 16.5V6.5h11.5v10M13.5 9.5h4l3.5 3.2v3.8h-1.2M4.2 16.5H2" />
      <circle cx="6.6" cy="16.8" r="2.2" /><circle cx="17.2" cy="16.8" r="2.2" /><path d="M8.8 16.8h6.2" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M7 7V5h3v2M14 7V5h3v2M7 13h3M15.5 11.5v3M14 13h3" />
    </>
  ),
  tyre: (
    <>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10" />
      <path d="M14 8l3 2v7a1.5 1.5 0 0 0 3 0V9l-3-3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l3 3M14 9l2 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" />
    </>
  ),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  rupee: <path d="M6 4h12M6 9h12M6 4h3a5 5 0 0 1 0 10H6l8 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
}

export default function Icon({ name, size = 24, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}


