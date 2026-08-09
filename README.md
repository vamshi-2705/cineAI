# 🎬 CineAI: AI-Powered Movie Recommendation System

[![LIVE DEMO](https://img.shields.io/badge/LIVE%20DEMO-VERCEL-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cine-ai-two.vercel.app)
[![BACKEND API](https://img.shields.io/badge/BACKEND%20API-RENDER-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://cineai-ihm4.onrender.com/docs)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)

**CineAI** is a full-stack, AI-powered movie recommendation platform designed to solve choice paralysis in movie selection. By vectorizing plot overviews, genres, directors, top cast members, and keywords into high-dimensional feature spaces, CineAI calculates mathematical **Cosine Similarity** across 5,000+ films to deliver instant, hyper-relevant movie recommendations.

---

> [!IMPORTANT]
> **Why CineAI?**
> With thousands of movies across streaming platforms, finding what to watch is overwhelming. Keyword search engines only match exact titles or isolated terms. CineAI extracts multi-dimensional semantic "tags" per film (overview + genres + keywords + cast + director) and converts them into word-frequency vectors to calculate similarity metrics in real time.

---

## ✨ Features

- 🔍 **Live Debounced Search**: Real-time title search across 5,000+ movies with thumbnail previews, release years, star ratings, and keyboard navigation.
- 🤖 **Content-Based AI Recommendations**: Cosine similarity computation returning top-N matching movies with percentage match badges (e.g. `86% match`).
- ❤️ **Personalized Favorites Engine**: Save films to your client-side Favorites list; CineAI aggregates your collective taste to recommend multi-favorite picks.
- 🎭 **Rich TMDB Metadata**: High-res backdrop heroes, poster images, taglines, plot overviews, budget/revenue stats, and cast profile photos.
- 🎯 **Dynamic Genre Filter**: Filter popular catalogs or recommendation lists by genre pills (Action, Sci-Fi, Thriller, etc.).
- ⚡ **Optimized RAM Cold Start**: Preprocessed metadata (`movies.pkl`) generates 4,799×4,799 32-bit float matrix in RAM in ~4 seconds, fitting easily within free tier limits.
- 📱 **Responsive Glassmorphism UI**: Built with a sleek dark glassmorphism design system, smooth CSS micro-animations, and full mobile optimization.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Machine Learning** | `scikit-learn` (`CountVectorizer` + `cosine_similarity`) | Content-based feature vector extraction & mathematical similarity metrics |
| **Data Pipeline** | `Pandas`, `NumPy` | CSV cleaning, JSON parsing, 32-bit floating-point matrix manipulation |
| **Backend API** | `FastAPI`, `Uvicorn`, `Gunicorn` | Production-grade Python REST API with parallel TMDB threading & TTL caching |
| **External API** | `TMDB API v3` | Live movie poster images, high-res backdrops, and cast profiles |
| **Frontend SPA** | `React 19`, `Vite 8`, `React Router 7` | Ultra-fast single page application with modern component architecture |
| **State Management** | `React Context` + `localStorage` | Persistent client-side favorites management without complex databases |
| **HTTP Client** | `Axios` | Asynchronous API client with built-in response caching |
| **Deployment** | `Render` (Backend), `Vercel` (Frontend) | Free-tier cloud hosting with continuous GitHub deployment |

---

## 🧠 How The ML Recommendation Engine Works

1. **Preprocessing**: Combines plot overview, genres, keywords, top 5 cast members, and director into a unified lowercase `tags` string. Names are formatted without spaces (e.g. `"Tom Hanks"` ➔ `"TomHanks"`) so entity names act as unified features.
2. **Vectorization**: `CountVectorizer` converts tags into a 5,000-dimensional bag-of-words matrix, filtering out English stop-words (`the`, `is`, `in`).
3. **Cosine Similarity Computation**: Computes the cosine of the angle between high-dimensional vectors:
   $$\text{Similarity}(A, B) = \cos(\theta) = \frac{A \cdot B}{\|A\| \|B\|}$$
4. **Memory Optimization**: Stored in 32-bit floating point precision (`float32`), reducing RAM consumption to ~87 MB for cloud deployment.

---

## 🏗 Architecture

```
User (Browser) ──► React 19 SPA (Vercel) ──► Axios ──► FastAPI Server (Render)
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                   ML Cosine Similarity                TMDB API (v3)
                                  (RAM Matrix 4799x4799)         (Posters, Backdrops, Cast)
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check endpoint |
| `GET` | `/api/movies/popular?limit=20` | Trending popular movies |
| `GET` | `/api/movies/search?q={query}&limit=8` | Live title search |
| `GET` | `/api/movies/{id}` | Detailed movie metadata + cast members |
| `GET` | `/api/movies/{id}/recommend?n=12&genre={genre}` | Single-movie AI recommendations |
| `GET` | `/api/movies/recommend/by-titles?titles={t1,t2}&n=12` | Multi-favorite personalized AI recommendations |

---

## 📁 Project Structure

```
cineAI/
├── render.yaml                   # Render Blueprint config
├── DEPLOYMENT.md                 # Complete deployment guide
├── CINEAI_PROJECT_GUIDE.md       # Comprehensive developer & interview guide
├── backend/                      # FastAPI Python Backend
│   ├── main.py                   # FastAPI server & route handlers
│   ├── model.py                  # ML model load/search & cosine calculations
│   ├── preprocess.py             # Data preprocessing pipeline
│   ├── requirements.txt          # Backend dependencies
│   └── artifacts/
│       └── movies.pkl            # Preprocessed movie metadata (2.7 MB)
└── client/                       # React 19 + Vite Frontend
    ├── index.html                # HTML entry point
    ├── vercel.json               # Vercel SPA route rewrite rules
    ├── package.json              # Frontend dependencies
    └── src/
        ├── App.jsx               # Application router & layout shell
        ├── main.jsx              # DOM root mount
        ├── index.css             # Glassmorphic design system
        ├── components/           # Navbar, SearchBar, MovieCard, Footer
        ├── context/              # FavoritesContext state & localStorage
        ├── pages/                # HomePage, MoviePage, FavoritesPage, NotFoundPage
        └── utils/                # Axios API instance
```

---

## 🚀 Local Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Free TMDB API Key from [themoviedb.org](https://www.themoviedb.org/settings/api)

### 2. Backend Setup
```bash
cd backend

# Install Python packages
pip install -r requirements.txt

# Create .env file and add your TMDB key
echo "TMDB_API_KEY=your_tmdb_api_key_here" > .env

# Run FastAPI server
uvicorn main:app --reload --port 8000
```
*API interactive documentation will be available at `http://localhost:8000/docs`*

### 3. Frontend Setup
```bash
cd client

# Install NPM dependencies
npm install

# Start Vite dev server
npm run dev
```
*App will run at `http://localhost:5173`*

---

## 🌐 Live Production Deployments

- **Frontend Application**: [https://cine-ai-two.vercel.app](https://cine-ai-two.vercel.app)
- **Backend Interactive API**: [https://cineai-ihm4.onrender.com/docs](https://cineai-ihm4.onrender.com/docs)
- **Deployment Guide**: See [DEPLOYMENT.md](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/DEPLOYMENT.md) for full step-by-step instructions.

---

## 📝 License

This project is licensed under the MIT License — free to use, modify, and distribute. Created by [Vamshi Krishna](https://github.com/vamshi-2705).
