import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from .users import get_current_user

router = APIRouter(prefix="/drinks", tags=["Drinks"])

# Folder do przechowywania zdjęć drinków
DRINK_PHOTOS_DIR = "drinkPhotos"
os.makedirs(DRINK_PHOTOS_DIR, exist_ok=True)


# --- Tworzenie drinka z uploadem zdjęcia ---
@router.post("/", response_model=schemas.DrinkOut)
async def create_drink(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_public: Optional[bool] = Form(False),
    ingredients: Optional[str] = Form(None),  # JSON string listy składników
    image: Optional[UploadFile] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # zapis zdjęcia
    image_filename = None
    if image:
        image_filename = image.filename
        file_path = os.path.join(DRINK_PHOTOS_DIR, image_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    # Tworzenie drinka
    drink = models.Drink(
        name=name,
        description=description,
        author_id=current_user.id,
        is_public=is_public,
        image_url=image_filename
    )
    db.add(drink)
    db.flush()  # żeby mieć drink.id

    # Dodanie składników, jeśli podano
    import json
    if ingredients:
        try:
            ing_list = json.loads(ingredients)
            for ing in ing_list:
                drink.ingredients.append(models.DrinkIngredient(
                    ingredient_type=ing["ingredient_type"],
                    ingredient_id=ing["ingredient_id"],
                    amount_ml=ing["amount_ml"],
                    order_index=ing.get("order_index"),
                    note=ing.get("note")
                ))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Błąd składników: {e}")

    db.commit()
    db.refresh(drink)
    return drink


# --- Lista publicznych drinków ---
@router.get("/", response_model=List[schemas.DrinkOut])
def list_public_drinks(db: Session = Depends(get_db)):
    drinks = (
        db.query(models.Drink)
        .options(joinedload(models.Drink.ingredients))
        .filter(models.Drink.is_public == True)
        .order_by(models.Drink.name)
        .all()
    )
    return drinks


# --- Lista drinków dostępnych na maszynie ---
@router.get("/available", response_model=List[schemas.DrinkOut])
def list_available_drinks(db: Session = Depends(get_db)):
    drinks = (
        db.query(models.Drink)
        .options(joinedload(models.Drink.ingredients))
        .filter(models.Drink.is_public == True)
        .all()
    )

    available_drinks = []

    for drink in drinks:
        all_available = True
        for ing in drink.ingredients:
            if ing.ingredient_type == models.IngredientType.alcohol:
                slot_exists = db.query(models.MachineSlot).filter(
                    models.MachineSlot.ingredient_type == "alcohol",
                    models.MachineSlot.ingredient_id == ing.ingredient_id,
                    models.MachineSlot.active == True
                ).first()
                if not slot_exists:
                    all_available = False
                    break
            elif ing.ingredient_type == models.IngredientType.mixer:
                slot_exists = db.query(models.MachineFiller).filter(
                    models.MachineFiller.mixer_id == ing.ingredient_id,
                    models.MachineFiller.active == True
                ).first()
                if not slot_exists:
                    all_available = False
                    break
        if all_available:
            available_drinks.append(drink)

    return available_drinks


# --- Pobranie konkretnego drinka ---
@router.get("/{drink_id}", response_model=schemas.DrinkOut)
def get_drink(drink_id: int, db: Session = Depends(get_db)):
    drink = (
        db.query(models.Drink)
        .options(joinedload(models.Drink.ingredients))
        .filter(models.Drink.id == drink_id)
        .first()
    )
    if not drink:
        raise HTTPException(status_code=404, detail="Drink not found")
    return drink


# --- Usuwanie drinka ---
@router.delete("/{drink_id}")
def delete_drink(
    drink_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    drink = db.query(models.Drink).filter(models.Drink.id == drink_id).first()
    if not drink:
        raise HTTPException(status_code=404, detail="Not found")
    if drink.author_id != current_user.id and current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not permitted")

    # usuń zdjęcie z serwera, jeśli istnieje
    if drink.image_url:
        file_path = os.path.join("drinkPhotos", drink.image_url)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(drink)
    db.commit()
    return {"detail": "deleted"}
