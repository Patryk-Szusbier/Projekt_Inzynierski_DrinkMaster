# backend/app/routers/drinks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from .users import get_current_user
from sqlalchemy import and_, exists
router = APIRouter()

@router.post("/", response_model=schemas.DrinkOut)
def create_drink(drink_in: schemas.DrinkCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    drink = models.Drink(
        name=drink_in.name,
        description=drink_in.description,
        author_id=current_user.id,
        is_public=bool(drink_in.is_public),
        image_url=drink_in.image_url
    )
    db.add(drink)
    db.commit()
    db.refresh(drink)

    for ing in drink_in.ingredients or []:
        di = models.DrinkIngredient(
            drink_id=drink.id,
            ingredient_type=ing.ingredient_type,  # enum value is fine
            ingredient_id=ing.ingredient_id,
            amount_ml=ing.amount_ml,
            order_index=ing.order_index,
            note=ing.note
        )
        db.add(di)
    db.commit()
    db.refresh(drink)
    return drink

@router.get("/", response_model=List[schemas.DrinkOut])
def list_public_drinks(db: Session = Depends(get_db)):
    return db.query(models.Drink).filter(models.Drink.is_public == True).all()

@router.get("/{drink_id}", response_model=schemas.DrinkOut)
def get_drink(drink_id: int, db: Session = Depends(get_db)):
    drink = db.query(models.Drink).filter(models.Drink.id == drink_id).first()
    if not drink:
        raise HTTPException(status_code=404, detail="Drink not found")
    return drink

@router.delete("/{drink_id}")
def delete_drink(drink_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    drink = db.query(models.Drink).filter(models.Drink.id == drink_id).first()
    if not drink:
        raise HTTPException(status_code=404, detail="Not found")
    if drink.author_id != current_user.id and current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not permitted")
    db.delete(drink)
    db.commit()
    return {"detail": "deleted"}

router.get("/available", response_model=list[schemas.DrinkOut])
def list_available_drinks(db: Session = Depends(get_db)):
    drinks = db.query(models.Drink).filter(models.Drink.is_public == True).all()
    available_drinks = []

    for drink in drinks:
        ingredients = db.query(models.DrinkIngredient).filter(models.DrinkIngredient.drink_id == drink.id).all()
        all_available = True
        for ing in ingredients:
            slot_exists = db.query(models.MachineSlot).filter(
                models.MachineSlot.ingredient_type == ing.ingredient_type,
                models.MachineSlot.ingredient_id == ing.ingredient_id,
                models.MachineSlot.active == True
            ).first()
            if not slot_exists:
                all_available = False
                break
        if all_available:
            available_drinks.append(drink)
    return available_drinks