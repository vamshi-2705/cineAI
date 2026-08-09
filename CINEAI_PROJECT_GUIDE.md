# CINEAI — COMPLETE PROJECT GUIDE

---

## 1. PROJECT OVERVIEW

### What CineAI Is
**CineAI** is a full-stack, AI-powered movie recommendation web application. It combines a machine learning recommendation engine built with Python and FastAPI on the backend with a modern, responsive single-page application (SPA) built using React, Vite, and React Router on the frontend.

### What Problem It Solves
With thousands of movies available across streaming services, users experience "choice paralysis" (struggling to pick a movie to watch). Traditional search engines only match exact titles or keywords. CineAI analyzes the deeper semantic attributes of movies—combining plot overviews, genres, directors, cast members, and keywords into high-dimensional feature vectors—to compute mathematical similarity scores using **Cosine Similarity**. This allows users to discover movies that match the style, atmosphere, and themes of their favorite titles.

### Who Would Use It
- **Movie Enthusiasts**: Seeking personalized recommendations similar to specific titles they love.
- **Casual Viewers**: Browsing popular/trending movies or filtering by specific genres.
- **Film Buffs**: Researching movie details, cast members, runtime, and financial performance (budget/revenue).

### Main Purpose
To provide instant, high-quality content-based movie recommendations, title search across a 5,000-movie dataset, detailed film metadata via external TMDB integration, and client-side favorite movie management.

### Main Features
1. **Title Search**: Debounced live search with dropdown suggestions and keyboard navigation (Arrow keys + Enter).
2. **Content-Based AI Recommendations**: Cosine similarity computation returning top-N matching movies with similarity percentage badges.
3. **Personalized Favorite Recommendations**: Aggregates top favorite titles saved by the user and computes multi-movie personalized recommendations.
4. **Genre Filtering**: Dynamic genre filter pills for both the general catalog and movie-specific recommendations.
5. **Rich Movie Details**: High-resolution backdrops, posters, ratings, status, runtime, tagline, plot overview, financial metrics, and cast profile photos.
6. **Favorites Persistence**: Client-side storage via `localStorage` with real-time UI badge counters.
7. **Responsive UI**: Glassmorphic dark design system with animated skeletons, hover effects, and full mobile optimization.

### Overall Architecture
CineAI follows a decoupled client-server architecture:
- **Frontend (Client)**: React 19 SPA bundled with Vite 8. Communicates asynchronously with the backend via Axios.
- **Backend (Server)**: FastAPI (Python 3) application serving RESTful JSON endpoints. Uses Scikit-learn, Pandas, and NumPy for machine learning calculations.
- **External Data & API**: Kaggle TMDB 5,000 dataset for offline machine learning model training; live TMDB REST API v3 calls for dynamic poster/backdrop images and cast profiles.

---

### 30-SECOND INTERVIEW EXPLANATION

> "CineAI is a full-stack movie recommendation platform I built using FastAPI, Scikit-learn, and React. On the backend, it uses a content-based filtering model that vectorizes movie overviews, genres, cast, and directors using CountVectorizer and computes cosine similarity across 5,000 movies. On the frontend, it’s a responsive React application built with Vite and Axios featuring live debounced search, genre filtering, rich TMDB movie details, and client-side favorites persistence using React Context and localStorage."

---

### 2-MINUTE INTERVIEW EXPLANATION

> "I built CineAI to address choice paralysis in movie selection using content-based machine learning. 
> 
> On the data and machine learning side, I built a data pipeline in Python using Pandas that processes the TMDB 5,000 dataset. It combines textual metadata—plot overview, genres, top cast, keywords, and director—into a single normalized tag representation per movie. Using Scikit-learn's CountVectorizer with 5,000 features and stop-word removal, each movie is converted into a word-frequency vector. I then compute a 4,799 × 4,799 Cosine Similarity matrix. To optimize cloud memory and deployment speed on platforms like Render, I optimized the matrix to 32-bit float precision, cutting memory consumption down to 87 MB so the similarity calculations can load instantly into RAM on startup without needing heavy external databases.
> 
> The backend is built with FastAPI and Uvicorn/Gunicorn. It exposes RESTful JSON endpoints for title searching, popular movies, single-movie recommendations, and personalized multi-favorite recommendations. It also integrates asynchronously with the TMDB API to fetch live poster images, high-res backdrops, and cast profile photos, using an in-memory TTL cache to minimize external network requests.
> 
> The frontend is a React 19 application bundled with Vite. It features a sticky navigation bar with a debounced live search bar supporting keyboard navigation, dynamic genre filter pills, animated skeleton loading states, and a customized dark glassmorphic CSS design system. State for favorite movies is managed globally using React Context and synchronized with localStorage so saved movies persist across page reloads. The entire app is deployed across Render for the Python API and Vercel for the React SPA."

---

## 2. COMPLETE FEATURE LIST

### 1. Title Search
- **What it does**: Allows users to type any query (minimum 2 characters) and receive real-time drop-down movie suggestions with poster thumbnails, release year, and star ratings.
- **Why it exists**: Enables instant navigation to any movie in the 5,000-movie catalog without re-rendering the whole page.
- **Where implemented**: [SearchBar.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/components/SearchBar.jsx), [api.js](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/utils/api.js), [main.py](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/backend/main.py).
- **How it works internally**: Input triggers `setQuery`. A `useEffect` hook debounces input by 300ms before calling `searchMovies(query, limit)`. The backend runs a case-insensitive substring search on movie titles using Pandas (`str.contains`) and fetches TMDB posters in parallel using `ThreadPoolExecutor`.

