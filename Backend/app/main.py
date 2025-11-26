from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import users, drinks, ingredients, favorite_drinks
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="DrinkMachine API")


Base.metadata.create_all(bind=engine)

app.mount("/drinkPhotos", StaticFiles(directory="drinkPhotos"), name="drink_photos")

origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      
    allow_credentials=True,     
    allow_methods=["*"],         
    allow_headers=["*"],        
)
# -----------------------------

# Dodanie routerów
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(drinks.router, prefix="/drinks", tags=["drinks"])
app.include_router(ingredients.router, prefix="/ingredients", tags=["ingredients"])
app.include_router(favorite_drinks.router, prefix="/favorite_drinks", tags=["favorite_drinks"])

@app.get("/")
def read_root():
    return {"message": "DrinkMachine API is running!"}
