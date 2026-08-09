import { Link } from 'react-router-dom'

/**
 * NotFoundPage — 404 catch-all route
 * Shown when the user navigates to a non-existent URL.
 */
export default function NotFoundPage() {
  return (
    <div className="page not-found-page flex-center" id="not-found-page">
      <div className="not-found-content">
        {/* Animated film reel */}
        <div className="not-found-icon" aria-hidden="true">🎬</div>

        {/* 404 number */}
        <div className="not-found-code">404</div>

        <h1 className="not-found-title">Scene Not Found</h1>
        <p className="not-found-subtitle">
          Looks like this page got left on the cutting room floor.
          <br />
          Let's get you back to something worth watching.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary" id="not-found-home-btn">
            🏠 Back to Home
          </Link>
          <Link to="/favorites" className="btn btn-outline" id="not-found-fav-btn">
            ❤️ My Favorites
          </Link>
        </div>
      </div>
    </div>
  )
}
