# 🎬 CineAI — AI-Powered Movie Recommendation System

> AI-powered movie recommendation system using content-based filtering, cosine similarity, FastAPI + React

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

---

## ✨ Features

- 🔍 **Search** any movie from 5000+ titles
- 🤖 **AI Recommendations** — content-based filtering using cosine similarity
- 🎭 **Movie Details** — posters, cast, ratings, overview via TMDB API
- 🎯 **Genre Filter** — filter recommendations by genre
- ❤️ **Favorites** — save movies and get personalized picks
- 🔥 **Trending** — see most popular movies right now

---

## 🛠 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| ML Model  | scikit-learn (CountVectorizer + Cosine Similarity) |
| Backend   | FastAPI + Uvicorn                   |
| Data      | Pandas, NumPy, TMDB 5000 Dataset    |
| API       | TMDB API (posters & details)        |
| Frontend  | React + Vite + React Router DOM     |
| HTTP      | Axios                               |

---

## 📁 Project Structure

```
movie-recommender/
├── backend/
│   ├── main.py           # FastAPI server + all API routes
│   ├── model.py          # ML recommendation logic
│   ├── preprocess.py     # Data cleaning pipeline
│   ├── data/             # TMDB 5000 CSV files (download separately)
│   ├── artifacts/        # Precomputed .pkl files (auto-generated)
│   ├── .env.example      # API key template
│   └── requirements.txt
│
├── client/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level pages
│   │   ├── context/      # Favorites context (localStorage)
│   │   └── utils/        # Axios API helpers
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- TMDB API Key (free at [themoviedb.org](https://www.themoviedb.org/settings/api))
- TMDB 5000 Dataset from [Kaggle](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Add your TMDB API key
cp .env.example .env
# Edit .env and add your key

# Place dataset CSV files in backend/data/
# - tmdb_5000_movies.csv
# - tmdb_5000_credits.csv

# Build the similarity matrix (one time, ~2-5 min)
python model.py

# Start the server
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

App runs at: `http://localhost:5173`

---

## 🧠 How It Works

1. **Preprocessing** — movie genres, cast, keywords, overview are combined into a single "tags" string per movie
2. **Vectorization** — CountVectorizer converts tags to a word-frequency matrix (5000 features)
3. **Similarity** — Cosine similarity is computed for all 5000×5000 movie pairs
4. **Recommendation** — Top 10 most similar movies are returned for any query

---

## 📡 API Endpoints

| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| GET    | `/api/movies/popular`                 | Trending movies              |
| GET    | `/api/movies/search?q={query}`        | Search movies by title       |
| GET    | `/api/movies/{id}`                    | Movie details + cast         |
| GET    | `/api/movies/{id}/recommend`          | AI recommendations           |
| GET    | `/api/movies/recommend/by-titles`     | Personalized recommendations |

---

## 🌐 Deployment

- **Backend**: [Railway.app](https://railway.app) — set `TMDB_API_KEY` env var
- **Frontend**: [Vercel](https://vercel.com) — update `VITE_API_URL` to Railway URL

---

## 📸 Screenshots

> Coming soon — will be added after UI is complete

---

## 📝 License

MIT License — free to use and modify
