import { useState, useEffect, useRef } from 'react'

const HERO_VIDEO = '/videos/hero-nature.mp4'

const phrases = [
  'Mountains open before you',
  'Forests reveal their secrets',
  'Valleys stretch into the horizon',
  'Rivers carve paths to wonder',
]

function HeroSection() {
  const videoRef = useRef(null)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    const playVideo = () => {
      video.play().catch(() => {})
    }

    playVideo()
    video.addEventListener('loadeddata', playVideo)

    return () => video.removeEventListener('loadeddata', playVideo)
  }, [])

  useEffect(() => {
    const current = phrases[phraseIndex]
    let timeout

    if (!isDeleting && displayText.length < current.length) {
      timeout = setTimeout(() => {
        setDisplayText(current.slice(0, displayText.length + 1))
      }, 70)
    } else if (!isDeleting && displayText.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2200)
    } else if (isDeleting && displayText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayText(current.slice(0, displayText.length - 1))
      }, 35)
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false)
      setPhraseIndex((prev) => (prev + 1) % phrases.length)
    }

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, phraseIndex])

  return (
    <section className="hero-section">
      <video
        ref={videoRef}
        className="hero-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="hero-tagline">Explore the outdoors</p>
        <h1 className="hero-title">Where Nature Opens Up</h1>
        <p className="hero-subtitle">
          {displayText}
          <span className="typing-cursor">|</span>
        </p>
        <a href="#" className="hero-cta">
          Start Exploring
        </a>
      </div>
    </section>
  )
}

export default HeroSection
