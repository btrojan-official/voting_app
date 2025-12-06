from pydantic import BaseModel


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
