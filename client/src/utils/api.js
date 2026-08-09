import axios from 'axios'

/** Base Axios instance pointing to the FastAPI backend */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 20000,
})

// ── Simple in-memory response cache (5-minute TTL) ────────────────────────────
// Avoids redundant network calls when the user navigates back to the same movie
// or refreshes the home page. Search is intentionally not cached.

const CACHE = new Map()           // key → { data, expiresAt }
const CACHE_TTL_MS = 5 * 60_000  // 5 minutes

function cacheGet(key) {
  const entry = CACHE.get(key)
  if (entry && Date.now() < entry.expiresAt) return entry.data
  CACHE.delete(key)
  return null
}

function cacheSet(key, data) {
  CACHE.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

async function cachedGet(url) {
  const hit = cacheGet(url)
  if (hit) return hit                         // instant – return cached axios-like response
  const res = await API.get(url)
  cacheSet(url, res)
  return res
}

// ---- Movie endpoints ----

/** Search movies by title query (not cached – needs live results) */
export const searchMovies = (q, limit = 10) =>
  API.get(`/movies/search?q=${encodeURIComponent(q)}&limit=${limit}`)

/** Get popular / trending movies (cached – same list on every home visit) */
export const getPopular = (limit = 20) =>
  cachedGet(`/movies/popular?limit=${limit}`)

/** Get full details for a single movie (cached – poster/cast don't change) */
export const getMovieDetail = (id) =>
  cachedGet(`/movies/${id}`)

/**
 * Get AI recommendations for a movie (cached per movie+genre combination).
 * @param {number} id       — TMDB movie ID
 * @param {string} [genre]  — optional genre filter
 * @param {number} [n]      — number of results (default 10)
 */
export const getRecommendations = (id, genre = null, n = 10) => {
  const url = `/movies/${id}/recommend?n=${n}${genre ? `&genre=${encodeURIComponent(genre)}` : ''}`
  return cachedGet(url)
}

/**
 * Get personalized recommendations from a list of favorite movie titles.
 * @param {string[]} titles — array of movie title strings
 */
export const getPersonalized = (titles, n = 10) =>
  API.get(
    `/movies/recommend/by-titles?titles=${titles.map(encodeURIComponent).join(',')}&n=${n}`
  )

export default API
