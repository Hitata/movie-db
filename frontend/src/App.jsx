import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate()

  return (
    <div className="app">
      <header>
        <h1>Movie DB</h1>
      </header>

      <main className="home-main">
        <div className="home-buttons">
          <button 
            className="home-btn actor-btn"
            onClick={() => navigate('/actors')}
          >
            <span className="btn-icon">🎭</span>
            <span className="btn-text">Actors</span>
          </button>
          
          <button 
            className="home-btn movie-btn"
            onClick={() => navigate('/movies')}
          >
            <span className="btn-icon">🎬</span>
            <span className="btn-text">Movies</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
