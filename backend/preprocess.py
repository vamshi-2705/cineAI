"""
preprocess.py — CineAI Data Preprocessing Pipeline
====================================================
Loads the raw TMDB 5000 dataset (movies + credits CSVs),
cleans and transforms all columns, and returns a clean
DataFrame with a 'tags' column ready for ML vectorization.

Flow:
  tmdb_5000_movies.csv  ─┐
                          ├─► merge ─► clean ─► new_df (with 'tags')
  tmdb_5000_credits.csv ─┘
"""

import pandas as pd
import numpy as np
import ast
import os


# ──────────────────────────────────────────────
# HELPER FUNCTIONS
# ──────────────────────────────────────────────

def parse_list(obj):
    """
    Converts a JSON string column (genres, keywords) into
    a Python list of name strings.

    Example input:  "[{'id': 28, 'name': 'Action'}, {'id': 12, 'name': 'Adventure'}]"
    Example output: ['Action', 'Adventure']
    """
    try:
        return [i['name'] for i in ast.literal_eval(obj)]
    except Exception:
        return []


def get_director(obj):
    """
    Extracts the director's name from the crew JSON string.
    Returns a list (single item) for consistency with other columns.

    Example input:  "[{'job': 'Director', 'name': 'Christopher Nolan'}, ...]"
    Example output: ['Christopher Nolan']
    """
    try:
        for person in ast.literal_eval(obj):
            if person.get('job') == 'Director':
                return [person['name']]
        return []
    except Exception:
        return []


def get_top_cast(obj, n=5):
    """
    Extracts the top N cast members from the cast JSON string.
    We only take top 5 because minor actors add noise, not signal.

    Example input:  "[{'name': 'Tom Hanks', ...}, {'name': 'Robin Wright', ...}]"
    Example output: ['Tom Hanks', 'Robin Wright', ...]
    """
    try:
        return [person['name'] for person in ast.literal_eval(obj)[:n]]
    except Exception:
        return []


def remove_spaces(lst):
    """
    Removes spaces from names so multi-word names are treated as
    a single token by the ML model.

    Why: Without this, 'Tom Hanks' becomes TWO words: 'Tom' and 'Hanks'.
    A movie with a character named Tom or any other Tom would falsely match.

    Example: ['Tom Hanks', 'Sci-Fi'] → ['TomHanks', 'Sci-Fi']
    """
    return [name.replace(" ", "") for name in lst]


# ──────────────────────────────────────────────
# MAIN PREPROCESSING FUNCTION
# ──────────────────────────────────────────────

