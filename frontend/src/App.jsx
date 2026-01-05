import { useState, useEffect } from 'react'

const API_BASE = '/api'

function App() {
  const [actors, setActors] = useState([])
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [actorRes, categoryRes] = await Promise.all([
        fetch(`${API_BASE}/actors`),
        fetch(`${API_BASE}/categories`)
      ])
      setActors(await actorRes.json())
      setCategories(await categoryRes.json())
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
        body: JSON.stringify({ name: name.trim(), category_ids: selectedCategories })
      })
      if (res.ok) {
        const newActor = await res.json()
        setActors([newActor, ...actors])
        setName('')
        setSelectedCategories([])
      }
    } catch (err) {
      console.error('Failed to add actor:', err)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.trim()) return

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      })
      if (res.ok) {
        const cat = await res.json()
        setCategories([...categories, cat].sort((a, b) => a.name.localeCompare(b.name)))
        setNewCategory('')
        setShowCategoryInput(false)
      }
    } catch (err) {
      console.error('Failed to add category:', err)
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

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    )
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app">
      <header>
        <h1>Actor DB</h1>
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

          <div className="category-section">
            <div className="category-header">
              <span className="label">Categories</span>
              <button 
                type="button" 
                className="add-cat-btn"
                onClick={() => setShowCategoryInput(!showCategoryInput)}
              >
                {showCategoryInput ? '×' : '+'}
              </button>
            </div>

            {showCategoryInput && (
              <div className="new-category-form">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category..."
                  className="cat-input"
                />
                <button 
                  type="button" 
                  onClick={handleAddCategory}
                  className="save-cat-btn"
                >
                  Add
                </button>
              </div>
            )}

            <div className="category-chips">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`chip ${selectedCategories.includes(cat.id) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
              {categories.length === 0 && (
                <span className="no-cats">No categories yet. Add one above!</span>
              )}
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={!name.trim()}>
            Add Actor
          </button>
        </form>

        <div className="actor-list">
          <h2>All Actors ({actors.length})</h2>
          
          {actors.length === 0 ? (
            <p className="empty">No actors yet. Add your first one!</p>
          ) : (
            actors.map(actor => (
              <div key={actor.id} className="actor-card">
                <div className="actor-info">
                  <span className="actor-name">{actor.name}</span>
                  <div className="actor-categories">
                    {actor.categories.map(cat => (
                      <span key={cat.id} className="tag">{cat.name}</span>
                    ))}
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

export default App
