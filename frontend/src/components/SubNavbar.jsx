import { ChevronDown } from 'lucide-react'

const navItems = [
  { label: 'World Destinations', hasDropdown: true },
  { label: 'Domestic Travel', hasDropdown: true },
  { label: 'Adventure Groups', hasDropdown: true },
  { label: 'Seasonal Events', hasDropdown: false },
  { label: 'Short Breaks', hasDropdown: false },
]

function SubNavbar() {
  return (
    <nav className="sub-navbar">
      <div className="sub-navbar-inner">
        {navItems.map((item) => (
          <a key={item.label} href="#" className="sub-nav-link">
            {item.label}
            {item.hasDropdown && <ChevronDown size={14} strokeWidth={2.5} />}
          </a>
        ))}
      </div>
    </nav>
  )
}

export default SubNavbar
