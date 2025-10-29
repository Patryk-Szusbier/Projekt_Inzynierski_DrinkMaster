# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import enum

# --- Enums ---
class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"

class IngredientType(str, enum.Enum):
    alcohol = "alcohol"
    mixer = "mixer"

class MixerType(str, enum.Enum):
    soda = "soda"
    juice = "juice"
    syrup = "syrup"
    other = "other"

# --- Users ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    email: Optional[EmailStr] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr]
    role: RoleEnum

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --- Alcohol / Mixer ---
class AlcoholBase(BaseModel):
    name: str
    abv: Optional[float] = None
    available: Optional[bool] = True
    volume_ml: Optional[int] = None

class AlcoholOut(AlcoholBase):
    id: int
    class Config:
        from_attributes = True

class MixerBase(BaseModel):
    name: str
    type: Optional[MixerType] = MixerType.other
    available: Optional[bool] = True
    volume_ml: Optional[int] = None

class MixerOut(MixerBase):
    id: int
    class Config:
        from_attributes = True

# --- Drink & Ingredient ---
class DrinkIngredientIn(BaseModel):
    ingredient_type: IngredientType
    ingredient_id: int
    amount_ml: int
    order_index: Optional[int] = None
    note: Optional[str] = None

class DrinkIngredientOut(DrinkIngredientIn):
    id: int
    drink_id: int

    class Config:
        from_attributes = True

class DrinkCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: Optional[bool] = False
    image_url: Optional[str] = None
    ingredients: Optional[List[DrinkIngredientIn]] = []

class DrinkOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_public: bool
    image_url: Optional[str]
    author_id: Optional[int]
    ingredients: List[DrinkIngredientOut] = []  # <-- powiązanie składników

    class Config:
        from_attributes = True

# --- Machine ---
class MachineSlotOut(BaseModel):
    id: int
    slot_number: int
    ingredient_type: IngredientType
    ingredient_id: int
    volume_ml: Optional[int]
    active: bool

    class Config:
        from_attributes = True

class MachineFillerOut(BaseModel):
    id: int
    slot_number: int
    mixer_id: Optional[int]
    volume_ml: Optional[int]
    active: bool

    class Config:
        from_attributes = True
