import { Search, CalendarDays, Phone } from 'lucide-react'
import Logo from './Logo'

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Logo />

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search destinations, trips, experiences..."
            className="search-input"
          />
          <button type="button" className="search-btn" aria-label="Search">
            <Search size={18} className="search-icon" />
          </button>
        </div>

        <nav className="header-nav">
          <a href="#" className="nav-link">Featured Trips</a>
          <a href="#" className="nav-link">
            <CalendarDays size={15} className="nav-icon" />
            Plan a Journey
          </a>
          <a href="#" className="nav-link">Work Retreats</a>
          <a href="#" className="nav-link">Stories</a>
          <a href="#" className="nav-link">Our Story</a>
        </nav>

        <a href="tel:+918130288566" className="contact-btn">
          <Phone size={15} />
          +91-8130288566
        </a>
      </div>
    </header>
  )
}

export default Header
