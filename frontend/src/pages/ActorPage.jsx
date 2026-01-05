import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureSelector from '../components/FeatureSelector'

const API_BASE = '/api'

function ActorPage() {
  const navigate = useNavigate()
  const [actors, setActors] = useState([])
  const [features, setFeatures] = useState([])
  const [name, setName] = useState('')
  const [selectedTypeIds, setSelectedTypeIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [actorRes, featureRes] = await Promise.all([
        fetch(`${API_BASE}/actors`),
        fetch(`${API_BASE}/features`)
      ])
      setActors(await actorRes.json())
      setFeatures(await featureRes.json())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddActor = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const res = await fetch(`${API_BASE}/actors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), feature_type_ids: selectedTypeIds })
      })
      if (res.ok) {
        const newActor = await res.json()
        setActors([newActor, ...actors])
        setName('')
        setSelectedTypeIds([])
      }
    } catch (err) {
      console.error('Failed to add actor:', err)
    }
  }

  const handleDeleteActor = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/actors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setActors(actors.filter(a => a.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete actor:', err)
    }
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
        <h1>Actors</h1>
      </header>

      <main>
        <form onSubmit={handleAddActor} className="add-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Actor name..."
            className="name-input"
            autoFocus
          />

          <div className="feature-section">
            <FeatureSelector
              features={features}
              setFeatures={setFeatures}
              selectedTypeIds={selectedTypeIds}
              onToggleType={toggleType}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={!name.trim()}>
            Add Actor
          </button>
        </form>

        <div className="item-list">
          <h2>All Actors ({actors.length})</h2>
          
          {actors.length === 0 ? (
            <p className="empty">No actors yet. Add your first one!</p>
          ) : (
            actors.map(actor => (
              <div key={actor.id} className="item-card">
                <div className="item-info">
                  <span className="item-name">{actor.name}</span>
                  <div className="item-features">
                    {actor.feature_types.map(ft => {
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
                  onClick={() => handleDeleteActor(actor.id)}
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

export default ActorPage
