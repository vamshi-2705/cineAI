import { createContext, useState, useContext, useEffect } from 'react'

const FavoritesContext = createContext()

/**
 * FavoritesProvider — wraps the app and provides global favorites state.
 * Favorites are persisted to localStorage so they survive page refreshes.
 */
export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cineai_favorites') || '[]')
    } catch {
      return []
    }
  })

  // Sync to localStorage whenever favorites changes
  useEffect(() => {
    localStorage.setItem('cineai_favorites', JSON.stringify(favorites))
  }, [favorites])

  /** Add a movie to favorites (no duplicates) */
  const addFavorite = (movie) => {
    setFavorites((prev) =>
      prev.find((f) => f.movie_id === movie.movie_id)
        ? prev
        : [...prev, movie]
    )
  }

  /** Remove a movie from favorites by ID */
  const removeFavorite = (movie_id) => {
    setFavorites((prev) => prev.filter((f) => f.movie_id !== movie_id))
  }

  /** Check whether a movie is already saved */
  const isFavorite = (movie_id) =>
    favorites.some((f) => f.movie_id === movie_id)

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

/** Hook — use anywhere inside the app: const { favorites, addFavorite } = useFavorites() */
export const useFavorites = () => useContext(FavoritesContext)
