from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models
from ..database import get_db
from ..services.uart import send_frame

router = APIRouter()

def build_drink_frame(drink_id: int, db: Session) -> list[int]:
    drink = (
        db.query(models.Drink)
        .options(joinedload(models.Drink.ingredients))
        .filter(models.Drink.id == drink_id)
        .first()
    )
    if not drink:
        raise HTTPException(status_code=404, detail="Drink not found")

    slot_list = []

    for ing in drink.ingredients:
        slot_number = None

        if ing.ingredient_type == models.IngredientType.alcohol:
            slot = (
                db.query(models.MachineSlot)
                .filter(
                    models.MachineSlot.ingredient_type == "alcohol",
                    models.MachineSlot.ingredient_id == ing.ingredient_id,
                    models.MachineSlot.active == True
                )
                .first()
            )
            if slot:
                slot_number = slot.slot_number

        elif ing.ingredient_type == models.IngredientType.mixer:
            filler = (
                db.query(models.MachineFiller)
                .filter(
                    models.MachineFiller.mixer_id == ing.ingredient_id,
                    models.MachineFiller.active == True
                )
                .first()
            )
            slot = None
            if not filler:
                slot = (
                    db.query(models.MachineSlot)
                    .filter(
                        models.MachineSlot.ingredient_type == "mixer",
                        models.MachineSlot.ingredient_id == ing.ingredient_id,
                        models.MachineSlot.active == True
                    )
                    .first()
                )

            if filler:
                slot_number = filler.slot_number
            elif slot:
                slot_number = slot.slot_number

        if slot_number is not None:
            volume_ml = min(ing.amount_ml or 0, 255)
            slot_list.append((slot_number, volume_ml))

    # sortujemy po slot_number rosnąco
    slot_list.sort(key=lambda x: x[0])

    # generujemy ramkę z 0xFF jako separatory
    frame_bytes = bytearray()
    for slot_number, volume_ml in slot_list:
        frame_bytes.extend([slot_number, volume_ml, 0xFF])

    frame_bytes.append(0xFF)

    return list(frame_bytes)


@router.get("/drink_frame/{drink_id}")
def get_drink_frame(drink_id: int, db: Session = Depends(get_db)):
    frame = build_drink_frame(drink_id, db)
    return {"frame": frame}


@router.post("/drink_frame/{drink_id}/send")
def send_drink_frame(drink_id: int, db: Session = Depends(get_db)):
    frame = build_drink_frame(drink_id, db)
    try:
        send_frame(bytes(frame))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"sent": True, "frame": frame, "length": len(frame)}