### 2. Content-Based AI Recommendations
- **What it does**: Generates a list of the top N (default 10 or 12) most similar movies for any selected film, accompanied by a similarity percentage match badge (e.g., "86% match").
- **Why it exists**: Core value proposition of the app—helps users discover new films based on semantic similarity to a movie they already like.
- **Where implemented**: [model.py](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/backend/model.py), [main.py](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/backend/main.py), [MoviePage.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/pages/MoviePage.jsx), [MovieCard.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/components/MovieCard.jsx).
- **How it works internally**: When a movie page loads, `getRecommendations(movieId)` requests recommendations from FastAPI. `model.py` looks up the movie index in `movies_df`, retrieves the similarity vector from the Cosine Similarity matrix, sorts top indices descending, filters out the requested movie itself, and maps indices back to movie objects.

### 3. Personalized Favorites Recommendations ("You Might Also Like")
- **What it does**: Takes the user's top saved favorite movies and generates an aggregated list of recommended movies on the Favorites page.
- **Why it exists**: Provides personalized suggestions tailored to the user's collective taste rather than just a single movie.
- **Where implemented**: [FavoritesPage.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/pages/FavoritesPage.jsx), [main.py](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/backend/main.py), [model.py](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/backend/model.py).
- **How it works internally**: `FavoritesPage` extracts titles from up to 5 favorite movies and calls `GET /api/movies/recommend/by-titles?titles=...`. On the backend, `get_recommendations()` calculates similarity vectors for each favorite title, averages the similarity vectors across all favorites, sorts the results, excludes input favorites, and returns top recommendations.

### 4. Genre Filtering
- **What it does**: Allows users to filter popular movies on the Home Page or AI recommendations on the Movie Page by genre pills (e.g., Action, Sci-Fi, Drama).
- **Why it exists**: Helps users narrow down suggestions to match their current mood or preference.
- **Where implemented**: [HomePage.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/pages/HomePage.jsx), [MoviePage.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/pages/MoviePage.jsx), [main.py](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/backend/main.py).
- **How it works internally**: On `HomePage`, genre filtering is done client-side by checking if `movie.genres` includes the selected pill. On `MoviePage`, passing a genre parameter to `getRecommendations(id, genre)` sends `?genre=Action` to FastAPI, which filters recommendations on the backend before returning JSON.

### 5. Favorites Management & Persistence
- **What it does**: Lets users toggle movies into/out of their favorites by clicking heart icons (`❤️`/`🤍`). Displays active favorite count badges in the Navbar and persists favorites after page reloads.
- **Why it exists**: Enables users to bookmark films they want to watch later and powers personalized recommendations.
- **Where implemented**: [FavoritesContext.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/context/FavoritesContext.jsx), [Navbar.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/components/Navbar.jsx), [MovieCard.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/components/MovieCard.jsx), [FavoritesPage.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/pages/FavoritesPage.jsx).
- **How it works internally**: `FavoritesProvider` wraps the app and initializes state from `localStorage.getItem('cineai_favorites')`. A `useEffect` syncs updates back to `localStorage`. Helper functions `addFavorite`, `removeFavorite`, and `isFavorite` are exposed via `useFavorites()`.

### 6. Movie Detail View
- **What it does**: Displays comprehensive metadata for a film including full-bleed backdrop hero image, title, release year, runtime, star rating, status, genres, tagline, plot overview, budget, revenue, and top 6 cast members with photos.
- **Why it exists**: Gives users complete context on a movie before deciding to watch it.
- **Where implemented**: [MoviePage.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/pages/MoviePage.jsx), [main.py](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/backend/main.py), [api.js](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/utils/api.js).
- **How it works internally**: Page extracts `:id` from route params and calls `getMovieDetail(movieId)`. FastAPI queries local dataset metadata and fetches live details and cast from TMDB API endpoints (`/movie/{id}` and `/movie/{id}/credits`).

