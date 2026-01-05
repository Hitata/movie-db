from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db, init_db, Actor, Movie, Feature, FeatureType

app = FastAPI(title="Movie Database API")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic schemas
class FeatureTypeResponse(BaseModel):
    id: int
    name: str
    shade: str
    feature_id: int

    class Config:
        from_attributes = True


class FeatureTypeUpdate(BaseModel):
    name: str


class FeatureResponse(BaseModel):
    id: int
    name: str
    color: str
    order: int
    types: List[FeatureTypeResponse]

    class Config:
        from_attributes = True


class FeatureUpdate(BaseModel):
    name: Optional[str] = None
    order: Optional[int] = None


class FeaturesReorder(BaseModel):
    feature_ids: List[int]  # ordered list of feature IDs


class ActorCreate(BaseModel):
    name: str
    feature_type_ids: List[int] = []


class ActorResponse(BaseModel):
    id: int
    name: str
    created_at: str
    feature_types: List[FeatureTypeResponse]

    class Config:
        from_attributes = True


class MovieCreate(BaseModel):
    code: str
    name: str
    actor_ids: List[int] = []
    feature_type_ids: List[int] = []


class MovieResponse(BaseModel):
    id: int
    code: str
    name: str
    created_at: str
    actors: List[ActorResponse]
    feature_types: List[FeatureTypeResponse]

    class Config:
        from_attributes = True


# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()


# Feature endpoints
@app.get("/api/features", response_model=List[FeatureResponse])
def get_features(db: Session = Depends(get_db)):
    features = db.query(Feature).order_by(Feature.order).all()
    return [
        FeatureResponse(
            id=f.id,
            name=f.name,
            color=f.color,
            order=f.order,
            types=[FeatureTypeResponse(id=t.id, name=t.name, shade=t.shade, feature_id=t.feature_id) for t in sorted(f.types, key=lambda x: ["light", "middle", "dark"].index(x.shade))]
        )
        for f in features
    ]


@app.patch("/api/features/{feature_id}", response_model=FeatureResponse)
def update_feature(feature_id: int, update: FeatureUpdate, db: Session = Depends(get_db)):
    feature = db.query(Feature).filter(Feature.id == feature_id).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    if update.name is not None:
        feature.name = update.name
    if update.order is not None:
        feature.order = update.order
    
    db.commit()
    db.refresh(feature)
    
    return FeatureResponse(
        id=feature.id,
        name=feature.name,
        color=feature.color,
        order=feature.order,
        types=[FeatureTypeResponse(id=t.id, name=t.name, shade=t.shade, feature_id=t.feature_id) for t in sorted(feature.types, key=lambda x: ["light", "middle", "dark"].index(x.shade))]
    )


@app.post("/api/features/reorder")
def reorder_features(reorder: FeaturesReorder, db: Session = Depends(get_db)):
    for idx, feature_id in enumerate(reorder.feature_ids):
        feature = db.query(Feature).filter(Feature.id == feature_id).first()
        if feature:
            feature.order = idx + 1
    db.commit()
    return {"message": "Features reordered"}


@app.patch("/api/feature-types/{type_id}", response_model=FeatureTypeResponse)
def update_feature_type(type_id: int, update: FeatureTypeUpdate, db: Session = Depends(get_db)):
    feature_type = db.query(FeatureType).filter(FeatureType.id == type_id).first()
    if not feature_type:
        raise HTTPException(status_code=404, detail="Feature type not found")
    
    feature_type.name = update.name
    db.commit()
    db.refresh(feature_type)
    
    return FeatureTypeResponse(
        id=feature_type.id,
        name=feature_type.name,
        shade=feature_type.shade,
        feature_id=feature_type.feature_id
    )


# Actor endpoints
@app.get("/api/actors", response_model=List[ActorResponse])
def get_actors(db: Session = Depends(get_db)):
    actors = db.query(Actor).order_by(Actor.created_at.desc()).all()
    return [
        ActorResponse(
            id=a.id,
            name=a.name,
            created_at=a.created_at.isoformat(),
            feature_types=[FeatureTypeResponse(id=ft.id, name=ft.name, shade=ft.shade, feature_id=ft.feature_id) for ft in a.feature_types]
        )
        for a in actors
    ]


@app.post("/api/actors", response_model=ActorResponse)
def create_actor(actor: ActorCreate, db: Session = Depends(get_db)):
    feature_types = db.query(FeatureType).filter(FeatureType.id.in_(actor.feature_type_ids)).all()
    
    db_actor = Actor(name=actor.name, feature_types=feature_types)
    db.add(db_actor)
    db.commit()
    db.refresh(db_actor)
    
    return ActorResponse(
        id=db_actor.id,
        name=db_actor.name,
        created_at=db_actor.created_at.isoformat(),
        feature_types=[FeatureTypeResponse(id=ft.id, name=ft.name, shade=ft.shade, feature_id=ft.feature_id) for ft in db_actor.feature_types]
    )


@app.delete("/api/actors/{actor_id}")
def delete_actor(actor_id: int, db: Session = Depends(get_db)):
    actor = db.query(Actor).filter(Actor.id == actor_id).first()
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    
    db.delete(actor)
    db.commit()
    return {"message": "Actor deleted"}


# Movie endpoints
@app.get("/api/movies", response_model=List[MovieResponse])
def get_movies(db: Session = Depends(get_db)):
    movies = db.query(Movie).order_by(Movie.created_at.desc()).all()
    return [
        MovieResponse(
            id=m.id,
            code=m.code,
            name=m.name,
            created_at=m.created_at.isoformat(),
            actors=[
                ActorResponse(
                    id=a.id,
                    name=a.name,
                    created_at=a.created_at.isoformat(),
                    feature_types=[FeatureTypeResponse(id=ft.id, name=ft.name, shade=ft.shade, feature_id=ft.feature_id) for ft in a.feature_types]
                )
                for a in m.actors
            ],
            feature_types=[FeatureTypeResponse(id=ft.id, name=ft.name, shade=ft.shade, feature_id=ft.feature_id) for ft in m.feature_types]
        )
        for m in movies
    ]


@app.post("/api/movies", response_model=MovieResponse)
def create_movie(movie: MovieCreate, db: Session = Depends(get_db)):
    existing = db.query(Movie).filter(Movie.code == movie.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Movie code already exists")
    
    actors = db.query(Actor).filter(Actor.id.in_(movie.actor_ids)).all()
    feature_types = db.query(FeatureType).filter(FeatureType.id.in_(movie.feature_type_ids)).all()
    
    db_movie = Movie(code=movie.code, name=movie.name, actors=actors, feature_types=feature_types)
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    
    return MovieResponse(
        id=db_movie.id,
        code=db_movie.code,
        name=db_movie.name,
        created_at=db_movie.created_at.isoformat(),
        actors=[
            ActorResponse(
                id=a.id,
                name=a.name,
                created_at=a.created_at.isoformat(),
                feature_types=[FeatureTypeResponse(id=ft.id, name=ft.name, shade=ft.shade, feature_id=ft.feature_id) for ft in a.feature_types]
            )
            for a in db_movie.actors
        ],
        feature_types=[FeatureTypeResponse(id=ft.id, name=ft.name, shade=ft.shade, feature_id=ft.feature_id) for ft in db_movie.feature_types]
    )


@app.delete("/api/movies/{movie_id}")
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    db.delete(movie)
    db.commit()
    return {"message": "Movie deleted"}
