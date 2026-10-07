from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, SessionLocal, engine
from app.models import Form
from app.routers.forms import router


app = FastAPI(title="Typeform Clone API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://typeform-clone-gilt-three.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Seed demo data only when the database is empty.
        if db.query(Form).count() == 0:
            from seed import seed_database
            seed_database(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}