### 7. Responsive Navigation & Page Routing
- **What it does**: Client-side single-page routing between `/`, `/movie/:id`, `/favorites`, and catch-all `*` (404 Page).
- **Why it exists**: Delivers fast, smooth page transitions without triggering full browser reloads.
- **Where implemented**: [App.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/App.jsx), [Navbar.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/components/Navbar.jsx), [Footer.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/components/Footer.jsx), [NotFoundPage.jsx](file:///c:/Users/Vamshi/OneDrive/Documents/movie_recommendation/client/src/pages/NotFoundPage.jsx).
- **How it works internally**: React Router DOM (`BrowserRouter`, `Routes`, `Route`) matches browser path URL and renders appropriate page components while keeping `Navbar` and `Footer` mounted.

---

## 3. COMPLETE TECHNOLOGY STACK

| Technology / Library | Version | Where Used | Why Used |
|----------------------|---------|------------|----------|
| **Python** | 3.10+ | Backend (`backend/`) | Primary language for machine learning pipeline, data cleaning, and REST API server. |
| **FastAPI** | 0.104.1+ | Backend (`main.py`) | Asynchronous, high-performance Python web framework for REST API endpoints. |
| **Uvicorn / Gunicorn**| 0.24.0 / 21.2.0 | Backend deployment (`render.yaml`) | Production-grade ASGI server runner for FastAPI applications. |
| **Pandas** | 2.2.0+ | Backend (`preprocess.py`, `model.py`) | Efficient tabular data manipulation, CSV processing, and dataset filtering. |
| **NumPy** | 1.26.0+ | Backend (`model.py`) | High-performance array operations and memory-efficient matrix storage (`float32`). |
| **Scikit-learn** | 1.4.0+ | Backend (`model.py`) | Natural language processing (`CountVectorizer`) and vector similarity computation (`cosine_similarity`). |
| **Requests** | 2.31.0+ | Backend (`main.py`) | Synchronous HTTP library for backend calls to external TMDB API endpoints. |
| **Python-dotenv** | 1.0.0+ | Backend (`main.py`) | Loads environment variables (`TMDB_API_KEY`) from `.env` file during local execution. |
| **React** | 19.2.8 | Frontend (`client/src/`) | UI library for component-based user interface architecture and virtual DOM rendering. |
| **Vite** | 8.2.0+ | Frontend (`client/`) | Lightning-fast modern frontend build tool and development server. |
| **React Router DOM** | 7.11.0+ | Frontend (`App.jsx`, pages) | Client-side routing for SPA navigation (`/`, `/movie/:id`, `/favorites`). |
| **Axios** | 1.19.0+ | Frontend (`api.js`) | Promise-based HTTP client for API requests between React frontend and FastAPI backend. |
| **Vanilla CSS** | CSS3 | Frontend (`index.css`) | Custom glassmorphic styling system, CSS grid/flexbox layouts, keyframe animations. |

---

## 4. COMPLETE FOLDER STRUCTURE

```
movie_recommendation/
├── .gitignore                    # Global git ignore configuration
├── render.yaml                   # Render deployment configuration (Blueprint)
├── DEPLOYMENT.md                 # Complete step-by-step production deployment guide
├── README.md                     # Project overview and instructions
│
├── backend/                      # Python FastAPI ML Backend
│   ├── .env                      # Local environment variables (git-ignored)
│   ├── .env.example              # Template for backend environment variables
│   ├── .gitignore                # Backend-specific git ignore file
│   ├── main.py                   # FastAPI server entry point and API route handlers
│   ├── model.py                  # ML model build/load logic & similarity calculations
│   ├── preprocess.py             # Data preprocessing pipeline for TMDB dataset
│   ├── requirements.txt          # Python package dependencies
│   ├── artifacts/                # Generated ML binary files
│   │   ├── movies.pkl            # Preprocessed movies DataFrame (tracked in git)
│   │   └── similarity.pkl        # Precalculated similarity matrix (git-ignored)
│   └── data/                     # Raw dataset CSV files (optional for boot)
│       ├── tmdb_5000_movies.csv
│       └── tmdb_5000_credits.csv
│
└── client/                       # React + Vite Frontend
    ├── .env                      # Local frontend environment variables (git-ignored)
    ├── .env.example              # Template for VITE_API_URL
    ├── .gitignore                # Frontend-specific git ignore file
    ├── index.html                # HTML entry document
    ├── package.json              # NPM dependencies and scripts
    ├── package-lock.json         # Locked dependency versions
    ├── tsconfig.json             # JS/TS configuration
    ├── vercel.json               # Vercel SPA route rewrite rules
    ├── vite.config.js            # Vite build server configuration
    ├── public/                   # Static public assets
    └── src/                      # React source code
        ├── main.jsx              # DOM root rendering entry point
        ├── App.jsx               # Top-level application router & layout provider
        ├── index.css             # Unified CSS design system & styles
        ├── components/           # Reusable UI components
        │   ├── Navbar.jsx        # Sticky top navigation bar
        │   ├── Footer.jsx        # Footer component
        │   ├── MovieCard.jsx     # Reusable poster card component
        │   └── SearchBar.jsx     # Live debounced search input component
        ├── context/              # React Context state management
        │   └── FavoritesContext.jsx # Global favorites state & localStorage sync
        ├── pages/                # Route page components
        │   ├── HomePage.jsx      # Hero, Trending scroll row, Genre browse grid
        │   ├── MoviePage.jsx     # Detail view, cast, genre recommendations
        │   ├── FavoritesPage.jsx # Saved movies grid & personalized AI recs
        │   └── NotFoundPage.jsx  # 404 catch-all page
        └── utils/                # Utility helpers
            └── api.js            # Axios HTTP client & endpoint functions
```

---

## 5. COMPLETE APPLICATION ARCHITECTURE

```
                                USER / BROWSER
                                      │
                                      ▼
                             React SPA (Vite)
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
    User Interactions                                    React State & Hooks
 (Click, Type, Filter)                                 (useState, useEffect)
           │                                                     │
           └──────────────────────────┬──────────────────────────┘
                                      │
                                      ▼
                              Axios Client (api.js)
                                      │
                               (HTTP REST API)
                                      │
                                      ▼
                            FastAPI Server (main.py)
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
   Machine Learning Engine                             External TMDB API (v3)
      (model.py)                                       (Posters, Backdrops, Cast)
           │                                                     │
 ┌─────────┴─────────┐                                           │
 ▼                   ▼                                           │
movies.pkl   Cosine Similarity                                   │
 (2.7 MB)     Matrix (RAM)                                       │
           │                                                     │
           └──────────────────────────┬──────────────────────────┘
                                      │
                                (JSON Response)
                                      │
                                      ▼
                              React State Update
                                      │
                                      ▼
                            Virtual DOM Re-render
                                      │
                                      ▼
                                  Updated UI
```

---

## 6. WHAT HAPPENS WHEN I RUN THE PROJECT?

### 1. `npm run dev` (in `client/`)
1. **Command Execution**: Node executes `vite` command defined in `client/package.json`.
2. **Configuration Loading**: Vite reads `vite.config.js` and initializes local dev server on `http://localhost:5173`.
3. **HTML Entry**: Server opens `client/index.html`. Browser reads `<div id="root"></div>` and `<script type="module" src="/src/main.jsx"></script>`.
4. **JavaScript Entry**: `src/main.jsx` executes, imports `src/index.css`, creates React root via `createRoot(document.getElementById('root'))`, and renders `<App />`.
5. **App Initialization**: `App.jsx` mounts `<FavoritesProvider>` and `<BrowserRouter>`, rendering fixed `<Navbar />` and matching current path (`/`) to `<HomePage />`.
6. **Data Fetching**: `<HomePage />` `useEffect` fires `getPopular(20)` API call via Axios to FastAPI backend.
7. **UI Rendering**: Response arrives; `setTrending` and `setBrowse` update state, replacing skeleton loaders with rendered `<MovieCard />` components.

### 2. `uvicorn main:app --reload --port 8000` (in `backend/`)
1. **Python Script Launch**: Python invokes Uvicorn serving `app` instance inside `main.py`.
2. **Environment Setup**: `load_dotenv()` reads `.env` for `TMDB_API_KEY`.
3. **Model Loading**: Server executes `load_model()` in `model.py`:
   - Checks if `backend/artifacts/movies.pkl` exists.
   - Vectorizes 4,799 movie tags using `CountVectorizer(max_features=5000)`.
   - Computes 4799×4799 Cosine Similarity matrix in RAM formatted as `np.float32`.
4. **Server Ready**: FastAPI mounts CORS middleware allowing requests from `http://localhost:5173` and opens port 8000.

---

## 7. PACKAGE.JSON — COMPLETE EXPLANATION

```json
{
  "name": "cineai",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.5",
    "vite": "^8.2.0"
  },
  "dependencies": {
    "axios": "^1.19.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.11.0"
  }
}
```

### Scripts
- `dev`: Starts local Vite development server with instant hot module replacement (HMR).
- `build`: Bundles and minifies production assets into `client/dist/`.
- `preview`: Serves built `dist/` directory locally for production testing.

### Key Concepts
- `npm`: Node Package Manager used to install, manage, and run project scripts.
- `node_modules/`: Directory containing installed package code binaries and dependencies.
- `package-lock.json`: Automatically generated file locking exact dependency tree versions to ensure reproducible builds across environments.
- `dependencies`: Production packages required by the application runtime (`react`, `react-dom`, `react-router-dom`, `axios`).
- `devDependencies`: Development-only tooling required to build/compile code (`vite`, `@vitejs/plugin-react`).

---

## 8. ENTRY POINT — COMPLETE EXPLANATION

### File: `client/index.html`
- **Purpose**: HTML document skeleton loaded by browser.
- **Key Code**:
  ```html
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
  ```
- **Explanation**: Serves as mounting container `#root` where React attaches the DOM tree. Loads ES module entry script `/src/main.jsx`.

### File: `client/src/main.jsx`
- **Purpose**: JavaScript bootstrapper connecting React to index.html DOM.
- **Code Walkthrough**:
  ```javascript
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import './index.css'
  import App from './App.jsx'

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  ```
- **Explanation**: `createRoot` selects `#root` element, enables React StrictMode checks during development, and mounts top-level `<App />` component.

---

## 9. FILE-BY-FILE COMPLETE EXPLANATION

### FILE: `client/src/App.jsx`

#### PURPOSE
Top-level container component configuring global state providers and client-side page routing.

#### WHY THIS FILE EXISTS
Acts as the root layout shell for the React application, keeping top navigation and footer visible across all views.

#### USED BY
- `src/main.jsx`

#### IMPORTS
- `BrowserRouter`, `Routes`, `Route` from `react-router-dom`: Enables SPA routing.
- `FavoritesProvider` from `./context/FavoritesContext.jsx`: Provides favorites state context.
- `Navbar`, `Footer` from `./components/`: Global layout components.
- `HomePage`, `MoviePage`, `FavoritesPage`, `NotFoundPage` from `./pages/`: Route page views.

#### CODE WALKTHROUGH
```javascript
function App() {
  return (
    <FavoritesProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </FavoritesProvider>
  )
}
```

#### DATA FLOW
`FavoritesProvider` ➔ `BrowserRouter` ➔ `Navbar` / `Routes` (`HomePage` / `MoviePage` / `FavoritesPage`) / `Footer`.

---

### FILE: `client/src/context/FavoritesContext.jsx`

#### PURPOSE
Provides global application state for favorited movies and handles synchronization with browser `localStorage`.

#### WHY THIS FILE EXISTS
Prevents "prop drilling" by allowing any component in the application to read or update favorited movies.

#### USED BY
- `src/App.jsx`
- `src/components/Navbar.jsx`
- `src/components/MovieCard.jsx`
- `src/pages/MoviePage.jsx`
- `src/pages/FavoritesPage.jsx`

#### FUNCTIONS
- `FavoritesProvider({ children })`: Context provider wrapper component.
- `addFavorite(movie)`: Appends movie to array if not already present.
- `removeFavorite(movie_id)`: Filters out movie by ID.
- `isFavorite(movie_id)`: Returns boolean if ID exists in favorites array.
- `useFavorites()`: Custom hook returning `{ favorites, addFavorite, removeFavorite, isFavorite }`.

#### CODE WALKTHROUGH
```javascript
export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cineai_favorites') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('cineai_favorites', JSON.stringify(favorites))
  }, [favorites])
```
- `useState(() => ...)`: Lazy state initialization reading saved JSON array from `localStorage`.
- `useEffect([favorites])`: Runs whenever `favorites` state changes, serializing array to `localStorage`.

---

### FILE: `client/src/utils/api.js`

#### PURPOSE
Configures Axios HTTP client instance and exports API helper methods for communicating with FastAPI backend.

#### WHY THIS FILE EXISTS
Centralizes network endpoint URLs, request timeouts, and client-side response caching.

#### USED BY
- `src/components/SearchBar.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/MoviePage.jsx`
- `src/pages/FavoritesPage.jsx`

#### FUNCTIONS & ENDPOINTS
- `API`: Base Axios instance with `baseURL` set to `import.meta.env.VITE_API_URL || 'http://localhost:8000/api'`.
- `searchMovies(q, limit)`: `GET /movies/search?q={query}&limit={limit}`
- `getPopular(limit)`: `GET /movies/popular?limit={limit}` (cached 5 min)
- `getMovieDetail(id)`: `GET /movies/{id}` (cached 5 min)
- `getRecommendations(id, genre, n)`: `GET /movies/{id}/recommend?n={n}&genre={genre}` (cached 5 min)
- `getPersonalized(titles, n)`: `GET /movies/recommend/by-titles?titles={titles}&n={n}`

---

### FILE: `client/src/components/MovieCard.jsx`

#### PURPOSE
Renders a stylized movie poster card with rating overlay, title, year, similarity percentage badge, and favorite heart toggle button.

#### PROPS
- `movie`: Object `{ movie_id, title, vote_average, poster, similarity_score, release_date, genres }`
- `showSimilarity`: Boolean (default `false`) indicating whether to display similarity percentage badge.

#### CODE WALKTHROUGH
```javascript
export default function MovieCard({ movie, showSimilarity = false }) {
  const navigate = useNavigate()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const fav = isFavorite(movie.movie_id)
  const [imgError, setImgError] = useState(false)

  const handleFavClick = (e) => {
    e.stopPropagation() // Prevents card navigation click when heart is clicked
    fav ? removeFavorite(movie.movie_id) : addFavorite(movie)
  }
```

---

### FILE: `client/src/components/SearchBar.jsx`

#### PURPOSE
Provides a live search input field with debounce functionality, dropdown result list, and arrow key navigation.

#### IMPORTS
- `useState`, `useEffect`, `useRef`, `useCallback` from `react`.
- `useNavigate` from `react-router-dom`.
- `searchMovies` from `../utils/api`.

#### CODE WALKTHROUGH
```javascript
  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults([]); setOpen(false); return;
    }
    setLoading(true)
    try {
      const { data } = await searchMovies(q, 8)
      setResults(data.results || [])
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timerRef.current)
  }, [query, doSearch])
```

---

### FILE: `backend/main.py`

#### PURPOSE
FastAPI web application entry point defining REST API routes, CORS middleware, TMDB external API integration, and startup model loading.

#### KEY ENDPOINTS
1. `GET /`: Health check endpoint.
2. `GET /api/movies/search`: Substring search on dataset titles.
3. `GET /api/movies/popular`: Trending popular movies.
4. `GET /api/movies/{id}`: Detailed movie metadata + cast members.
5. `GET /api/movies/{id}/recommend`: Content-based AI recommendations for single movie.
6. `GET /api/movies/recommend/by-titles`: Multi-title personalized recommendations.

#### CODE WALKTHROUGH
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    global movies_df, similarity_matrix
    movies_df, similarity_matrix = load_model()
```

---

### FILE: `backend/model.py`

#### PURPOSE
Machine learning module executing `CountVectorizer` feature extraction, computing Cosine Similarity matrix, and searching/sorting recommendations.

#### FUNCTIONS
- `build_model()`: Runs preprocessing pipeline, vectorizes tags, computes cosine similarity, and dumps `.pkl` files.
- `load_model()`: Loads `movies.pkl` from `artifacts/` and computes 4,799 × 4,799 Cosine Similarity matrix in RAM using `float32` precision.
- `get_recommendations(title_or_id, n, genre_filter)`: Finds target movie vector, calculates top N cosine similarity matches, applies genre filter if specified, and returns recommended movie objects.

---

### FILE: `backend/preprocess.py`

#### PURPOSE
Data preprocessing script that cleans Kaggle TMDB 5,000 dataset CSV files (`tmdb_5000_movies.csv` and `tmdb_5000_credits.csv`).

#### PIPELINE STEPS
1. Loads raw CSV files and merges on `title`.
2. Extracts JSON string columns: `genres`, `keywords`, `cast` (top 5), `crew` (director).
3. Strips spaces from entity tokens (`"Tom Hanks"` ➔ `"TomHanks"`) so names are treated as unified single features.
4. Combines `overview` + `genres` + `keywords` + `cast` + `crew` into a single lowercase `tags` string column per movie.

---

## 10. REACT COMPONENT HIERARCHY

```
App
├── FavoritesProvider (Context)
│   └── BrowserRouter (Router)
│       ├── Navbar
│       │   ├── Link (Logo)
│       │   ├── SearchBar
│       │   └── Link (Favorites Badge)
│       │
│       ├── Routes
│       │   ├── Route (/) -> HomePage
│       │   │   ├── SearchBar (Hero)
│       │   │   ├── MovieCard (Trending Scroll Row)
│       │   │   └── MovieCard (Browse Genre Grid)
│       │   │
│       │   ├── Route (/movie/:id) -> MoviePage
│       │   │   ├── MovieCard (Recommendations Grid)
│       │   │   └── Genre Filter Pills
│       │   │
│       │   ├── Route (/favorites) -> FavoritesPage
│       │   │   ├── MovieCard (Favorites Grid)
│       │   │   └── MovieCard (Personalized Recs Grid)
│       │   │
│       │   └── Route (*) -> NotFoundPage
│       │
│       └── Footer
```

---

## 11. PROPS — COMPLETE EXPLANATION

1. `<MovieCard movie={movie} showSimilarity={true} />`
   - `movie`: Object containing movie metadata (`movie_id`, `title`, `poster`, `vote_average`, `release_date`, `genres`, `similarity_score`). Passed from parent grid/row loop down to card.
   - `showSimilarity`: Boolean indicating whether to render the top-left percentage badge (`"86% match"`).
2. `<SearchBar placeholder="Search 5,000+ movies..." onClose={handleClose} />`
   - `placeholder`: Custom text string for input placeholder.
   - `onClose`: Callback function executed when a search item is selected (used on mobile drawers).

---

## 12. STATE MANAGEMENT — COMPLETE EXPLANATION

| State Variable | File | Initial Value | Setter | Trigger / Purpose |
|----------------|------|---------------|--------|-------------------|
| `favorites` | `FavoritesContext.jsx` | `localStorage` or `[]` | `setFavorites` | Stores array of saved favorite movies; syncs to `localStorage`. |
| `query` | `SearchBar.jsx` | `""` | `setQuery` | Controlled input value for live search bar. |
| `results` | `SearchBar.jsx` | `[]` | `setResults` | Dropdown array of movie search result objects returned by API. |
| `open` | `SearchBar.jsx` | `false` | `setOpen` | Controls dropdown visibility. |
| `highlighted` | `SearchBar.jsx` | `-1` | `setHighlighted` | Index of highlighted item during keyboard arrow navigation. |
| `trending` | `HomePage.jsx` | `[]` | `setTrending` | Array of top 10 trending movies for horizontal scroll row. |
| `browse` | `HomePage.jsx` | `[]` | `setBrowse` | Array of 20 popular movies for genre browse grid. |
| `genre` | `HomePage.jsx` | `"All"` | `setGenre` | Selected genre filter pill string on Home Page. |
| `movie` | `MoviePage.jsx` | `null` | `setMovie` | Detailed metadata object for current movie. |
| `recs` | `MoviePage.jsx` / `FavoritesPage.jsx` | `[]` | `setRecs` | Array of AI recommendation objects. |

---

## 13. USEEFFECT — COMPLETE EXPLANATION

1. `FavoritesContext.jsx`: `useEffect(() => { localStorage.setItem(...) }, [favorites])`
   - Syncs favorited movies array to `localStorage` whenever `favorites` state updates.
2. `SearchBar.jsx`: `useEffect(() => { timer = setTimeout(doSearch, 300); return () => clearTimeout(timer) }, [query])`
   - Implements 300ms input debouncing to prevent spamming the backend API on every keystroke.
3. `HomePage.jsx`: `useEffect(() => { getPopular(20)... }, [])`
   - Fetches popular movies once when Home Page mounts.
4. `MoviePage.jsx`: `useEffect(() => { getMovieDetail(movieId)... }, [movieId])`
   - Fetches movie details whenever `:id` route parameter changes; resets scroll position to top.
5. `MoviePage.jsx`: `useEffect(() => { getRecommendations(movieId, genre)... }, [movieId, genre])`
   - Fetches AI recommendations whenever movie ID or active genre pill changes.

---

## 14. COMPLETE MOVIE DATA FLOW

```
User selects movie in SearchBar or clicks MovieCard
                         │
                         ▼
           React Router navigates to /movie/19995
                         │
                         ▼
             MoviePage mounts & reads id=19995
                         │
                         ▼
        api.js executes getMovieDetail(19995)
                         │
                         ▼
      HTTP GET https://cineai-ihm4.onrender.com/api/movies/19995
                         │
                         ▼
   FastAPI main.py handles request & calls TMDB API /3/movie/19995
                         │
                         ▼
  FastAPI merges TMDB poster/backdrop with dataset metadata into JSON
                         │
                         ▼
       MoviePage receives response & setMovie(data)
                         │
                         ▼
          Virtual DOM re-renders MoviePage view
```

---

## 15. INITIAL MOVIE LOAD

1. Browser requests `http://localhost:5173/`.
2. Vite serves `index.html`; React mounts `<App />` and renders `<HomePage />`.
3. `<HomePage />` initializes `loading=true` and displays skeleton loading cards.
4. `useEffect` triggers `getPopular(20)` call to FastAPI endpoint `/api/movies/popular?limit=20`.
5. FastAPI queries Pandas DataFrame `movies_df`, fetches poster URLs from TMDB API in parallel threads, and returns JSON.
6. React updates `trending` and `browse` state, clearing `loading` and rendering real `<MovieCard />` components.

---

## 16. SEARCH — COMPLETE DEEP DIVE

```
User types "bat" in SearchBar input
                │
                ▼
      onChange updates query state to "bat"
                │
                ▼
useEffect fires & sets 300ms debounce timer (clearTimeout cancels prior timer)
                │
                ▼
300ms passes -> doSearch("bat") executes
                │
                ▼
searchMovies("bat", 8) sends HTTP GET /api/movies/search?q=bat&limit=8
                │
                ▼
FastAPI executes movies_df[movies_df['title'].str.contains('bat', case=False)]
                │
                ▼
Response array setResults(data.results) & setOpen(true)
                │
                ▼
Dropdown renders result items; User can press ArrowDown / Enter to navigate
```

---

## 17. FILTERING / GENRES

On `HomePage.jsx`, filtering is client-side:
```javascript
const filtered = genre === 'All'
  ? browse
  : browse.filter((m) =>
      Array.isArray(m.genres) &&
      m.genres.some((g) => g.toLowerCase().includes(genre.toLowerCase()))
    )
```
Clicking a genre pill (e.g. `"Action"`) triggers `setGenre('Action')`, causing React to re-evaluate `filtered` array and re-render grid items instantly.

---

## 18. FAVORITES — COMPLETE DEEP DIVE

```
User clicks Heart button on MovieCard
                  │
                  ▼
handleFavClick calls addFavorite(movie) from useFavorites()
                  │
                  ▼
FavoritesContext updates favorites state: [...prev, movie]
                  │
                  ▼
FavoritesContext useEffect fires: localStorage.setItem('cineai_favorites', JSON)
                  │
                  ▼
Navbar badge counter re-renders displaying updated length (e.g., "3")
```

---

## 19. MOVIE DETAILS

Located in `MoviePage.jsx`:
- Fetches full details for `:id` from `/api/movies/{id}`.
- Displays responsive backdrop image header with radial gradient overlay.
- Renders posters, release year, runtime formatting (`"2h 42m"`), star ratings, budget/revenue formatted via `Intl.NumberFormat`, and cast profile photos.

---

## 20. RECOMMENDATIONS (MACHINE LEARNING DEEP DIVE)

### Machine Learning Model Architecture
1. **Preprocessing (`preprocess.py`)**:
   Combines movie metadata into a unified tag string:
   $$\text{tags} = \text{overview} + \text{genres} + \text{keywords} + \text{top\_5\_cast} + \text{director}$$
   Removes spaces from names so `"Christopher Nolan"` becomes `"ChristopherNolan"`.

2. **Vectorization (`CountVectorizer`)**:
   Converts tags into 5,000-dimensional bag-of-words frequency vectors, ignoring English stop-words (`"the"`, `"is"`, `"in"`).

3. **Cosine Similarity**:
   Computes the cosine of the angle between feature vectors $A$ and $B$:
   $$\text{Similarity}(A, B) = \cos(\theta) = \frac{A \cdot B}{\|A\| \|B\|}$$
   Score range: `1.0` (identical) to `0.0` (completely orthogonal/dissimilar).

4. **Memory Optimization**:
   Matrix stored as `np.float32` (87 MB RAM) to prevent memory allocation errors on cloud free tiers (Render 512 MB RAM).

---

## 21. API INTEGRATION

### FastAPI Backend Endpoints
- `GET /api/movies/search?q={query}&limit=8`
- `GET /api/movies/popular?limit=20`
- `GET /api/movies/{id}`
- `GET /api/movies/{id}/recommend?n=12&genre={genre}`
- `GET /api/movies/recommend/by-titles?titles={title1,title2}&n=12`

### External TMDB API Integration
- `GET https://api.themoviedb.org/3/movie/{id}?api_key={TMDB_API_KEY}`
- `GET https://api.themoviedb.org/3/movie/{id}/credits?api_key={TMDB_API_KEY}`
- Image URLs: `https://image.tmdb.org/t/p/w500/{poster_path}`

---

## 22. HTTP AND API CONCEPTS

- **GET**: Idempotent HTTP method used to retrieve resources from server.
- **Async / Await**: Asynchronous JavaScript syntax handling Promises cleanly without nested callbacks.
- **CORS**: Cross-Origin Resource Sharing middleware enabling browser on Vercel (`cineai.vercel.app`) to make requests to Render (`cineai-ihm4.onrender.com`).
- **Status Codes**: `200 OK` (success), `404 Not Found` (missing resource), `500 Server Error`.

---

## 23. BACKEND — FASTAPI & GUNICORN

- Serves backend API via Uvicorn ASGI server wrapped in Gunicorn worker process manager.
- Running command: `gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`
- Uses `ThreadPoolExecutor` for parallel TMDB image requests to minimize network latency.

---

## 24. DATABASE

> **"This project does not contain a relational or SQL/NoSQL database."**
> 
> It utilizes in-memory data structures (Pandas DataFrames and NumPy array matrices) loaded from serialized Python pickle files (`movies.pkl`), paired with client-side browser `localStorage` for persisting user favorites.

---

## 25. AUTHENTICATION

> **"This project does not use authentication."**
> 
> Favorites and personalizations are stored locally on the user's browser device using `localStorage`, eliminating the need for user accounts, passwords, or JWT tokens.

---

## 26. CSS / UI ARCHITECTURE

Unified styling system located in `client/src/index.css`:
- **CSS Variables**: Theme color tokens (`--bg-main`, `--card-bg`, `--accent-color`, `--text-primary`).
- **Glassmorphism**: `backdrop-filter: blur(12px)` with semi-transparent background overlays.
- **Card Grids**: CSS Grid layout (`grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`).
- **Animations**: `@keyframes fadeIn` and loading skeleton pulse animations.

---

## 27. RESPONSIVE DESIGN

- **Breakpoints**: Media queries for mobile (`@media (max-width: 640px)`), tablet (`768px`), and desktop (`1024px+`).
- **Touch Targets**: Flexible touch-friendly buttons and scrollable horizontal rows (`overflow-x: auto`) for mobile devices.

---

## 28. ERROR HANDLING

1. **Missing Movie Posters**: `MovieCard.jsx` handles image load errors via `onError={() => setImgError(true)}` to render a stylized fallback icon.
2. **Backend Timeout / Offline**: `api.js` sets a 20-second timeout. Pages render user-friendly error banners (`"Backend not connected"`) if API calls fail.
3. **Invalid Routes**: Unrecognized paths catch on `<Route path="*" element={<NotFoundPage />} />`.

---

## 29. ENVIRONMENT VARIABLES

- `TMDB_API_KEY`: Server-side secret key used by FastAPI to authenticate requests to The Movie Database API.
- `VITE_API_URL`: Client-side environment variable pointing React Axios calls to live backend API URL (`https://cineai-ihm4.onrender.com/api`).
- `PYTHON_VERSION`: Environment variable specifying Python runtime version on Render (`3.10.12`).
- `PORT`: Dynamic port number assigned automatically by Render host environment.

---

## 30. COMPLETE USER JOURNEYS

### Journey 1: Discovering & Saving a Movie
1. User lands on Home Page (`/`).
2. Browses trending scroll row or selects `"Science Fiction"` genre pill.
3. Clicks movie card for *"Interstellar"*.
4. Router navigates to `/movie/157336`.
5. User reads overview, cast, and views AI recommended films.
6. Clicks `"❤️ Add to Favorites"`. Card heart toggles red, and Navbar badge updates to `1`.
7. User refreshes browser—favorite status remains active via `localStorage`.

---

## 31. COMPLETE DATA-FLOW DIAGRAMS

### Search Data Flow
```
User Typing -> onChange -> setQuery -> 300ms Debounce -> Axios GET /api/movies/search -> FastAPI Pandas str.contains -> JSON Results -> setResults -> Dropdown UI
```

---

## 32. IMPORTANT JAVASCRIPT CONCEPTS

- **Array Methods**: `map()` (rendering lists), `filter()` (genre filtering), `some()` / `find()` (checking favorites), `flatMap()`.
- **Destructuring**: `const { favorites, addFavorite } = useFavorites()`.
- **Spread Operator**: `[...prev, movie]` (immutable state insertion).
- **Optional Chaining**: `movie.release_date?.slice(0, 4)`.

---

## 33. IMPORTANT REACT CONCEPTS

- **Virtual DOM**: Lightweight memory tree React uses to compute efficient UI updates.
- **State & Props**: Unidirectional data flow passing props down from parent pages to child components.
- **Context API**: React context providing application-wide state without prop-drilling.

---

## 34. WHY DID I USE THIS TECHNOLOGY?

- **FastAPI vs Django/Flask**: FastAPI is asynchronous, auto-generates OpenAPI docs, and is significantly faster than Flask.
- **Vite vs Create React App**: Vite uses native ES modules, providing sub-second build and dev server startup times compared to CRA.
- **Content-Based vs Collaborative Filtering**: Content-based filtering does not suffer from the "cold start problem" (works immediately without needing millions of user ratings).

---

## 35. COMMON BUGS & DEBUGGING GUIDE

1. **CORS Error in Browser Console**:
   - *Cause*: Backend missing frontend origin in `CORSMiddleware`.
   - *Fix*: Verify `allow_origins=["*"]` in `main.py`.
2. **Backend "Out of Memory" Crash on Render**:
   - *Cause*: Gunicorn running multiple worker processes exceeding 512 MB RAM limit.
   - *Fix*: Set start command to `gunicorn -w 1 ...` and cast matrix to `np.float32`.
3. **Vercel 404 Page Refresh Error**:
   - *Cause*: SPA routing requesting non-existent server file.
   - *Fix*: `client/vercel.json` rewrite rule redirecting `/(.*)` to `/index.html`.

---

## 36. PROJECT CHALLENGES

- **Cloud RAM Limits**: Managing a 4,799 × 4,799 floating-point similarity matrix within free-tier server RAM limits. Solved by converting to `float32` and using single-worker serving.
- **API Latency**: Sequential external TMDB calls slowed down responses. Solved using `ThreadPoolExecutor` concurrent threads and in-memory TTL caching.

---

## 37. HOW TO EXPLAIN MY PROJECT IN AN INTERVIEW

- **30-Second Summary**: Highlight full-stack architecture, FastAPI + React, machine learning recommendation engine.
- **Key Technical Highlights**: Content-based vectorization, cosine similarity, memory optimization (`float32`), responsive glassmorphic UI, localStorage context sync.

---

## 38. INTERVIEW QUESTIONS

### Beginner
1. **Q**: What is the difference between state and props in React?  
   **A**: Props are immutable read-only inputs passed from parent to child, while state is local mutable data managed within a component.
2. **Q**: What does `useEffect` with an empty array `[]` do?  
   **A**: Runs the effect function exactly once after the component mounts.

### Intermediate
3. **Q**: How does debouncing work in the search bar?  
   **A**: It delays calling `doSearch` until the user stops typing for 300ms, clearing previous timers on each keystroke to reduce API calls.
4. **Q**: What is Cosine Similarity and why is it used here?  
   **A**: It measures the cosine of the angle between two multi-dimensional feature vectors to evaluate how similar two movies are based on word frequencies.

### Advanced
5. **Q**: How did you optimize memory usage on cloud deployment?  
   **A**: By casting the Cosine Similarity matrix to `np.float32` (halving memory to 87MB) and configuring Gunicorn with a single worker process (`-w 1`) to fit within Render's 512MB RAM free tier.

---

## 39. CHECKLIST: QUESTIONS YOU MUST BE ABLE TO ANSWER

- [x] Can explain folder structure and entry points (`index.html`, `main.jsx`, `App.jsx`, `main.py`).
- [x] Can explain how `CountVectorizer` and `cosine_similarity` calculate recommendations.
- [x] Can trace movie data from API request down to `<MovieCard />` rendering.
- [x] Can explain how `FavoritesContext` syncs state to `localStorage`.
- [x] Can explain how `VITE_API_URL` connects Vercel frontend to Render backend.

---

## 40. FINAL CINEAI CHEAT SHEET

- **Project**: CineAI Movie Recommendation System
- **Frontend Stack**: React 19, Vite 8, React Router 7, Axios, Custom Glassmorphic CSS.
- **Backend Stack**: FastAPI, Python 3, Pandas, NumPy, Scikit-learn, Gunicorn/Uvicorn.
- **Core ML Concept**: Content-based filtering using `CountVectorizer(max_features=5000)` and `cosine_similarity` on 4,799 movies.
- **Key Files**: `main.py` (API), `model.py` (ML logic), `preprocess.py` (Data pipeline), `App.jsx` (Routes), `FavoritesContext.jsx` (Global state), `api.js` (HTTP).
- **Deployment**: Backend on Render Web Service, Frontend on Vercel SPA.
