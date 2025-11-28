import os
from contextlib import contextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, ForeignKey, Integer, String, create_engine, func
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker

# Database setup
DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER', 'admin')}:"
    f"{os.getenv('POSTGRES_PASSWORD', 'password123')}"
    f"@db:5432/{os.getenv('POSTGRES_DB', 'voting_app')}"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# Models
class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True)
    name = Column(String(10), unique=True, nullable=False)


class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    surname = Column(String(50), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    postulates = Column(String, nullable=False)

    class_rel = relationship("Class")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    surname = Column(String(50), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    voting_for = Column(Integer, ForeignKey("candidates.id"), nullable=True)

    class_rel = relationship("Class")
    candidate_rel = relationship("Candidate")


# Pydantic models
class CandidateCreate(BaseModel):
    name: str
    surname: str
    class_name: str
    postulates: str


class CandidateRemove(BaseModel):
    name: str
    surname: str
    class_name: str


class UserCreate(BaseModel):
    name: str
    surname: str
    class_name: str


class VoteRequest(BaseModel):
    user_name: str
    user_surname: str
    user_class: str
    candidate_name: str
    candidate_surname: str
    candidate_class: str


class UserIdentifier(BaseModel):
    name: str
    surname: str
    class_name: str


class IsCandidateRequest(BaseModel):
    name: str
    surname: str
    class_name: str


# FastAPI app
app = FastAPI(title="Voting App")

# Allow CORS so frontend can make requests (including preflight OPTIONS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_class_id(db: Session, class_name: str) -> Optional[int]:
    class_obj = db.query(Class).filter(Class.name == class_name).first()
    return class_obj.id if class_obj else None


@app.on_event("startup")
def startup_event():
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Fill classes table
    with get_db() as db:
        existing_classes = db.query(Class).count()
        if existing_classes == 0:
            classes = [
                "1a",
                "1b",
                "1c",
                "2a",
                "2b",
                "2c",
                "3a",
                "3b",
                "3c",
                "4a",
                "4b",
                "4c",
            ]
            for class_name in classes:
                db.add(Class(name=class_name))
            db.commit()
            print("✓ Database initialized with classes")


@app.post("/get-classes")
def get_classes():
    with get_db() as db:
        classes = db.query(Class.name).all()
        return {"classes": [c[0] for c in classes]}


@app.post("/is-candidate")
def is_candidate(request: IsCandidateRequest):
    with get_db() as db:
        class_id = get_class_id(db, request.class_name)
        if not class_id:
            return {"is_candidate": False}

        candidate = (
            db.query(Candidate)
            .filter(
                Candidate.name == request.name,
                Candidate.surname == request.surname,
                Candidate.class_id == class_id,
            )
            .first()
        )

        return {"is_candidate": candidate is not None}


@app.post("/add-candidate")
def add_candidate(candidate: CandidateCreate):
    with get_db() as db:
        class_id = get_class_id(db, candidate.class_name)
        if not class_id:
            raise HTTPException(status_code=400, detail="Class not found")

        # Check if already exists
        existing = (
            db.query(Candidate)
            .filter(
                Candidate.name == candidate.name,
                Candidate.surname == candidate.surname,
                Candidate.class_id == class_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(status_code=400, detail="Candidate already exists")

        new_candidate = Candidate(
            name=candidate.name,
            surname=candidate.surname,
            class_id=class_id,
            postulates=candidate.postulates,
        )
        db.add(new_candidate)
        db.commit()

        return {"message": "Candidate added successfully"}


@app.post("/remove-candidate")
def remove_candidate(request: CandidateRemove):
    with get_db() as db:
        class_id = get_class_id(db, request.class_name)
        if not class_id:
            raise HTTPException(status_code=400, detail="Class not found")

        candidate = (
            db.query(Candidate)
            .filter(
                Candidate.name == request.name,
                Candidate.surname == request.surname,
                Candidate.class_id == class_id,
            )
            .first()
        )

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        db.delete(candidate)
        db.commit()

        return {"message": "Candidate removed successfully"}


@app.post("/get-candidates")
def get_candidates():
    with get_db() as db:
        candidates = (
            db.query(
                Candidate.name,
                Candidate.surname,
                Candidate.postulates,
                Class.name.label("class_name"),
            )
            .join(Class)
            .all()
        )

        return {
            "candidates": [
                {
                    "name": c.name,
                    "surname": c.surname,
                    "postulates": c.postulates,
                    "class": c.class_name,
                }
                for c in candidates
            ]
        }


@app.post("/add-user")
def add_user(user: UserCreate):
    with get_db() as db:
        class_id = get_class_id(db, user.class_name)
        if not class_id:
            raise HTTPException(status_code=400, detail="Class not found")

        # Check if already exists
        existing = (
            db.query(User)
            .filter(
                User.name == user.name,
                User.surname == user.surname,
                User.class_id == class_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(status_code=400, detail="User already exists")

        new_user = User(
            name=user.name, surname=user.surname, class_id=class_id, voting_for=None
        )
        db.add(new_user)
        db.commit()

        return {"message": "User added successfully"}


@app.post("/vote")
def vote(request: VoteRequest):
    with get_db() as db:
        # Get user
        user_class_id = get_class_id(db, request.user_class)
        if not user_class_id:
            raise HTTPException(status_code=400, detail="User class not found")

        user = (
            db.query(User)
            .filter(
                User.name == request.user_name,
                User.surname == request.user_surname,
                User.class_id == user_class_id,
            )
            .first()
        )

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get candidate
        candidate_class_id = get_class_id(db, request.candidate_class)
        if not candidate_class_id:
            raise HTTPException(status_code=400, detail="Candidate class not found")

        candidate = (
            db.query(Candidate)
            .filter(
                Candidate.name == request.candidate_name,
                Candidate.surname == request.candidate_surname,
                Candidate.class_id == candidate_class_id,
            )
            .first()
        )

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        user.voting_for = candidate.id
        db.commit()

        return {"message": "Vote registered successfully"}


@app.post("/unvote")
def unvote(request: UserIdentifier):
    with get_db() as db:
        class_id = get_class_id(db, request.class_name)
        if not class_id:
            raise HTTPException(status_code=400, detail="Class not found")

        user = (
            db.query(User)
            .filter(
                User.name == request.name,
                User.surname == request.surname,
                User.class_id == class_id,
            )
            .first()
        )

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.voting_for = None
        db.commit()

        return {"message": "Vote removed successfully"}


@app.post("/who-am-i-voting")
def who_am_i_voting(request: UserIdentifier):
    with get_db() as db:
        class_id = get_class_id(db, request.class_name)
        if not class_id:
            raise HTTPException(status_code=400, detail="Class not found")

        user = (
            db.query(User)
            .filter(
                User.name == request.name,
                User.surname == request.surname,
                User.class_id == class_id,
            )
            .first()
        )

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.voting_for:
            return {"voting_for": None}

        candidate = (
            db.query(Candidate, Class.name)
            .join(Class)
            .filter(Candidate.id == user.voting_for)
            .first()
        )

        if not candidate:
            return {"voting_for": None}

        return {
            "voting_for": {
                "id": candidate.Candidate.id,
                "name": candidate.Candidate.name,
                "surname": candidate.Candidate.surname,
                "class": candidate.name,
            }
        }


@app.post("/get-stats")
def get_stats():
    with get_db() as db:
        # Query: candidates with vote counts
        results = (
            db.query(
                Candidate.id,
                Candidate.name,
                Candidate.surname,
                Class.name.label("class_name"),
                Candidate.postulates,
                func.count(User.id).label("total_votes"),
            )
            .join(Class, Candidate.class_id == Class.id)
            .outerjoin(User, User.voting_for == Candidate.id)
            .group_by(Candidate.id, Class.name)
            .all()
        )

        stats = []
        for r in results:
            # Get votes per class for this candidate
            votes_per_class = (
                db.query(Class.name, func.count(User.id).label("count"))
                .join(User, User.class_id == Class.id)
                .filter(User.voting_for == r.id)
                .group_by(Class.name)
                .all()
            )

            votes_dict = {v.name: v.count for v in votes_per_class}

            stats.append(
                {
                    "name": r.name,
                    "surname": r.surname,
                    "grade": r.class_name,
                    "postulates": r.postulates,
                    "number_of_votes": r.total_votes,
                    "number_of_votes_per_class": votes_dict,
                }
            )

        return {"stats": stats}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
