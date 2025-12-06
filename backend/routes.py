from typing import Optional

from fastapi import APIRouter, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Candidate, Class, User
from schemas import (
    CandidateCreate,
    CandidateRemove,
    IsCandidateRequest,
    UserCreate,
    UserIdentifier,
    VoteRequest,
)

router = APIRouter()


def get_class_id(db: Session, class_name: str) -> Optional[int]:
    class_obj = db.query(Class).filter(Class.name == class_name).first()
    return class_obj.id if class_obj else None


@router.post("/get-classes")
def get_classes() -> dict[str, list[str]]:
    with get_db() as db:
        classes = db.query(Class.name).all()
        return {"classes": [c[0] for c in classes]}


@router.post("/is-candidate")
def is_candidate(request: IsCandidateRequest) -> dict[str, bool]:
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


@router.post("/add-candidate")
def add_candidate(candidate: CandidateCreate) -> dict[str, str]:
    with get_db() as db:
        class_id = get_class_id(db, candidate.class_name)
        if not class_id:
            raise HTTPException(status_code=400, detail="Class not found")

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


@router.post("/remove-candidate")
def remove_candidate(request: CandidateRemove) -> dict[str, str]:
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


@router.post("/get-candidates")
def get_candidates() -> dict[str, list[dict[str, str]]]:
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


@router.post("/add-user")
def add_user(user: UserCreate) -> dict[str, str]:
    with get_db() as db:
        class_id = get_class_id(db, user.class_name)
        if not class_id:
            raise HTTPException(status_code=400, detail="Class not found")

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


@router.post("/vote")
def vote(request: VoteRequest) -> dict[str, str]:
    with get_db() as db:
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


@router.post("/unvote")
def unvote(request: UserIdentifier) -> dict[str, str]:
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


@router.post("/who-am-i-voting")
def who_am_i_voting(request: UserIdentifier) -> dict[str, Optional[dict[str, str | int]]]:
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


@router.post("/get-stats")
def get_stats() -> dict[str, list[dict]]:
    with get_db() as db:
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
