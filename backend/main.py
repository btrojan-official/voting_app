from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, get_db
from models import Class
from routes import router

app = FastAPI(title="Voting App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup_event() -> None:
    Base.metadata.create_all(bind=engine)

    with get_db() as db:
        existing_classes = db.query(Class).count()
        if existing_classes == 0:
            classes = [
                "1a", "1b", "1c",
                "2a", "2b", "2c",
                "3a", "3b", "3c",
                "4a", "4b", "4c",
            ]
            for class_name in classes:
                db.add(Class(name=class_name))
            db.commit()
            print("✓ Database initialized with classes")




if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
