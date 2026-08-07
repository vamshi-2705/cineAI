import axios from 'axios'

/** Base Axios instance pointing to the FastAPI backend */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 15000,
})

// ---- Movie endpoints ----

/** Search movies by title query */
export const searchMovies = (q, limit = 10) =>
  API.get(`/movies/search?q=${encodeURIComponent(q)}&limit=${limit}`)

/** Get popular / trending movies */
export const getPopular = (limit = 20) =>
  API.get(`/movies/popular?limit=${limit}`)

/** Get full details for a single movie (poster, cast, overview, etc.) */
export const getMovieDetail = (id) => API.get(`/movies/${id}`)

/**
 * Get AI recommendations for a movie.
 * @param {number} id       — TMDB movie ID
 * @param {string} [genre]  — optional genre filter
 * @param {number} [n]      — number of results (default 10)
 */
export const getRecommendations = (id, genre = null, n = 10) =>
  API.get(
    `/movies/${id}/recommend?n=${n}${genre ? `&genre=${encodeURIComponent(genre)}` : ''}`
  )

/**
 * Get personalized recommendations from a list of favorite movie titles.
 * @param {string[]} titles — array of movie title strings
 */
export const getPersonalized = (titles, n = 10) =>
  API.get(
    `/movies/recommend/by-titles?titles=${titles.map(encodeURIComponent).join(',')}&n=${n}`
  )

export default API
