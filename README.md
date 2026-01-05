# Movie DB

A mobile-first web app for managing actors and movies with categories.

## Quick Start

```bash
./run.sh
```

This will:
1. Install Python dependencies
2. Install npm packages
3. Start the FastAPI backend (port 8000)
4. Start the React frontend (port 5173)

Open **http://localhost:5173** in your browser.

## Features

- **Home Page**: Choose between Actors and Movies
- **Actors Page**: Add/delete actors with categories
- **Movies Page**: Add/delete movies with code, name, actors, and categories
- Many-to-many relationships: Movies can have multiple actors, actors can be in multiple movies
- Mobile-first responsive design
- SQLite database (no setup required)

## Manual Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + Vite + React Router
