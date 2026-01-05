# Actor Database

A mobile-first web app for managing actors and their categories.

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

## Features

- Add actors with multiple categories
- Create new categories on the fly
- Mobile-first responsive design
- SQLite database (no setup required)

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + Vite
