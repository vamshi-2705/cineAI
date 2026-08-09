"""
model.py — CineAI Content-Based Filtering Model
=================================================
This file does 3 things:

1. build_model()  → runs preprocess.py, vectorizes tags,
                    computes cosine similarity, saves .pkl files

2. load_model()   → loads saved .pkl files (or builds if missing)

3. get_recommendations() → given a movie title, returns top-N similar movies

4. search_movies()       → search movies by title substring

5. get_popular_movies()  → returns top movies by popularity score

HOW CONTENT-BASED FILTERING WORKS:
------------------------------------
Step A: Each movie has a 'tags' string (overview + genres + cast + director)
        e.g. "action adventure tomhanks nolan scifi..."

Step B: CountVectorizer converts every movie's tags into a
        numerical vector (word frequency counts)
        e.g. Avatar  → [0, 2, 1, 0, 3, ...]
             Inception → [1, 0, 0, 2, 1, ...]

Step C: Cosine Similarity measures the angle between two vectors.
        Score = 1.0 → identical movies
        Score = 0.0 → completely different movies

Step D: For any movie, sort all other movies by similarity score → top 10
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Import our preprocessing pipeline
from preprocess import preprocess


# ──────────────────────────────────────────────
# PATHS
# ──────────────────────────────────────────────

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'artifacts')
MOVIES_PKL    = os.path.join(ARTIFACTS_DIR, 'movies.pkl')
SIMILARITY_PKL = os.path.join(ARTIFACTS_DIR, 'similarity.pkl')


# ──────────────────────────────────────────────
# BUILD MODEL
# ──────────────────────────────────────────────

def build_model():
    """
    Runs the full ML pipeline:
      1. Preprocess data (load + clean CSVs)
      2. Vectorize tags with CountVectorizer
      3. Compute cosine similarity matrix
      4. Save both as .pkl files in artifacts/

    This takes 2-5 minutes because we compute similarity
    for every pair of 4799 movies (4799 x 4799 = 23 million pairs).
    Only needs to run ONCE — after that, load_model() reads the .pkl files.
    """

    print("=" * 55)
    print("  CineAI — Building Content-Based Filtering Model")
    print("=" * 55)

    # ── STEP 1: Preprocess ────────────────────────────────
    print("\n[Step 1/4] Running preprocessing pipeline...")
    movies = preprocess()
    print(f"           Loaded {len(movies)} movies")

    # ── STEP 2: Vectorize ─────────────────────────────────
    print("\n[Step 2/4] Vectorizing movie tags...")
    print("           Using CountVectorizer (max 5000 features, English stop words)")
    print("           This converts each movie's tags into a word-frequency vector")

    cv = CountVectorizer(
        max_features=5000,   # Keep only top 5000 most frequent words
        stop_words='english' # Ignore common words: 'the', 'a', 'is', 'in', etc.
    )

    # fit_transform does two things:
    #   fit      → learn the vocabulary from all movie tags
    #   transform → convert each movie's tags into a numeric vector
    #
    # Result shape: (4799 movies, 5000 word features)
    # Each cell = how many times that word appears in that movie's tags
    vectors = cv.fit_transform(movies['tags']).toarray()

    print(f"           Feature matrix shape: {vectors.shape}")
    print(f"           (rows=movies, cols=vocabulary words)")

    # ── STEP 3: Cosine Similarity ─────────────────────────
    print("\n[Step 3/4] Computing cosine similarity matrix...")
    print("           This calculates similarity between all 4799 x 4799 movie pairs")
    print("           Please wait (2-5 minutes)...")

    # cosine_similarity(A, A) computes the dot product between every pair of rows
    # Result: 4799 x 4799 matrix where cell [i][j] = similarity(movie_i, movie_j)
    # Range: 0.0 (no similarity) to 1.0 (identical)
    similarity = cosine_similarity(vectors)

    print(f"           Similarity matrix shape: {similarity.shape}")
    print(f"           Memory size: ~{similarity.nbytes / (1024**2):.1f} MB")

    # ── STEP 4: Save Artifacts ───────────────────────────
    print("\n[Step 4/4] Saving artifacts...")
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    with open(MOVIES_PKL, 'wb') as f:
        pickle.dump(movies, f)
    print(f"           Saved: movies.pkl    ({os.path.getsize(MOVIES_PKL) / 1024:.1f} KB)")

    with open(SIMILARITY_PKL, 'wb') as f:
        pickle.dump(similarity, f)
    print(f"           Saved: similarity.pkl ({os.path.getsize(SIMILARITY_PKL) / (1024**2):.1f} MB)")

    print("\n" + "-" * 55)
    print("  Model built successfully! Ready to serve recommendations.")
    print("=" * 55)

    return movies, similarity


# ──────────────────────────────────────────────
# LOAD MODEL
# ──────────────────────────────────────────────

def load_model():
    """
    Loads pre-built .pkl files from artifacts/.
    If movies.pkl exists but similarity.pkl is missing (e.g. cloud deployment),
    computes the similarity matrix on the fly in ~4 seconds.
    If neither exists, builds from raw datasets.
    """
    if os.path.exists(MOVIES_PKL) and os.path.exists(SIMILARITY_PKL):
        print("Loading pre-built model from artifacts/...")
        with open(MOVIES_PKL, 'rb') as f:
            movies = pickle.load(f)
        with open(SIMILARITY_PKL, 'rb') as f:
            similarity = pickle.load(f)
        print(f"Model loaded: {len(movies)} movies, similarity matrix {similarity.shape}")
        return movies, similarity

    elif os.path.exists(MOVIES_PKL):
        print("movies.pkl found. Computing similarity matrix in RAM...")
        with open(MOVIES_PKL, 'rb') as f:
            movies = pickle.load(f)

        cv = CountVectorizer(max_features=5000, stop_words='english')
        vectors = cv.fit_transform(movies['tags']).toarray()
        similarity = cosine_similarity(vectors)

        try:
            os.makedirs(ARTIFACTS_DIR, exist_ok=True)
            with open(SIMILARITY_PKL, 'wb') as f:
                pickle.dump(similarity, f)
            print("Saved similarity.pkl for future requests.")
        except Exception as e:
            print(f"Notice: Could not write similarity.pkl to disk ({e}), running in-memory.")

        print(f"Model loaded: {len(movies)} movies, similarity matrix {similarity.shape}")
        return movies, similarity

    else:
        print("No pre-built model found. Building from scratch...")
        return build_model()


# ──────────────────────────────────────────────
# GET RECOMMENDATIONS
# ──────────────────────────────────────────────

def get_recommendations(movie_title, movies, similarity, n=10):
    """
    Given a movie title, returns top-N most similar movies.

    Algorithm:
      1. Find the row index of the movie in our DataFrame
      2. Grab that movie's row from the similarity matrix
         → a list of (index, score) for all 4799 movies
      3. Sort by score descending
      4. Skip index 0 (the movie itself, score = 1.0)
      5. Return top N with their metadata

    Args:
        movie_title (str)  : Movie title to find recommendations for
        movies (DataFrame) : Preprocessed movies DataFrame
        similarity (ndarray): The 4799x4799 cosine similarity matrix
        n (int)            : Number of recommendations to return

    Returns:
        list of dicts with keys:
          movie_id, title, similarity_score, genres, vote_average, release_date
    """

    # ── Find the movie ────────────────────────────────────
    # First try exact match (case-insensitive)
    movie_list = movies[movies['title'].str.lower() == movie_title.lower()]

    # If no exact match, try partial/substring match
    if movie_list.empty:
        movie_list = movies[
            movies['title'].str.lower().str.contains(
                movie_title.lower(), na=False
            )
        ]

    if movie_list.empty:
        print(f"Movie not found: '{movie_title}'")
        return []

    # Get the DataFrame index (row number) of the first match
    idx = movie_list.index[0]
    found_title = movies.iloc[idx]['title']
    print(f"Finding recommendations for: '{found_title}' (index={idx})")

    # ── Get similarity scores ─────────────────────────────
    # similarity[idx] → 1D array of scores vs every other movie
    # enumerate() → pairs each score with its index: [(0, 0.92), (1, 0.45), ...]
    distances = list(enumerate(similarity[idx]))

    # Sort by score descending (highest similarity first)
    distances = sorted(distances, key=lambda x: x[1], reverse=True)

    # Skip index 0 = the movie itself (similarity = 1.0 with itself)
    # Take next n movies
    top_movies = distances[1 : n + 1]

    # ── Build result list ─────────────────────────────────
    recommendations = []
    for i, score in top_movies:
        movie_data = movies.iloc[i]
        recommendations.append({
            'movie_id'        : int(movie_data['movie_id']),
            'title'           : movie_data['title'],
            'similarity_score': round(float(score) * 100, 1),  # Convert to percentage
            'genres'          : movie_data['genres'] if isinstance(movie_data['genres'], list) else [],
            'vote_average'    : float(movie_data['vote_average']),
            'release_date'    : str(movie_data['release_date']),
        })

    return recommendations


# ──────────────────────────────────────────────
# SEARCH MOVIES
# ──────────────────────────────────────────────

def search_movies(query, movies, limit=10):
    """
    Searches for movies by title substring.
    Used by the search bar in the frontend.

    Args:
        query (str)        : User's search text
        movies (DataFrame) : Preprocessed movies DataFrame
        limit (int)        : Max number of results

    Returns:
        list of dicts: movie_id, title, vote_average, release_date
    """
    results = movies[
        movies['title'].str.lower().str.contains(
            query.lower(), na=False
        )
    ].head(limit)

    return results[['movie_id', 'title', 'vote_average', 'release_date']].to_dict('records')


# ──────────────────────────────────────────────
# GET POPULAR MOVIES
# ──────────────────────────────────────────────

def get_popular_movies(movies, limit=20):
    """
    Returns top N movies sorted by TMDB popularity score.
    Used for the 'Trending Now' section on the homepage.

    The popularity score is calculated by TMDB based on:
    - Number of views on TMDB website
    - Number of votes
    - Recent activity

    Args:
        movies (DataFrame): Preprocessed movies DataFrame
        limit (int)       : Number of trending movies to return

    Returns:
        list of dicts: movie_id, title, vote_average, popularity, release_date
    """
    popular = movies.nlargest(limit, 'popularity')
    return popular[
        ['movie_id', 'title', 'vote_average', 'popularity', 'release_date']
    ].to_dict('records')


# ──────────────────────────────────────────────
# RUN DIRECTLY (builds + tests the model)
# ──────────────────────────────────────────────

if __name__ == '__main__':
    # Build (or load) the model
    movies, similarity = load_model()

    print("\n" + "-" * 55)
    print("  TESTING RECOMMENDATIONS")
    print("-" * 55)

    # Test with famous movies
    test_movies = [
        "The Dark Knight",
        "Avatar",
        "Inception",
        "Interstellar",
    ]

    for title in test_movies:
        print(f"\n--- Recommendations for '{title}' ---")
        recs = get_recommendations(title, movies, similarity, n=5)
        if recs:
            for i, rec in enumerate(recs, 1):
                print(f"  {i}. {rec['title']:<40} "
                      f"Score: {rec['similarity_score']:>5}%  "
                      f"Rating: {rec['vote_average']}")
        else:
            print("  No recommendations found.")

    # Test search
    print("\n" + "-" * 55)
    print("  TESTING SEARCH: 'spider'")
    print("-" * 55)
    results = search_movies("spider", movies, limit=5)
    for r in results:
        print(f"  {r['movie_id']}  {r['title']}")

    # Test popular
    print("\n" + "-" * 55)
    print("  TOP 5 POPULAR MOVIES")
    print("-" * 55)
    popular = get_popular_movies(movies, limit=5)
    for p in popular:
        print(f"  {p['title']:<40} Popularity: {p['popularity']:.1f}")
