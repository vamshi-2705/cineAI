# 🚀 CineAI — Full Deployment Guide

This guide walks you through deploying **CineAI** to production for free:
- **Backend (FastAPI + Machine Learning)** ➔ [Render](https://render.com)
- **Frontend (React + Vite)** ➔ [Vercel](https://vercel.com)

---

## 📋 Prerequisites

Before starting, ensure you have:
1. A **GitHub account** with this repository pushed.
2. A **Render account** (free at [render.com](https://render.com)).
3. A **Vercel account** (free at [vercel.com](https://vercel.com)).
4. A **TMDB API Key** (free at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)).

---

## 📦 Step 1: Push Project to GitHub

Make sure your latest code and `movies.pkl` artifact are pushed to GitHub:

```bash
git add .
git commit -m "Add deployment configs for Render & Vercel"
git push origin main
```

> **Note**: `movies.pkl` (2.7 MB) is committed to Git so Render loads movie tags and computes the similarity matrix in RAM in ~4 seconds on boot without requiring huge binary artifacts or CSV raw data.

---

## 🐍 Step 2: Deploy Backend to Render

1. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `cineai-backend` (or your preferred name)
   - **Region**: Select closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   - `TMDB_API_KEY` = `your_tmdb_api_key_here`
   - `PYTHON_VERSION` = `3.10.12`
5. Click **Create Web Service**.

Render will build and start your FastAPI backend. Once deployed, note down your Render Backend URL (e.g. `https://cineai-backend.onrender.com`).

### Verify Backend
Open `https://<your-render-app>.onrender.com/docs` in your browser. You should see the interactive OpenAPI documentation!

---

## ⚛️ Step 3: Deploy Frontend to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** ➔ **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<your-render-app>.onrender.com/api` *(Make sure to include `/api` at the end!)*
5. Click **Deploy**.

Vercel will build the frontend and generate a live URL (e.g. `https://cineai.vercel.app`).

---

## 🧪 Step 4: Test & Verify

1. Open your Vercel URL in your browser.
2. Search for movies (e.g., "Inception" or "Batman").
3. Click on a movie card to view AI recommendations, cast details, poster, and overview.
4. Try filtering by genre and adding movies to Favorites.

---

## ⚡ Technical Highlights & Optimization

- **Fast Cold Start**: `movies.pkl` (2.7 MB) contains preprocessed movie metadata. `model.py` generates the 4799×4799 similarity matrix directly in RAM on startup in ~4 seconds.
- **SPA Routing**: `client/vercel.json` contains route rewrites so refreshing `/movie/123` or `/favorites` works seamlessly without 404 errors.
- **In-Memory Caching**: Both client and server cache TMDB API responses to minimize bandwidth and external API latency.

---

## ❓ Troubleshooting

| Issue | Cause & Solution |
|-------|------------------|
| **Initial load takes 30-50s** | Render free instances spin down after 15 minutes of inactivity. The first request wakes up the container. |
| **No movie posters / details** | Check that `TMDB_API_KEY` is set correctly in Render environment variables. |
| **Network Error / CORS** | Ensure `VITE_API_URL` in Vercel ends with `/api` and has no trailing slash (e.g., `https://cineai-backend.onrender.com/api`). |