def preprocess():
    """
    Full preprocessing pipeline. Returns a clean DataFrame with columns:
        movie_id, title, tags, genres, vote_average,
        vote_count, popularity, release_date

    The 'tags' column is a single lowercase string combining
    overview words + genres + keywords + cast + director.
    This is what the ML model trains on.
    """

    # ── 1. LOAD DATA ──────────────────────────────────
    print("[1/11] Loading datasets...")

    # Determine path relative to this script's location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    movies_path  = os.path.join(base_dir, 'data', 'tmdb_5000_movies.csv')
    credits_path = os.path.join(base_dir, 'data', 'tmdb_5000_credits.csv')

    movies  = pd.read_csv(movies_path)
    credits = pd.read_csv(credits_path)

    print(f"       Movies  dataset : {movies.shape[0]} rows, {movies.shape[1]} cols")
    print(f"       Credits dataset : {credits.shape[0]} rows, {credits.shape[1]} cols")


    # ── 2. MERGE ──────────────────────────────────────
    # Both CSVs share a 'title' column — merge on it.
    # After merge we have all movie info + cast/crew in one table.
    print("[2/11] Merging datasets on 'title'...")
    movies = movies.merge(credits, on='title')
    print(f"       Merged shape: {movies.shape}")


    # ── 3. SELECT COLUMNS ─────────────────────────────
    # Keep only the columns we actually need.
    # Drop budget, revenue, homepage, etc. — not useful for content similarity.
    movies = movies[[
        'movie_id',      # TMDB movie ID (used to fetch posters from API)
        'title',         # Movie name
        'overview',      # Plot summary text
        'genres',        # e.g. "[{'name': 'Action'}, ...]"
        'keywords',      # e.g. "[{'name': 'based on novel'}, ...]"
        'cast',          # e.g. "[{'name': 'Tom Hanks'}, ...]"
        'crew',          # e.g. "[{'job': 'Director', 'name': '...'}, ...]"
        'vote_average',  # TMDB rating (0-10)
        'vote_count',    # Number of votes
        'popularity',    # TMDB popularity score
        'release_date',  # e.g. "2010-07-16"
        'runtime',       # Movie length in minutes
    ]]


    # ── 4. DROP NULL ROWS ─────────────────────────────
    # Some movies have missing overview or genres — remove them.
    before = len(movies)
    movies.dropna(inplace=True)
    after = len(movies)
    print(f"[4/11] Dropped {before - after} rows with null values. Remaining: {after}")


    # ── 5. DROP DUPLICATES ────────────────────────────
    movies.drop_duplicates(subset='movie_id', inplace=True)
    print(f"[5/11] After dedup: {len(movies)} movies")


    # ── 6. PARSE JSON STRING COLUMNS ──────────────────
    # These columns contain JSON strings — convert to Python lists.
    print("[6/11] Parsing JSON columns...")

    movies['genres']   = movies['genres'].apply(parse_list)
    # genres: "[{'name':'Action'}]" → ['Action']

    movies['keywords'] = movies['keywords'].apply(parse_list)
    # keywords: "[{'name':'spy'}]"  → ['spy']

    movies['cast']     = movies['cast'].apply(get_top_cast)
    # cast: "[{'name':'Tom Hanks'}]" → ['Tom Hanks', ...]  (top 5)

    movies['crew']     = movies['crew'].apply(get_director)
    # crew: "[{'job':'Director','name':'Nolan'}]" → ['Christopher Nolan']


    # ── 7. REMOVE SPACES FROM NAMES ──────────────────
    # Critical for ML accuracy! "Tom Hanks" → "TomHanks"
    # so it's treated as one token, not two separate words.
    movies['genres']   = movies['genres'].apply(remove_spaces)
    movies['keywords'] = movies['keywords'].apply(remove_spaces)
    movies['cast']     = movies['cast'].apply(remove_spaces)
    movies['crew']     = movies['crew'].apply(remove_spaces)


    # ── 8. SPLIT OVERVIEW INTO WORDS ─────────────────
    # The overview is a full sentence — split into individual words.
    # This lets CountVectorizer treat each word separately.
    # e.g. "A thief who steals" → ['A', 'thief', 'who', 'steals']
    movies['overview'] = movies['overview'].apply(lambda x: x.split())


    # ── 9. CREATE TAGS COLUMN ─────────────────────────
    # This is the KEY step — combine ALL features into one text blob.
    # The ML model will learn movie similarity from this text.
    #
    # tags = overview words + genres + keywords + cast + director
    #
    # Example for Inception:
    #   overview: ['A', 'thief', 'who', 'steals', ...]
    #   genres:   ['ScienceFiction', 'Action', 'Adventure']
    #   keywords: ['dreamworld', 'mindbending', ...]
    #   cast:     ['LeonardoDiCaprio', 'JosephGordon-Levitt', ...]
    #   crew:     ['ChristopherNolan']
    #
    # Final tags string: "thief steals corporateespionage ScienceFiction
    #                     Action LeonardoDiCaprio ChristopherNolan ..."
    movies['tags'] = (
        movies['overview'] +
        movies['genres']   +
        movies['keywords'] +
        movies['cast']     +
        movies['crew']
    )


    # ── 10. BUILD FINAL DATAFRAME ─────────────────────
    # Only keep what the API needs to serve to the frontend.
    new_df = movies[[
        'movie_id',
        'title',
        'tags',          # ML training column
        'genres',        # For genre filter feature
        'vote_average',  # For rating badge on cards
        'vote_count',    # For weighted sorting
        'popularity',    # For trending section
        'release_date',  # For release year display
    ]].copy()


    # ── 11. CONVERT TAGS LIST → LOWERCASE STRING ──────
    # CountVectorizer expects a string, not a list.
    # Lowercase so 'Action' and 'action' are the same token.
    new_df['tags'] = new_df['tags'].apply(
        lambda x: " ".join(x).lower()
    )

    # Reset index for clean indexing
    new_df.reset_index(drop=True, inplace=True)

    print("Preprocessing complete!")
    print(f"   Final shape  : {new_df.shape}")
    print(f"   Columns      : {list(new_df.columns)}")
    print(f"\n--- Sample Row ---")
    sample = new_df.iloc[0]
    print(f"   Title  : {sample['title']}")
    print(f"   Genres : {sample['genres']}")
    print(f"   Tags   : {sample['tags'][:120]}...")

    return new_df


# ──────────────────────────────────────────────
# RUN DIRECTLY (for testing)
# ──────────────────────────────────────────────
if __name__ == '__main__':
    df = preprocess()
    print(f"\nTotal movies ready for ML: {len(df)}")

    # Show a few sample movies
    print("\nSample movies:")
    print(df[['movie_id', 'title', 'vote_average', 'popularity']].head(10).to_string(index=False))
