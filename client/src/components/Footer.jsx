import { Link } from 'react-router-dom'

/**
 * Footer — Site-wide footer
 * Displayed at the bottom of every page.
 */
export default function Footer() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="container footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo" id="footer-logo">
            <span>🎬</span>
            <span className="footer-logo-text">
              Cine<span className="logo-accent">AI</span>
            </span>
          </Link>
          <p className="footer-tagline">
            Find something worth watching.
          </p>
        </div>

        {/* Links */}
        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/" className="footer-link" id="footer-home-link">Home</Link>
          <Link to="/favorites" className="footer-link" id="footer-favorites-link">Favorites</Link>
        </nav>

      </div>
    </footer>
  )
}
