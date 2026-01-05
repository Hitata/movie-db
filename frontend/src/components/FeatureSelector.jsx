import { useState } from 'react'

const API_BASE = '/api'

// Color utilities for shades
const getShadeColor = (baseColor, shade) => {
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  switch (shade) {
    case 'light':
      return `rgba(${r}, ${g}, ${b}, 0.3)`
    case 'middle':
      return `rgba(${r}, ${g}, ${b}, 0.6)`
    case 'dark':
      return `rgba(${r}, ${g}, ${b}, 1)`
    default:
      return baseColor
  }
}

function FeatureSelector({ features, setFeatures, selectedTypeIds, onToggleType }) {
  const [editMode, setEditMode] = useState(false)
  const [editingFeature, setEditingFeature] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [draggedFeature, setDraggedFeature] = useState(null)

  const handleFeatureEdit = async (feature) => {
    if (editValue.trim() === '') return
    
    try {
      const res = await fetch(`${API_BASE}/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() })
      })
      if (res.ok) {
        const updated = await res.json()
        setFeatures(features.map(f => f.id === feature.id ? updated : f))
      }
    } catch (err) {
      console.error('Failed to update feature:', err)
    }
    setEditingFeature(null)
  }

  const handleTypeEdit = async (type) => {
    if (editValue.trim() === '') return
    
    try {
      const res = await fetch(`${API_BASE}/feature-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() })
      })
      if (res.ok) {
        setFeatures(features.map(f => ({
          ...f,
          types: f.types.map(t => t.id === type.id ? { ...t, name: editValue.trim() } : t)
        })))
      }
    } catch (err) {
      console.error('Failed to update feature type:', err)
    }
    setEditingType(null)
  }

  const handleDragStart = (e, feature) => {
    if (!editMode) return
    setDraggedFeature(feature)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, targetFeature) => {
    e.preventDefault()
    if (!editMode || !draggedFeature || draggedFeature.id === targetFeature.id) return
  }

  const handleDrop = async (e, targetFeature) => {
    e.preventDefault()
    if (!editMode || !draggedFeature || draggedFeature.id === targetFeature.id) return
    
    const newFeatures = [...features]
    const draggedIdx = newFeatures.findIndex(f => f.id === draggedFeature.id)
    const targetIdx = newFeatures.findIndex(f => f.id === targetFeature.id)
    
    const [removed] = newFeatures.splice(draggedIdx, 1)
    newFeatures.splice(targetIdx, 0, removed)
    
    const reorderedFeatures = newFeatures.map((f, idx) => ({ ...f, order: idx + 1 }))
    setFeatures(reorderedFeatures)
    
    try {
      await fetch(`${API_BASE}/features/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_ids: reorderedFeatures.map(f => f.id) })
      })
    } catch (err) {
      console.error('Failed to reorder features:', err)
    }
    
    setDraggedFeature(null)
  }

  return (
    <div className={`feature-selector ${editMode ? 'edit-mode' : ''}`}>
      <div className="feature-selector-header">
        <span className="feature-label">features</span>
        <button
          type="button"
          className={`edit-toggle ${editMode ? 'active' : ''}`}
          onClick={() => {
            setEditMode(!editMode)
            setEditingFeature(null)
            setEditingType(null)
          }}
        >
          ✏️
        </button>
      </div>

      <div className="features-list">
        {features.map(feature => (
          <div 
            key={feature.id} 
            className={`feature-row ${draggedFeature?.id === feature.id ? 'dragging' : ''}`}
            draggable={editMode}
            onDragStart={(e) => handleDragStart(e, feature)}
            onDragOver={(e) => handleDragOver(e, feature)}
            onDrop={(e) => handleDrop(e, feature)}
          >
            {editMode && <span className="drag-handle">⋮⋮</span>}
            
            <div className="feature-content">
              {editMode && editingFeature === feature.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleFeatureEdit(feature)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFeatureEdit(feature)}
                  className="inline-edit feature-edit"
                  autoFocus
                />
              ) : (
                <span 
                  className="feature-name"
                  style={{ color: feature.color }}
                  onClick={() => {
                    if (editMode) {
                      setEditingFeature(feature.id)
                      setEditValue(feature.name)
                    }
                  }}
                >
                  {feature.name}
                </span>
              )}
              
              <div className="feature-types">
                {feature.types.map(type => (
                  editMode && editingType === type.id ? (
                    <input
                      key={type.id}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleTypeEdit(type)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTypeEdit(type)}
                      className="inline-edit type-edit"
                      autoFocus
                    />
                  ) : (
                    <button
                      key={type.id}
                      type="button"
                      className={`type-chip ${selectedTypeIds.includes(type.id) ? 'selected' : ''}`}
                      style={{
                        '--type-color': getShadeColor(feature.color, type.shade),
                        '--type-border': feature.color
                      }}
                      onClick={() => {
                        if (editMode) {
                          setEditingType(type.id)
                          setEditValue(type.name)
                        } else {
                          onToggleType(type.id)
                        }
                      }}
                      title={type.name}
                    >
                      {editMode ? type.name : type.shade.charAt(0).toUpperCase()}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeatureSelector
