import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureSelector from '../components/FeatureSelector'

const API_BASE = '/api'

function MoviePage() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [actors, setActors] = useState([])
  const [features, setFeatures] = useState([])
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [selectedActors, setSelectedActors] = useState([])
  const [selectedTypeIds, setSelectedTypeIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [movieRes, actorRes, featureRes] = await Promise.all([
        fetch(`${API_BASE}/movies`),
        fetch(`${API_BASE}/actors`),
        fetch(`${API_BASE}/features`)
      ])
      setMovies(await movieRes.json())
      setActors(await actorRes.json())
      setFeatures(await featureRes.json())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMovie = async (e) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return

    try {
      const res = await fetch(`${API_BASE}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.trim(), 
          name: name.trim(), 
          actor_ids: selectedActors,
          feature_type_ids: selectedTypeIds 
        })
      })
      if (res.ok) {
        const newMovie = await res.json()
        setMovies([newMovie, ...movies])
        setCode('')
        setName('')
        setSelectedActors([])
        setSelectedTypeIds([])
      }
    } catch (err) {
      console.error('Failed to add movie:', err)
    }
  }

  const handleDeleteMovie = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/movies/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMovies(movies.filter(m => m.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete movie:', err)
    }
  }

  const toggleActor = (actorId) => {
    setSelectedActors(prev => 
      prev.includes(actorId) 
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    )
  }

  const toggleType = (typeId) => {
    setSelectedTypeIds(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    )
  }

  // Helper to get feature info for a type
  const getFeatureForType = (typeId) => {
    for (const feature of features) {
      const type = feature.types.find(t => t.id === typeId)
      if (type) return { feature, type }
    }
    return null
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <header>
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h1>Movies</h1>
      </header>

      <main>
        <form onSubmit={handleAddMovie} className="add-form">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Movie code..."
            className="name-input"
            autoFocus
          />
          
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Movie name..."
            className="name-input"
            style={{ marginTop: '12px' }}
          />

          <div className="feature-section">
            <span className="label">Actors</span>
            <div className="actor-chips">
              {actors.map(actor => (
                <button
                  key={actor.id}
                  type="button"
                  className={`chip ${selectedActors.includes(actor.id) ? 'selected' : ''}`}
                  onClick={() => toggleActor(actor.id)}
                >
                  {actor.name}
                </button>
              ))}
              {actors.length === 0 && (
                <span className="no-items">No actors yet. Add some in the Actors page!</span>
              )}
            </div>
          </div>

          <div className="feature-section">
            <FeatureSelector
              features={features}
              setFeatures={setFeatures}
              selectedTypeIds={selectedTypeIds}
              onToggleType={toggleType}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={!code.trim() || !name.trim()}>
            Add Movie
          </button>
        </form>

        <div className="item-list">
          <h2>All Movies ({movies.length})</h2>
          
          {movies.length === 0 ? (
            <p className="empty">No movies yet. Add your first one!</p>
          ) : (
            movies.map(movie => (
              <div key={movie.id} className="item-card movie-card">
                <div className="item-info">
                  <span className="movie-code">{movie.code}</span>
                  <span className="item-name">{movie.name}</span>
                  <div className="movie-actors">
                    {movie.actors.map(actor => (
                      <span key={actor.id} className="actor-tag">{actor.name}</span>
                    ))}
                  </div>
                  <div className="item-features">
                    {movie.feature_types.map(ft => {
                      const info = getFeatureForType(ft.id)
                      return (
                        <span 
                          key={ft.id} 
                          className="feature-tag"
                          style={{ 
                            backgroundColor: info ? `${info.feature.color}33` : '#333',
                            borderColor: info ? info.feature.color : '#555',
                            color: info ? info.feature.color : '#888'
                          }}
                        >
                          {ft.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteMovie(movie.id)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default MoviePage
