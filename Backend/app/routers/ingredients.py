# backend/app/routers/ingredients.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from .users import get_current_user

router = APIRouter()

# Alcohols
@router.post("/alcohols", response_model=schemas.AlcoholOut)
def create_alcohol(a: schemas.AlcoholBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    obj = models.Alcohol(**a.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/alcohols", response_model=List[schemas.AlcoholOut])
def list_alcohols(db: Session = Depends(get_db)):
    return db.query(models.Alcohol).all()

# Mixers
@router.post("/mixers", response_model=schemas.MixerOut)
def create_mixer(m: schemas.MixerBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    obj = models.Mixer(**m.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/mixers", response_model=List[schemas.MixerOut])
def list_mixers(db: Session = Depends(get_db)):
    return db.query(models.Mixer).all()

# Machine slots & fillers
@router.get("/machine_slots", response_model=List[schemas.MachineSlotOut])
def list_slots(db: Session = Depends(get_db)):
    return db.query(models.MachineSlot).all()

@router.post("/machine_slots", response_model=schemas.MachineSlotOut)
def create_slot(slot_in: schemas.MachineSlotOut, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    obj = models.MachineSlot(
        slot_number=slot_in.slot_number,
        ingredient_type=slot_in.ingredient_type,
        ingredient_id=slot_in.ingredient_id,
        volume_ml=slot_in.volume_ml,
        active=slot_in.active
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/machine_fillers", response_model=List[schemas.MachineFillerOut])
def list_fillers(db: Session = Depends(get_db)):
    return db.query(models.MachineFiller).all()
