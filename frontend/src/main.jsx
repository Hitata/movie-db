import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import ActorPage from './pages/ActorPage.jsx'
import MoviePage from './pages/MoviePage.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/actors" element={<ActorPage />} />
        <Route path="/movies" element={<MoviePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
