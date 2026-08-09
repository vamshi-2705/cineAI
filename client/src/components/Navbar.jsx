import { Link, useLocation } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import SearchBar from './SearchBar'

/**
 * Navbar — Sticky top navigation bar
 * - Logo on left
 * - Search bar in center
 * - Favorites link with count badge on right
 */
export default function Navbar() {
  const { favorites }  = useFavorites()
  const { pathname }   = useLocation()

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container navbar-inner">

        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo" id="navbar-logo">
          <span className="navbar-logo-icon">🎬</span>
          <span className="navbar-logo-text">Cine<span className="logo-accent">AI</span></span>
        </Link>

        {/* ── Search ── */}
        <div className="navbar-search">
          <SearchBar />
        </div>

        {/* ── Favorites link ── */}
        <Link
          to="/favorites"
          className={`navbar-fav-link${pathname === '/favorites' ? ' active' : ''}`}
          id="navbar-favorites-link"
        >
          <span className="navbar-fav-icon">❤️</span>
          <span className="navbar-fav-label">Favorites</span>
          {favorites.length > 0 && (
            <span className="navbar-fav-badge">{favorites.length}</span>
          )}
        </Link>

      </div>
    </nav>
  )
}
