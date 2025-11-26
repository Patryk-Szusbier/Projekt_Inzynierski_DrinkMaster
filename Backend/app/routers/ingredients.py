from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from .users import get_current_user

router = APIRouter()

# ------------------ ALCOHOLS ------------------
@router.post("/alcohols", response_model=schemas.AlcoholOut)
def create_alcohol(
    a: schemas.AlcoholBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    obj = models.Alcohol(**a.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/alcohols", response_model=List[schemas.AlcoholOut])
def list_alcohols(
    ids: Optional[str] = Query(None, description="Comma-separated list of alcohol IDs"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Alcohol)
    if ids:
        id_list = [int(x) for x in ids.split(",") if x.isdigit()]
        query = query.filter(models.Alcohol.id.in_(id_list))
    return query.all()

# ------------------ MIXERS ------------------
@router.post("/mixers", response_model=schemas.MixerOut)
def create_mixer(
    m: schemas.MixerBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    obj = models.Mixer(**m.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/mixers", response_model=List[schemas.MixerOut])
def list_mixers(
    ids: Optional[str] = Query(None, description="Comma-separated list of mixer IDs"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Mixer)
    if ids:
        id_list = [int(x) for x in ids.split(",") if x.isdigit()]
        query = query.filter(models.Mixer.id.in_(id_list))
    return query.all()

# ---------------------------------------------------------
#  MACHINE SLOTS 1–6 (ALCOHOL / MIXER)
# ---------------------------------------------------------

@router.get("/machine_slots", response_model=List[schemas.MachineSlotOut])
def list_slots(db: Session = Depends(get_db)):
    return db.query(models.MachineSlot).order_by(models.MachineSlot.slot_number).all()


@router.put("/machine_slots/{slot_number}", response_model=schemas.MachineSlotOut)
def update_slot(
    slot_number: int,
    payload: schemas.MachineSlotUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    if not (1 <= slot_number <= 6):
        raise HTTPException(status_code=400, detail="Slots 1–6 only")

    slot = db.query(models.MachineSlot).filter_by(slot_number=slot_number).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # validate ingredient type
    if payload.ingredient_type not in ("alcohol", "mixer"):
        raise HTTPException(status_code=400, detail="Invalid ingredient type")

    # validate ingredient exists
    if payload.ingredient_type == "alcohol":
        exists = db.query(models.Alcohol).filter(models.Alcohol.id == payload.ingredient_id).first()
        if not exists:
            raise HTTPException(status_code=400, detail="Alcohol not found")

    if payload.ingredient_type == "mixer":
        exists = db.query(models.Mixer).filter(models.Mixer.id == payload.ingredient_id).first()
        if not exists:
            raise HTTPException(status_code=400, detail="Mixer not found")

    slot.ingredient_type = payload.ingredient_type
    slot.ingredient_id = payload.ingredient_id
    slot.volume_ml = payload.volume_ml
    slot.active = payload.active

    db.commit()
    db.refresh(slot)
    return slot

# ---------------------------------------------------------
#  MACHINE FILLERS 7–10 (MIXERS ONLY)
# ---------------------------------------------------------

@router.get("/machine_fillers", response_model=List[schemas.MachineFillerOut])
def list_fillers(db: Session = Depends(get_db)):
    return db.query(models.MachineFiller).order_by(models.MachineFiller.slot_number).all()


@router.put("/machine_fillers/{slot_number}", response_model=schemas.MachineFillerOut)
def update_filler(
    slot_number: int,
    payload: schemas.MachineFillerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    if not (7 <= slot_number <= 10):
        raise HTTPException(status_code=400, detail="Slots 7–10 only")

    filler = db.query(models.MachineFiller).filter_by(slot_number=slot_number).first()
    if not filler:
        raise HTTPException(status_code=404, detail="Filler slot not found")

    mixer = db.query(models.Mixer).filter(models.Mixer.id == payload.mixer_id).first()
    if not mixer:
        raise HTTPException(status_code=400, detail="Mixer not found")

    filler.mixer_id = payload.mixer_id
    filler.volume_ml = payload.volume_ml
    filler.active = payload.active

    db.commit()
    db.refresh(filler)
    return filler
