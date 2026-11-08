// Small inline icon set (stroke icons, inherit currentColor).
const paths = {
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  whatsapp: (
    <>
      <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z" />
    </>
  ),
  car: (
    <>
      <path d="M3 13l2-5a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1M5 18H4a1 1 0 0 1-1-1v-4h18" />
      <circle cx="7.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /><path d="M9.5 18h5" />
    </>
  ),
  flatbed: (
    <>
      <path d="M2 15h13V7H9L6 11H2zM15 11h4l3 4v2h-2M2 15v2h2" />
      <circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /><path d="M8.5 17.5h7" />
    </>
  ),
  bike: (
    <>
      <circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" />
      <path d="M5.5 16.5L9 9h5l4.5 7.5M12 9l-1.5-3H8M14 9h3" />
    </>
  ),
  crash: <path d="M12 3l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z" />,
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
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5" />,
  rupee: <path d="M6 4h12M6 9h12M6 4h3a5 5 0 0 1 0 10H6l8 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
}

export default function Icon({ name, size = 24, className = '', fill = 'none' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
