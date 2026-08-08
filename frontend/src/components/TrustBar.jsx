import { Star } from 'lucide-react'

const platforms = [
  {
    name: 'Google',
    rating: '4.8',
    reviews: '12,400',
    icon: (
      <svg className="platform-icon google-icon" viewBox="0 0 24 24" width="28" height="28">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    name: 'TripAdvisor',
    rating: '4.9',
    reviews: '3,870',
    icon: (
      <svg className="platform-icon tripadvisor-icon" viewBox="0 0 32 32" width="32" height="32">
        <circle cx="10" cy="18" r="6" fill="none" stroke="#00AF87" strokeWidth="2" />
        <circle cx="22" cy="18" r="6" fill="none" stroke="#00AF87" strokeWidth="2" />
        <circle cx="10" cy="18" r="2.5" fill="#00AF87" />
        <circle cx="22" cy="18" r="2.5" fill="#00AF87" />
        <path d="M16 8L18 12H14L16 8Z" fill="#00AF87" />
        <path d="M4 12H28" stroke="#00AF87" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    rating: '4.7',
    reviews: '980',
    icon: (
      <svg className="platform-icon facebook-icon" viewBox="0 0 24 24" width="28" height="28">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path
          d="M16.5 8.5H14.5C13.67 8.5 13 9.17 13 10V11.5H16L15.5 14.5H13V22H10V14.5H8V11.5H10V9.5C10 7.01 12.01 5 14.5 5H16.5V8.5Z"
          fill="white"
        />
      </svg>
    ),
  },
]

function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="trust-bar-inner">
        {platforms.map((platform) => (
          <div key={platform.name} className="trust-item">
            {platform.icon}
            <div className="trust-rating">
              <Star size={15} className="star-icon" fill="#F59E0B" stroke="#F59E0B" />
              <span className="rating-value">{platform.rating}</span>
            </div>
            <span className="review-count">({platform.reviews} reviews)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrustBar
