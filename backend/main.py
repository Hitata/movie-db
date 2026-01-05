from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db, init_db, Actor, Category

app = FastAPI(title="Actor Database API")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic schemas
class CategoryBase(BaseModel):
    name: str


class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class ActorCreate(BaseModel):
    name: str
    category_ids: List[int] = []


class ActorResponse(BaseModel):
    id: int
    name: str
    created_at: str
    categories: List[CategoryResponse]

    class Config:
        from_attributes = True


# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()


# Category endpoints
@app.get("/api/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name).all()


@app.post("/api/categories", response_model=CategoryResponse)
def create_category(category: CategoryBase, db: Session = Depends(get_db)):
    # Check if category already exists
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_category = Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


# Actor endpoints
@app.get("/api/actors", response_model=List[ActorResponse])
def get_actors(db: Session = Depends(get_db)):
    actors = db.query(Actor).order_by(Actor.created_at.desc()).all()
    return [
        ActorResponse(
            id=a.id,
            name=a.name,
            created_at=a.created_at.isoformat(),
            categories=[CategoryResponse(id=c.id, name=c.name) for c in a.categories]
        )
        for a in actors
    ]


@app.post("/api/actors", response_model=ActorResponse)
def create_actor(actor: ActorCreate, db: Session = Depends(get_db)):
    # Get categories
    categories = db.query(Category).filter(Category.id.in_(actor.category_ids)).all()
    
    db_actor = Actor(name=actor.name, categories=categories)
    db.add(db_actor)
    db.commit()
    db.refresh(db_actor)
    
    return ActorResponse(
        id=db_actor.id,
        name=db_actor.name,
        created_at=db_actor.created_at.isoformat(),
        categories=[CategoryResponse(id=c.id, name=c.name) for c in db_actor.categories]
    )


@app.delete("/api/actors/{actor_id}")
def delete_actor(actor_id: int, db: Session = Depends(get_db)):
    actor = db.query(Actor).filter(Actor.id == actor_id).first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    db.delete(actor)
    db.commit()
    return {"message": "Actor deleted"}
