import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { getPersonalized } from '../utils/api'
import MovieCard from '../components/MovieCard'

/**
 * FavoritesPage — Saved movies + personalized AI recommendations
 *
 * Sections:
 *   1. Saved movies grid with individual remove buttons
 *   2. "You Might Also Like" — personalized recs based on favorites
 */
export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites()
  const [recs, setRecs]               = useState([])
  const [recsLoading, setRecsLoading] = useState(false)

  // Fetch personalized recs whenever favorites change
  useEffect(() => {
    if (favorites.length === 0) {
      setRecs([])
      return
    }
    setRecsLoading(true)
    const titles = favorites.slice(0, 5).map((f) => f.title)
    getPersonalized(titles, 12)
      .then(({ data }) => setRecs(data.recommendations || []))
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false))
  }, [favorites])

  // ── Empty state ────────────────────────────────────────
  if (favorites.length === 0) {
    return (
      <div className="page flex-center" id="favorites-page-empty" style={{ flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <span style={{ fontSize: '4rem' }}>🎬</span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>No favorites yet</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>
          Browse movies and tap the 💙 heart on any card to save it here.
          We'll use your picks to find perfect recommendations.
        </p>
        <Link to="/" className="btn btn-primary" id="browse-movies-cta">
          🍿 Browse Movies
        </Link>
      </div>
    )
  }

  return (
    <div className="page" id="favorites-page">

      {/* ── Saved Favorites ────────────────────────────────── */}
      <section className="section container">
        <div className="favorites-header">
          <h1 className="section-title">
            ❤️ Your Favorites
            <span className="favorites-count">{favorites.length}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 24 }}>
            Your saved movies — AI picks recommendations based on these
          </p>
        </div>

        <div className="movie-grid" id="favorites-grid">
          {favorites.map((movie) => (
            <div key={movie.movie_id} style={{ position: 'relative' }}>
              <MovieCard movie={movie} />
              {/* Explicit remove button underneath */}
              <button
                className="fav-remove-btn"
                onClick={() => removeFavorite(movie.movie_id)}
                id={`remove-fav-${movie.movie_id}`}
                aria-label={`Remove ${movie.title} from favorites`}
              >
                ✕ Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Personalized Recommendations ────────────────────── */}
      <section className="section container" id="personalized-recs-section">
        <h2 className="section-title">
          🤖 You Might Also Like
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 24 }}>
          Based on your {favorites.length} favorite{favorites.length > 1 ? 's' : ''}
        </p>

        {recsLoading ? (
          <div className="movie-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="movie-card skeleton" />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✨</span>
            <h3>No personalized recs yet</h3>
            <p>The AI needs your favorites to generate suggestions</p>
          </div>
        ) : (
          <div className="movie-grid">
            {recs.map((rec) => (
              <MovieCard key={rec.movie_id} movie={rec} showSimilarity />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
