"""
main.py - CineAI FastAPI Server
================================
This is the API layer between the ML model (model.py) and the React frontend.

All routes follow REST conventions under /api/movies/

Startup:
  - Loads the pre-built similarity matrix from artifacts/
  - If artifacts don't exist, builds them (takes 2-5 min first time)

Routes:
  GET /                                    → health check
  GET /api/movies/search?q=Batman          → search by title
  GET /api/movies/popular?limit=20         → trending movies
  GET /api/movies/recommend/by-titles      → personalized recs from favorites
  GET /api/movies/{movie_id}               → full movie details + cast
  GET /api/movies/{movie_id}/recommend     → AI recommendations for a movie

External API:
  - TMDB API is called per-request to fetch live poster images,
    cast photos, overview, backdrop, tagline, runtime etc.
  - TMDB_API_KEY is loaded from .env file
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import requests
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

# Import our ML functions
from model import (
    load_model,
    get_recommendations,
    search_movies,
    get_popular_movies,
)

# ── Load environment variables from .env ──────────────────
load_dotenv()

# ── Create FastAPI app ────────────────────────────────────
app = FastAPI(
    title="CineAI - Movie Recommendation API",
    description="Content-based movie recommendation system using cosine similarity",
    version="1.0.0",
)

# ── CORS Middleware ───────────────────────────────────────
# Allows the React frontend (localhost:5173) to call this API.
# Without this, the browser blocks cross-origin requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative React port
        "*",                       # Allow all origins (for deployment)
    ],
    allow_credentials=True,
    allow_methods=["*"],           # GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)

# ── TMDB API Config ───────────────────────────────────────
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE    = "https://api.themoviedb.org/3"
TMDB_IMG_W500  = "https://image.tmdb.org/t/p/w500"    # 500px wide images
TMDB_IMG_ORIG  = "https://image.tmdb.org/t/p/original" # Full resolution

# ── Load ML Model on startup ──────────────────────────────
# This runs ONCE when the server starts.
# After loading, movies_df and similarity_matrix stay in memory
# so every request is instant (no re-reading from disk).
print("Loading CineAI recommendation model...")
movies_df, similarity_matrix = load_model()
print(f"Server ready! {len(movies_df)} movies loaded.")


# ===========================================================
# IN-MEMORY TTL CACHE FOR TMDB API RESPONSES
# Avoids redundant API calls — cache expires after 10 minutes.
# ===========================================================

TMDB_CACHE: dict = {}          # { key: (value, expires_at) }
CACHE_TTL  = 1800              # seconds — 30 minutes

def cache_get(key: str):
    entry = TMDB_CACHE.get(key)
    if entry and time.time() < entry[1]:
        return entry[0]
    return None

def cache_set(key: str, value):
    TMDB_CACHE[key] = (value, time.time() + CACHE_TTL)


# ===========================================================
# TMDB HELPER FUNCTIONS
# ===========================================================

def get_tmdb_details(movie_id: int) -> dict:
    """
    Fetches movie details from TMDB API (cached for 10 min):
    poster, backdrop, overview, tagline, runtime, budget, revenue, status.

    Returns empty dict if the API call fails (graceful degradation).
    """
    if not TMDB_API_KEY:
        return {}

    # Return cached result if still valid
    cache_key = f"details_{movie_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        url    = f"{TMDB_BASE}/movie/{movie_id}"
        params = {"api_key": TMDB_API_KEY}
        res    = requests.get(url, params=params, timeout=8)

        if res.status_code != 200:
            return {}

        data = res.json()

        # Build poster URL — some movies don't have posters
        poster_path   = data.get("poster_path")
        backdrop_path = data.get("backdrop_path")

        result = {
            "poster"   : TMDB_IMG_W500 + poster_path   if poster_path   else None,
            "backdrop" : TMDB_IMG_ORIG + backdrop_path  if backdrop_path  else None,
            "overview" : data.get("overview", ""),
            "tagline"  : data.get("tagline", ""),
            "runtime"  : data.get("runtime", 0),
            "budget"   : data.get("budget", 0),
            "revenue"  : data.get("revenue", 0),
            "status"   : data.get("status", ""),
        }
        cache_set(cache_key, result)
        return result
    except Exception:
        return {}


def get_tmdb_cast(movie_id: int) -> list:
    """
    Fetches top 6 cast members from TMDB API (cached for 10 min).
    Each cast member includes: name, character, profile photo URL.

    Returns empty list if the API call fails.
    """
    if not TMDB_API_KEY:
        return []

    cache_key = f"cast_{movie_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        url    = f"{TMDB_BASE}/movie/{movie_id}/credits"
        params = {"api_key": TMDB_API_KEY}
        res    = requests.get(url, params=params, timeout=8)

        if res.status_code != 200:
            return []

        data = res.json()
        cast = []

        for member in data.get("cast", [])[:6]:   # Top 6 cast members only
            profile_path = member.get("profile_path")
            cast.append({
                "name"      : member.get("name", ""),
                "character" : member.get("character", ""),
                "profile"   : TMDB_IMG_W500 + profile_path if profile_path else None,
            })

        cache_set(cache_key, cast)
        return cast
    except Exception:
        return []


# ===========================================================
# API ROUTES
# ===========================================================

# ── Health Check ──────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    """
    Health check endpoint.
    Visit http://localhost:8000 to confirm the server is running.
    """
    return {
        "message"      : "CineAI Movie Recommender API is running",
        "total_movies" : len(movies_df),
        "status"       : "OK",
    }


# ── Search Movies ─────────────────────────────────────────
@app.get("/api/movies/search", tags=["Movies"])
def search(q: str = Query(..., min_length=2), limit: int = 10):
    """
    Search movies by title substring.
    Used by the SearchBar component for live dropdown results.

    Example: GET /api/movies/search?q=Batman&limit=5
    Returns: list of movies matching "Batman" in the title
    """
    results = search_movies(q, movies_df, limit)

    # Enrich each result with a poster image from TMDB (parallel)
    def _enrich_search(movie):
        details = get_tmdb_details(movie["movie_id"])
        movie["poster"] = details.get("poster")
        return movie

    with ThreadPoolExecutor(max_workers=min(len(results), 8)) as pool:
        list(pool.map(_enrich_search, results))

    return {"results": results, "count": len(results)}


# ── Popular / Trending Movies ──────────────────────────────
@app.get("/api/movies/popular", tags=["Movies"])
def popular(limit: int = 20):  # default 20 — keeps initial load fast
    """
    Returns top N movies sorted by TMDB popularity score.
    Used for the 'Trending Now' section on the homepage.

    Example: GET /api/movies/popular?limit=10
    """
    movies = get_popular_movies(movies_df, limit)

    # Enrich with poster and overview from TMDB — all calls run in parallel
    def _enrich_popular(movie):
        details = get_tmdb_details(movie["movie_id"])
        movie["poster"]   = details.get("poster")
        movie["overview"] = details.get("overview", "")
        return movie

    with ThreadPoolExecutor(max_workers=20) as pool:
        list(pool.map(_enrich_popular, movies))

    return {"movies": movies, "count": len(movies)}


# ── Personalized Recommendations from Favorites ───────────
# NOTE: This route MUST be defined BEFORE /api/movies/{movie_id}
# because FastAPI matches routes top-to-bottom.
# If {movie_id} is defined first, "recommend" would be treated as an ID.
@app.get("/api/movies/recommend/by-titles", tags=["Recommendations"])
def recommend_by_favorites(
    titles: str = Query(..., description="Comma-separated list of movie titles"),
    n: int = 10
):
    """
    Generates personalized recommendations based on a user's saved favorites.
    Takes up to 5 favorite movie titles, gets recommendations for each,
    merges and deduplicates them, then returns the top N.

    Example: GET /api/movies/recommend/by-titles?titles=Avatar,Inception&n=10

    Used by the FavoritesPage to show "You Might Also Like" section.
    """
    title_list = [t.strip() for t in titles.split(",") if t.strip()]

    if not title_list:
        raise HTTPException(status_code=400, detail="No titles provided")

    all_recs = []
    seen_titles = set()

    # Get recommendations for each favorite (max 5 favorites)
    for title in title_list[:5]:
        recs = get_recommendations(title, movies_df, similarity_matrix, n=n)
        for rec in recs:
            if rec["title"] not in seen_titles:
                seen_titles.add(rec["title"])
                all_recs.append(rec)

    # Sort all collected recs by similarity score (best first)
    all_recs.sort(key=lambda x: x["similarity_score"], reverse=True)
    top_recs = all_recs[:n]

    # Enrich with TMDB poster and overview — parallel
    def _enrich_rec(rec):
        details = get_tmdb_details(rec["movie_id"])
        rec["poster"]   = details.get("poster")
        rec["overview"] = details.get("overview", "")
        return rec

    with ThreadPoolExecutor(max_workers=10) as pool:
        list(pool.map(_enrich_rec, top_recs))

    return {
        "recommendations" : top_recs,
        "count"           : len(top_recs),
        "based_on"        : title_list[:5],
    }


# ── Movie Detail ──────────────────────────────────────────
@app.get("/api/movies/{movie_id}", tags=["Movies"])
def movie_detail(movie_id: int):
    """
    Returns full details for a single movie.
    Combines data from our local DataFrame + live TMDB API data.

    Example: GET /api/movies/550
    Returns: title, genres, rating, cast, poster, backdrop, overview, etc.

    Used by the MoviePage component.
    """
    # Look up movie in our DataFrame
    movie = movies_df[movies_df["movie_id"] == movie_id]

    if movie.empty:
        raise HTTPException(status_code=404, detail=f"Movie ID {movie_id} not found")

    movie_data  = movie.iloc[0].to_dict()
    tmdb_info   = get_tmdb_details(movie_id)
    tmdb_cast   = get_tmdb_cast(movie_id)

    return {
        "movie_id"     : movie_id,
        "title"        : movie_data["title"],
        "genres"       : movie_data.get("genres", []),
        "vote_average" : float(movie_data["vote_average"]),
        "vote_count"   : int(movie_data.get("vote_count", 0)),
        "popularity"   : float(movie_data.get("popularity", 0)),
        "release_date" : str(movie_data["release_date"]),
        "cast"         : tmdb_cast,
        # Spread TMDB details (poster, backdrop, overview, tagline, runtime...)
        **tmdb_info,
    }


# ── AI Recommendations for a Movie ───────────────────────
@app.get("/api/movies/{movie_id}/recommend", tags=["Recommendations"])
def recommend(
    movie_id: int,
    n: int = 10,
    genre: Optional[str] = None,
):
    """
    Returns top N AI-powered recommendations for a given movie.
    Optionally filter results by genre.

    Example: GET /api/movies/550/recommend?n=10&genre=Action

    Used by the MoviePage component's 'Movies You Might Like' section.
    """
    # Validate the movie exists
    movie = movies_df[movies_df["movie_id"] == movie_id]

    if movie.empty:
        raise HTTPException(status_code=404, detail=f"Movie ID {movie_id} not found")

    title = movie.iloc[0]["title"]

    # Get more results than needed when genre filter is active
    # (some may be filtered out, so we fetch extra to have enough)
    fetch_n = n * 3 if genre else n
    recommendations = get_recommendations(title, movies_df, similarity_matrix, n=fetch_n)

    # Apply genre filter if provided
    if genre:
        recommendations = [
            r for r in recommendations
            if any(genre.lower() in g.lower() for g in r.get("genres", []))
        ][:n]
    else:
        recommendations = recommendations[:n]

    # Enrich each recommendation with TMDB poster and overview — parallel
    def _enrich_r(rec):
        details = get_tmdb_details(rec["movie_id"])
        rec["poster"]   = details.get("poster")
        rec["overview"] = details.get("overview", "")
        return rec

    with ThreadPoolExecutor(max_workers=12) as pool:
        list(pool.map(_enrich_r, recommendations))

    return {
        "movie_id"        : movie_id,
        "movie_title"     : title,
        "genre_filter"    : genre,
        "recommendations" : recommendations,
        "count"           : len(recommendations),
    }
