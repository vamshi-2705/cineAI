import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import MoviePage from './pages/MoviePage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function App() {
  return (
    <FavoritesProvider>
      <BrowserRouter>
        {/* Sticky navbar rendered on all pages */}
        <Navbar />
        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/movie/:id"   element={<MoviePage />} />
          <Route path="/favorites"   element={<FavoritesPage />} />
          {/* 404 catch-all */}
          <Route path="*"            element={<NotFoundPage />} />
        </Routes>
        {/* Site-wide footer */}
        <Footer />
      </BrowserRouter>
    </FavoritesProvider>
  )
}

export default App
