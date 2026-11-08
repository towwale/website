import Icon from './Icon.jsx'

const promises = [
  { icon: 'phone', title: 'A person answers', text: 'Day or night, in Hindi, English or your language. No IVR menus.' },
  { icon: 'rupee', title: 'Price before we move', text: 'You hear the full fare on the call. That is what you pay.' },
  { icon: 'shield', title: 'Insured transport', text: 'Your vehicle is covered for the whole time it is on our truck.' },
  { icon: 'check', title: 'Handled with care', text: 'Trained crews, soft straps and flatbeds for EVs and luxury cars.' },
]

export default function Promises() {
  return (
    <section className="promises" aria-label="Our promises">
      <div className="wrap promises__grid">
        {promises.map((p, i) => (
          <div key={p.title} className="promises__item" data-reveal>
            <span className="promises__num">0{i + 1}</span>
            <span className="promises__icon"><Icon name={p.icon} size={22} /></span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
