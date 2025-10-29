from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from .users import get_current_user

router = APIRouter()

@router.get("/", response_model=list[schemas.DrinkOut])
def list_favorites(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    favs = db.query(models.FavoriteDrink).filter(models.FavoriteDrink.user_id == current_user.id).all()
    drinks = [db.query(models.Drink).get(f.drink_id) for f in favs]
    return drinks

@router.post("/{drink_id}")
def add_favorite(drink_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.FavoriteDrink).filter(
        models.FavoriteDrink.user_id == current_user.id,
        models.FavoriteDrink.drink_id == drink_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Drink already in favorites")
    fav = models.FavoriteDrink(user_id=current_user.id, drink_id=drink_id)
    db.add(fav)
    db.commit()
    return {"detail": "Added to favorites"}

@router.delete("/{drink_id}")
def remove_favorite(drink_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    fav = db.query(models.FavoriteDrink).filter(
        models.FavoriteDrink.user_id == current_user.id,
        models.FavoriteDrink.drink_id == drink_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Drink not in favorites")
    db.delete(fav)
    db.commit()
    return {"detail": "Removed from favorites"}
