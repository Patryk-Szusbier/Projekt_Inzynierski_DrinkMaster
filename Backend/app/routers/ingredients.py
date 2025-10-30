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

    if not (1 <= slot_in.slot_number <= 10):
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 10")

    if slot_in.slot_number > 6 and slot_in.ingredient_type != "mixer":
        raise HTTPException(status_code=400, detail="Slots 7-10 are reserved for mixers")

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

@router.put("/machine_slots/{slot_number}", response_model=schemas.MachineSlotOut)
def update_slot(slot_number: int, slot_in: schemas.MachineSlotOut, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    slot = db.query(models.MachineSlot).filter(models.MachineSlot.slot_number == slot_number).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot_number > 6 and slot_in.ingredient_type != "mixer":
        raise HTTPException(status_code=400, detail="Slots 7-10 are reserved for mixers")

    slot.ingredient_type = slot_in.ingredient_type
    slot.ingredient_id = slot_in.ingredient_id
    slot.volume_ml = slot_in.volume_ml
    slot.active = slot_in.active

    db.commit()
    db.refresh(slot)
    return slot
