from fastapi import FastAPI
from .database import engine, Base

app = FastAPI(title="DrinkMachine API")

Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "DrinkMachine API is running!"}
