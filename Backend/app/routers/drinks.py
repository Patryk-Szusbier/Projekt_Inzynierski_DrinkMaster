import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from .users import get_current_user
from PIL import Image
from io import BytesIO

router = APIRouter()

def resize_to_1280x720(image: Image.Image):
    target_size = (1280, 720)
    image.thumbnail(target_size, Image.Resampling.LANCZOS)
    new_image = Image.new("RGB", target_size, (0, 0, 0))
    paste_x = (target_size[0] - image.width) // 2
    paste_y = (target_size[1] - image.height) // 2
    new_image.paste(image, (paste_x, paste_y))
    return new_image

# Folder do przechowywania zdjęć drinków
DRINK_PHOTOS_DIR = "drinkPhotos"
os.makedirs(DRINK_PHOTOS_DIR, exist_ok=True)

# --- Tworzenie drinka ---
@router.post("/", response_model=schemas.DrinkOut)
async def create_drink(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_public: Optional[str] = Form("false"),  # string z Form
    ingredients: Optional[str] = Form(None),  # JSON string listy składników
    image: Optional[UploadFile] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # konwersja is_public z string → bool
    is_public_bool = is_public.lower() in ("true", "1", "yes")

    # zapis zdjęcia
    image_filename = None
    if image:
        image_filename = image.filename
        file_path = os.path.join(DRINK_PHOTOS_DIR, image_filename)
        original_bytes = await image.read()
        img = Image.open(BytesIO(original_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
        resized = resize_to_1280x720(img)
        resized.save(file_path, format="JPEG")

    # Tworzenie drinka
    drink = models.Drink(
        name=name,
        description=description,
        author_id=current_user.id,
        is_public=is_public_bool,
        image_url=image_filename
    )
    db.add(drink)
    db.flush()  # żeby mieć drink.id

    # Dodanie składników
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

# --- Aktualizacja drinka ---
@router.put("/{drink_id}", response_model=schemas.DrinkOut)
async def update_drink(
    drink_id: int,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    is_public: Optional[str] = Form("true"),  # string z Form
    ingredients: Optional[str] = Form(None),
    image: Optional[UploadFile] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    drink = db.query(models.Drink).filter(models.Drink.id == drink_id).first()
    if not drink:
        raise HTTPException(status_code=404, detail="Drink not found")

    if drink.author_id != current_user.id and current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not permitted")

    # konwersja is_public z string → bool
    if isinstance(is_public, str):
        drink.is_public = is_public.lower() in ("true", "1", "yes")
    else:
        drink.is_public = bool(is_public)

    drink.name = name
    drink.description = description

    # Obsługa składników
    import json
    if ingredients:
        drink.ingredients.clear()
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

    # Obsługa zdjęcia
    if image:
        img_bytes = await image.read()
        img = Image.open(BytesIO(img_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
        resized = resize_to_1280x720(img)
        file_path = os.path.join(DRINK_PHOTOS_DIR, image.filename)
        resized.save(file_path, format="JPEG")
        drink.image_url = image.filename

    db.commit()
    db.refresh(drink)
    return drink

# --- Pozostałe endpointy bez zmian ---
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

@router.get("/available", response_model=List[schemas.DrinkOut])
def list_available_drinks(db: Session = Depends(get_db)):
    drinks = db.query(models.Drink).options(joinedload(models.Drink.ingredients)).filter(models.Drink.is_public == True).all()
    available_drinks = []

    # Pobranie wszystkich aktywnych slotów
    active_alcohol_slots = {s.ingredient_id for s in db.query(models.MachineSlot).filter(models.MachineSlot.ingredient_type == "alcohol", models.MachineSlot.active == True).all()}
    active_mixer_slots = {f.mixer_id for f in db.query(models.MachineFiller).filter(models.MachineFiller.active == True).all()}

    for drink in drinks:
        all_available = True
        for ing in drink.ingredients:
            type_value = ing.ingredient_type.value if hasattr(ing.ingredient_type, "value") else ing.ingredient_type

            if type_value == "alcohol" and ing.ingredient_id not in active_alcohol_slots:
                all_available = False
                break
            elif type_value == "mixer" and ing.ingredient_id not in active_mixer_slots:
                all_available = False
                break

        if all_available:
            available_drinks.append(drink)

    return available_drinks



@router.get("/my", response_model=List[schemas.DrinkOut])
def list_my_drinks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    drinks = (
        db.query(models.Drink)
        .options(joinedload(models.Drink.ingredients))
        .filter(models.Drink.author_id == current_user.id)
        .order_by(models.Drink.name)
        .all()
    )
    return drinks

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
    if drink.image_url:
        file_path = os.path.join("drinkPhotos", drink.image_url)
        if os.path.exists(file_path):
            os.remove(file_path)
    db.delete(drink)
    db.commit()
    return {"detail": "deleted"}
