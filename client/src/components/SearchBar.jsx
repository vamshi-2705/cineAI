import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchMovies } from '../utils/api'

/**
 * SearchBar — Live search with debounce + keyboard navigation
 *
 * Props:
 *   placeholder  — input placeholder text
 *   onClose      — optional callback when search is dismissed (for mobile)
 */
export default function SearchBar({ placeholder = 'Search 5,000+ movies…', onClose }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const inputRef    = useRef(null)
  const dropdownRef = useRef(null)
  const timerRef    = useRef(null)
  const navigate    = useNavigate()

  // ── Debounced search ─────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await searchMovies(q, 8)
      setResults(data.results || [])
      setOpen(true)
      setHighlighted(-1)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timerRef.current)
  }, [query, doSearch])

  // ── Outside click → close dropdown ───────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Keyboard navigation ───────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) selectMovie(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selectMovie = (movie) => {
    setQuery('')
    setOpen(false)
    setResults([])
    navigate(`/movie/${movie.movie_id}`)
    onClose?.()
  }

  const starRating = (v) => (v >= 7 ? '⭐' : '')

  return (
    <div className="search-wrapper" style={{ position: 'relative', width: '100%' }}>
      {/* Input */}
      <div className="search-input-row">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          id="main-search-input"
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <span className="search-spinner" />}
        {query && (
          <button
            className="search-clear"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul className="search-dropdown" ref={dropdownRef}>
          {results.map((movie, i) => (
            <li
              key={movie.movie_id}
              className={`search-result-item${highlighted === i ? ' highlighted' : ''}`}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => selectMovie(movie)}
            >
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="search-result-poster"
                />
              ) : (
                <div className="search-result-poster search-result-no-poster">🎬</div>
              )}
              <div className="search-result-info">
                <span className="search-result-title">{movie.title}</span>
                <span className="search-result-meta">
                  {movie.release_date?.slice(0, 4)}
                  {movie.vote_average > 0 && (
                    <span className="search-result-rating">
                      {starRating(movie.vote_average)} {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </span>
              </div>
              <span className="search-result-arrow">›</span>
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="search-dropdown search-no-results">
          <span>No movies found for "<strong>{query}</strong>"</span>
        </div>
      )}
    </div>
  )
}
