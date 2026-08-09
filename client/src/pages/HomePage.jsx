import { useState, useEffect } from 'react'
import { getPopular } from '../utils/api'
import MovieCard from '../components/MovieCard'
import SearchBar from '../components/SearchBar'

const ALL_GENRES = [
  'All', 'Action', 'Adventure', 'Animation', 'Comedy',
  'Crime', 'Drama', 'Fantasy', 'Horror', 'Romance',
  'Science Fiction', 'Thriller',
]

/**
 * HomePage — Landing page
 *
 * Sections:
 *   1. Hero — animated gradient headline + large search bar
 *   2. Trending Now — horizontal scroll row of top popular movies
 *   3. Browse — genre filter pills + responsive movie grid
 */
export default function HomePage() {
  const [trending, setTrending]   = useState([])
  const [browse, setBrowse]       = useState([])
  const [genre, setGenre]         = useState('All')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // Load popular movies once
  useEffect(() => {
    setLoading(true)
    getPopular(20)   // fetch 20 — first 10 go to trending row, rest to browse grid
      .then(({ data }) => {
        const movies = data.movies || []
        setTrending(movies.slice(0, 10))  // first 10 for scroll row
        setBrowse(movies)                  // all 20 for browse grid
      })
      .catch(() => setError('Could not load movies. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  // Filter by genre
  const filtered = genre === 'All'
    ? browse
    : browse.filter((m) =>
        Array.isArray(m.genres) &&
        m.genres.some((g) => g.toLowerCase().includes(genre.toLowerCase()))
      )

  return (
    <div className="page" id="home-page">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-content">
          <h1 className="hero-title">
            Find a movie<br />
            <span className="hero-gradient-text">worth watching.</span>
          </h1>
          <p className="hero-subtitle">
            Search for a movie, browse by genre, or save something for later.
          </p>
          <div className="hero-search-box">
            <SearchBar placeholder={'Search movies, actors, or genres…'} />
          </div>
        </div>
      </section>

      {/* ── Trending Now ─────────────────────────────────── */}
      <section className="section container" id="trending-section">
        <h2 className="section-title">Trending movies</h2>

        {loading ? (
          <div className="scroll-row">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="movie-card skeleton" style={{ width: 160, flexShrink: 0 }} />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <h3>Backend not connected</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div className="scroll-row">
            {trending.map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* ── Browse by Genre ───────────────────────────────── */}
      <section className="section container" id="browse-section">
        <h2 className="section-title">Browse</h2>

        {/* Genre pills */}
        <div className="genre-filter" role="tablist" aria-label="Filter by genre">
          {ALL_GENRES.map((g) => (
            <button
              key={g}
              className={`genre-pill${genre === g ? ' active' : ''}`}
              onClick={() => setGenre(g)}
              role="tab"
              aria-selected={genre === g}
              id={`genre-pill-${g.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Movie grid */}
        {loading ? (
          <div className="movie-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="movie-card skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎬</span>
            <h3>No {genre} movies found</h3>
            <p>Try a different genre</p>
          </div>
        ) : (
          <div className="movie-grid">
            {filtered.map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
