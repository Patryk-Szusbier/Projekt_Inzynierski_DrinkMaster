# backend/app/main.py
from fastapi import FastAPI
from .database import engine, Base
from .routers import users, drinks, ingredients
from .routers import favorite_drinks
app = FastAPI(title="DrinkMachine API")

Base.metadata.create_all(bind=engine)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(drinks.router, prefix="/drinks", tags=["drinks"])
app.include_router(ingredients.router, prefix="/ingredients", tags=["ingredients"])
app.include_router(favorite_drinks.router, prefix="/favorite_drinks", tags=["favorite_drinks"])

@app.get("/")
def read_root():
    return {"message": "DrinkMachine API is running!"}
