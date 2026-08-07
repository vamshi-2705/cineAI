import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FavoritesProvider } from './context/FavoritesContext.jsx'

function App() {
  return (
    <FavoritesProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes will be added in Day 5+ */}
          <Route path="/" element={
            <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>
              <h1>🎬 CineAI</h1>
              <p style={{ color: '#94a3b8', marginTop: '8px' }}>
                AI-powered movie recommendations — coming soon
              </p>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </FavoritesProvider>
  )
}

export default App
