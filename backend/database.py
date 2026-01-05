from sqlalchemy import create_engine, Column, Integer, String, DateTime, Table, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./moviedb.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Association table for Movie-Actor (many-to-many)
movie_actor = Table(
    "movie_actor",
    Base.metadata,
    Column("movie_id", Integer, ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True),
    Column("actor_id", Integer, ForeignKey("actors.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for Actor-FeatureType (many-to-many)
actor_feature_type = Table(
    "actor_feature_type",
    Base.metadata,
    Column("actor_id", Integer, ForeignKey("actors.id", ondelete="CASCADE"), primary_key=True),
    Column("feature_type_id", Integer, ForeignKey("feature_types.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for Movie-FeatureType (many-to-many)
movie_feature_type = Table(
    "movie_feature_type",
    Base.metadata,
    Column("movie_id", Integer, ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True),
    Column("feature_type_id", Integer, ForeignKey("feature_types.id", ondelete="CASCADE"), primary_key=True),
)


class Feature(Base):
    """Five elements: Fire, Earth, Metal, Water, Life"""
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)  # hex color
    order = Column(Integer, nullable=False)  # 1-5 for ordering

    types = relationship("FeatureType", back_populates="feature", cascade="all, delete-orphan")


class FeatureType(Base):
    """Three types per feature: light, middle, dark"""
    __tablename__ = "feature_types"

    id = Column(Integer, primary_key=True, index=True)
    feature_id = Column(Integer, ForeignKey("features.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    shade = Column(String, nullable=False)  # light, middle, dark

    feature = relationship("Feature", back_populates="types")
    actors = relationship("Actor", secondary=actor_feature_type, back_populates="feature_types")
    movies = relationship("Movie", secondary=movie_feature_type, back_populates="feature_types")


class Actor(Base):
    __tablename__ = "actors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    movies = relationship("Movie", secondary=movie_actor, back_populates="actors")
    feature_types = relationship("FeatureType", secondary=actor_feature_type, back_populates="actors")


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    actors = relationship("Actor", secondary=movie_actor, back_populates="movies")
    feature_types = relationship("FeatureType", secondary=movie_feature_type, back_populates="movies")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Initialize default features if not exist
    db = SessionLocal()
    try:
        if db.query(Feature).count() == 0:
            default_features = [
                {"name": "Fire", "color": "#ef4444", "order": 1},      # Red
                {"name": "Earth", "color": "#eab308", "order": 2},     # Yellow
                {"name": "Metal", "color": "#f5f5f5", "order": 3},     # White
                {"name": "Water", "color": "#1e40af", "order": 4},     # Dark Blue
                {"name": "Life", "color": "#22c55e", "order": 5},      # Green
            ]
            
            for feat_data in default_features:
                feature = Feature(**feat_data)
                db.add(feature)
                db.flush()
                
                # Add three types for each feature
                for shade in ["light", "middle", "dark"]:
                    feature_type = FeatureType(
                        feature_id=feature.id,
                        name=f"{feat_data['name']} {shade.capitalize()}",
                        shade=shade
                    )
                    db.add(feature_type)
            
            db.commit()
    finally:
        db.close()
