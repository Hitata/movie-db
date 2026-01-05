import os
import yaml
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Table, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./moviedb.db"
FEATURES_YAML = os.path.join(os.path.dirname(__file__), "features.yaml")

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


def load_features_from_yaml():
    """Load feature configuration from YAML file"""
    if not os.path.exists(FEATURES_YAML):
        print(f"Warning: {FEATURES_YAML} not found, using defaults")
        return None
    
    with open(FEATURES_YAML, 'r') as f:
        config = yaml.safe_load(f)
    
    return config.get('features', [])


def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Initialize features from YAML if database is empty
    db = SessionLocal()
    try:
        if db.query(Feature).count() == 0:
            features_config = load_features_from_yaml()
            
            if features_config:
                # Load from YAML
                for idx, feat_data in enumerate(features_config):
                    feature = Feature(
                        name=feat_data['name'],
                        color=feat_data['color'],
                        order=idx + 1
                    )
                    db.add(feature)
                    db.flush()
                    
                    # Add three types for each feature
                    types = feat_data.get('types', {})
                    for shade in ["light", "middle", "dark"]:
                        type_name = types.get(shade)
                        # Skip empty/null type names, or use default if not provided
                        if not type_name:
                            type_name = f"{shade.capitalize()}"
                        feature_type = FeatureType(
                            feature_id=feature.id,
                            name=type_name,
                            shade=shade
                        )
                        db.add(feature_type)
            else:
                # Fallback to defaults
                default_features = [
                    {"name": "Fire", "color": "#ef4444"},
                    {"name": "Earth", "color": "#eab308"},
                    {"name": "Metal", "color": "#f5f5f5"},
                    {"name": "Water", "color": "#1e40af"},
                    {"name": "Life", "color": "#22c55e"},
                ]
                
                for idx, feat_data in enumerate(default_features):
                    feature = Feature(name=feat_data['name'], color=feat_data['color'], order=idx + 1)
                    db.add(feature)
                    db.flush()
                    
                    for shade in ["light", "middle", "dark"]:
                        feature_type = FeatureType(
                            feature_id=feature.id,
                            name=f"{feat_data['name']} {shade.capitalize()}",
                            shade=shade
                        )
                        db.add(feature_type)
            
            db.commit()
            print("Features initialized from configuration")
    finally:
        db.close()

