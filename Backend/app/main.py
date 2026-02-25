import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import users, drinks, ingredients, favorite_drinks, drink_frame, wifi
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="DrinkMachine API")


Base.metadata.create_all(bind=engine)

app.mount("/drinkPhotos", StaticFiles(directory="drinkPhotos"), name="drink_photos")

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
env_origins = os.getenv("CORS_ORIGINS")
platform_url = os.getenv("PLATFORM_URL")
frontend_port = os.getenv("FRONTEND_PORT")

if env_origins:
    origins = [o.strip() for o in env_origins.split(",") if o.strip()]
elif platform_url and frontend_port:
    origins = [f"http://{platform_url}:{frontend_port}"]
else:
    origins = default_origins

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
app.include_router(drink_frame.router, prefix="/frame", tags=["UART"])
app.include_router(wifi.router, prefix="/wifi", tags=["wifi"])

@app.get("/")
def read_root():
    return {"message": "DrinkMachine API is running!"}


@app.get("/health")
def health():
    return {"ok": True, "service": "DrinkMachine API"}
