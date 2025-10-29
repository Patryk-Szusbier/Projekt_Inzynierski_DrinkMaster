from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..database import get_db
from .users import get_current_user

router = APIRouter(prefix="/drinks", tags=["Drinks"])


# --- Tworzenie drinka ---
@router.post("/", response_model=schemas.DrinkOut)
def create_drink(
    drink_in: schemas.DrinkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    drink = models.Drink(
        name=drink_in.name,
        description=drink_in.description,
        author_id=current_user.id,
        is_public=bool(drink_in.is_public),
        image_url=drink_in.image_url
    )
    db.add(drink)
    db.flush()  # potrzebne, aby mieć drink.id zanim dodamy składniki

    for ing in drink_in.ingredients or []:
        drink.ingredients.append(models.DrinkIngredient(
            ingredient_type=ing.ingredient_type,
            ingredient_id=ing.ingredient_id,
            amount_ml=ing.amount_ml,
            order_index=ing.order_index,
            note=ing.note
        ))

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

    db.delete(drink)
    db.commit()
    return {"detail": "deleted"}


# --- Lista drinków, które da się przygotować na podstawie aktywnych składników ---
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
