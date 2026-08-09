import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMovieDetail, getRecommendations } from '../utils/api'
import { useFavorites } from '../context/FavoritesContext'
import MovieCard from '../components/MovieCard'

/**
 * MoviePage — Full detail view for a single movie
 *
 * Sections:
 *   1. Backdrop hero with gradient overlay
 *   2. Movie info (poster, title, year, runtime, rating, genres, tagline, overview)
 *   3. Cast row (top 6 members)
 *   4. AI Recommendations grid (genre-filterable)
 */
export default function MoviePage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  // Track whether we navigated here from within the app
  const canGoBack = useRef(window.history.state?.idx > 0)

  const [movie, setMovie]       = useState(null)
  const [recs, setRecs]         = useState([])
  const [genre, setGenre]       = useState(null)   // active genre filter for recs
  const [loading, setLoading]   = useState(true)
  const [recsLoading, setRecsLoading] = useState(true)
  const [error, setError]       = useState(null)

  const movieId = parseInt(id)
  const fav     = movie ? isFavorite(movieId) : false

  // ── Fetch movie detail ─────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setError(null)
    window.scrollTo(0, 0)

    getMovieDetail(movieId)
      .then(({ data }) => setMovie(data))
      .catch(() => setError('Movie not found or backend is offline.'))
      .finally(() => setLoading(false))
  }, [movieId])

  // ── Fetch recommendations (re-fetches when genre filter changes) ──
  useEffect(() => {
    setRecsLoading(true)
    getRecommendations(movieId, genre, 12)
      .then(({ data }) => setRecs(data.recommendations || []))
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false))
  }, [movieId, genre])

  // ── Unique genres from recommendations ─────────────────
  const allRecGenres = [...new Set(
    recs.flatMap((r) => (Array.isArray(r.genres) ? r.genres : []))
  )].slice(0, 8)

  // ── Helpers ────────────────────────────────────────────
  const formatRuntime = (min) => {
    if (!min) return null
    const h = Math.floor(min / 60)
    const m = min % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatCurrency = (n) => {
    if (!n || n === 0) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
    }).format(n)
  }

  const handleFav = () => {
    if (!movie) return
    if (fav) {
      removeFavorite(movieId)
    } else {
      addFavorite({
        movie_id    : movieId,
        title       : movie.title,
        poster      : movie.poster,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        genres      : movie.genres,
      })
    }
  }

  // ── Loading skeleton ───────────────────────────────────
  if (loading) {
    return (
      <div className="page" id="movie-page">
        <div className="skeleton" style={{ width: '100%', height: 420 }} />
        <div className="container" style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <div className="skeleton" style={{ width: 200, height: 300, flexShrink: 0, borderRadius: 12 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="skeleton" style={{ height: 36, width: '60%' }} />
              <div className="skeleton" style={{ height: 20, width: '40%' }} />
              <div className="skeleton" style={{ height: 100 }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────
  if (error || !movie) {
    return (
      <div className="page flex-center" id="movie-page-error" style={{ flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: '4rem' }}>🎬</span>
        <h2>{error || 'Movie not found'}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    )
  }

  const year = movie.release_date?.slice(0, 4)

  return (
    <div className="page" id="movie-page">

      {/* ── Back Navigation ────────────────────────────────── */}
      <div className="movie-back-bar container" id="movie-back-bar" style={{ position: 'relative', zIndex: 2 }}>
        <button
          className="btn-back"
          onClick={() => canGoBack.current ? navigate(-1) : navigate('/')}
          id="movie-back-btn"
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>

      {/* ── Backdrop Hero ──────────────────────────────────── */}
      <div className="movie-hero" id="movie-backdrop">
        {movie.backdrop && (
          <img
            src={movie.backdrop}
            alt=""
            className="movie-hero-backdrop"
            aria-hidden="true"
          />
        )}
        <div className="movie-hero-gradient" aria-hidden="true" />
      </div>

      {/* ── Movie Info ─────────────────────────────────────── */}
      <div className="container movie-detail-layout">

        {/* Poster */}
        <div className="movie-detail-poster-wrap">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={`${movie.title} poster`}
              className="movie-detail-poster"
            />
          ) : (
            <div className="movie-detail-poster movie-card-no-poster">
              <span className="film-icon" style={{ fontSize: '3rem' }}>🎬</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="movie-detail-info">
          <h1 className="movie-detail-title">{movie.title}</h1>

          {/* Meta row */}
          <div className="movie-detail-meta">
            {year && <span className="meta-pill">{year}</span>}
            {formatRuntime(movie.runtime) && (
              <span className="meta-pill">⏱ {formatRuntime(movie.runtime)}</span>
            )}
            {movie.vote_average > 0 && (
              <span className="meta-pill rating-pill">
                ⭐ {Number(movie.vote_average).toFixed(1)}
                <span style={{ opacity: 0.6, fontSize: '11px' }}>/ 10</span>
              </span>
            )}
            {movie.status && (
              <span className={`meta-pill status-pill ${movie.status === 'Released' ? 'released' : ''}`}>
                {movie.status}
              </span>
            )}
          </div>

          {/* Genres */}
          {Array.isArray(movie.genres) && movie.genres.length > 0 && (
            <div className="movie-detail-genres">
              {movie.genres.map((g) => (
                <span key={g} className="badge badge-genre">{g}</span>
              ))}
            </div>
          )}

          {/* Tagline */}
          {movie.tagline && (
            <p className="movie-detail-tagline">"{movie.tagline}"</p>
          )}

          {/* Overview */}
          {movie.overview && (
            <div>
              <h3 className="movie-detail-section-label">Overview</h3>
              <p className="movie-detail-overview">{movie.overview}</p>
            </div>
          )}

          {/* Budget / Revenue */}
          {(formatCurrency(movie.budget) || formatCurrency(movie.revenue)) && (
            <div className="movie-financials">
              {formatCurrency(movie.budget) && (
                <div className="financial-item">
                  <span className="financial-label">Budget</span>
                  <span className="financial-value">{formatCurrency(movie.budget)}</span>
                </div>
              )}
              {formatCurrency(movie.revenue) && (
                <div className="financial-item">
                  <span className="financial-label">Revenue</span>
                  <span className="financial-value">{formatCurrency(movie.revenue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Favorite button */}
          <button
            className={`btn ${fav ? 'btn-fav-active' : 'btn-outline'} movie-detail-fav-btn`}
            onClick={handleFav}
            id="movie-detail-fav-btn"
          >
            {fav ? '❤️ Saved to Favorites' : '🤍 Add to Favorites'}
          </button>
        </div>
      </div>

      {/* ── Cast ──────────────────────────────────────────── */}
      {Array.isArray(movie.cast) && movie.cast.length > 0 && (
        <section className="section container" id="cast-section">
          <h2 className="section-title">🎭 Cast</h2>
          <div className="cast-row">
            {movie.cast.map((member) => (
              <div key={member.name} className="cast-card">
                {member.profile ? (
                  <img
                    src={member.profile}
                    alt={member.name}
                    className="cast-photo"
                  />
                ) : (
                  <div className="cast-photo cast-no-photo">👤</div>
                )}
                <p className="cast-name">{member.name}</p>
                <p className="cast-character">{member.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AI Recommendations ────────────────────────────── */}
      <section className="section container" id="recommendations-section">
        <h2 className="section-title">🤖 Movies You Might Like</h2>

        {/* Genre filter for recs */}
        {allRecGenres.length > 0 && (
          <div className="genre-filter" role="tablist" aria-label="Filter recommendations by genre">
            <button
              className={`genre-pill${genre === null ? ' active' : ''}`}
              onClick={() => setGenre(null)}
              role="tab"
            >
              All
            </button>
            {allRecGenres.map((g) => (
              <button
                key={g}
                className={`genre-pill${genre === g ? ' active' : ''}`}
                onClick={() => setGenre(g)}
                role="tab"
                id={`rec-genre-pill-${g.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {recsLoading ? (
          <div className="movie-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="movie-card skeleton" />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No recommendations found</h3>
            <p>Try removing the genre filter</p>
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
