import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'

/**
 * MovieCard — Reusable movie poster card
 *
 * Props:
 *   movie           — { movie_id, title, vote_average, poster, similarity_score, release_date, genres }
 *   showSimilarity  — show the similarity % badge (default false)
 */
export default function MovieCard({ movie, showSimilarity = false }) {
  const navigate              = useNavigate()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const fav = isFavorite(movie.movie_id)
  const [imgError, setImgError] = useState(false)

  const handleFavClick = (e) => {
    e.stopPropagation()
    if (fav) {
      removeFavorite(movie.movie_id)
    } else {
      addFavorite({
        movie_id    : movie.movie_id,
        title       : movie.title,
        poster      : movie.poster,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        genres      : movie.genres,
      })
    }
  }

  const year = movie.release_date?.slice(0, 4)

  return (
    <div
      className="movie-card fade-in"
      id={`movie-card-${movie.movie_id}`}
      onClick={() => navigate(`/movie/${movie.movie_id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/movie/${movie.movie_id}`)}
      aria-label={`View details for ${movie.title}`}
    >
      {/* Similarity badge (top-left) */}
      {showSimilarity && movie.similarity_score != null && (
        <span className="similarity-badge">
          {movie.similarity_score}% match
        </span>
      )}

      {/* Poster */}
      {movie.poster && !imgError ? (
        <img
          src={movie.poster}
          alt={movie.title}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="movie-card-no-poster">
          <span className="film-icon">🎬</span>
          <span className="movie-title" style={{ fontSize: '12px' }}>{movie.title}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="movie-card-overlay">
        <p className="movie-title">{movie.title}</p>
        <div className="movie-meta">
          {movie.vote_average > 0 && (
            <span className="rating-badge">
              ⭐ {Number(movie.vote_average).toFixed(1)}
            </span>
          )}
          {year && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{year}</span>
          )}
        </div>
      </div>

      {/* Favorite button (top-right) */}
      <button
        className={`favorite-btn${fav ? ' active' : ''}`}
        onClick={handleFavClick}
        aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        title={fav ? 'Remove from favorites' : 'Add to favorites'}
      >
        {fav ? '❤️' : '🤍'}
      </button>
    </div>
  )
}
