// Headline split into rows that slide up from behind a mask when revealed.
export default function Lines({ as: Tag = 'h2', rows, className = '', id, immediate = false }) {
  return (
    <Tag className={`lines ${className}`} id={id} data-reveal={immediate ? undefined : ''}>
      {rows.map((row, i) => (
        <span className="lines__row" key={i}>
          <span className="lines__inner" style={{ '--i': i }}>{row}</span>{' '}
        </span>
      ))}
    </Tag>
  )
}
