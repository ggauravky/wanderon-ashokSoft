import { Compass, MapPin } from 'lucide-react'

function Logo() {
  return (
    <a href="/" className="logo-link">
      <div className="logo-icon-wrap">
        <Compass className="logo-compass" size={32} strokeWidth={2.2} />
        <MapPin className="logo-pin" size={14} strokeWidth={2.5} fill="currentColor" />
      </div>
      <span className="logo-text">
        Wander<span className="logo-accent">ly</span>
      </span>
    </a>
  )
}

export default Logo
