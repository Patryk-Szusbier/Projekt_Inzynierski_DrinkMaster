from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Text, Enum, DECIMAL, DateTime
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum


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


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Alcohol(Base):
    __tablename__ = "alcohols"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    abv = Column(DECIMAL(4, 1))
    available = Column(Boolean, default=True)
    volume_ml = Column(Integer)


class Mixer(Base):
    __tablename__ = "mixers"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(Enum(MixerType), default=MixerType.other)
    available = Column(Boolean, default=True)
    volume_ml = Column(Integer)


class Drink(Base):
    __tablename__ = "drinks"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)
    image_url = Column(Text)

    author = relationship("User")
    ingredients = relationship(
        "DrinkIngredient",
        back_populates="drink",
        cascade="all, delete-orphan"
    )


class DrinkIngredient(Base):
    __tablename__ = "drink_ingredients"
    id = Column(Integer, primary_key=True)
    drink_id = Column(Integer, ForeignKey("drinks.id"))
    ingredient_type = Column(Enum(IngredientType), nullable=False)
    ingredient_id = Column(Integer, nullable=False)
    amount_ml = Column(Integer, nullable=False)
    order_index = Column(Integer)
    note = Column(Text)

    drink = relationship("Drink", back_populates="ingredients")



class FavoriteDrink(Base):
    __tablename__ = "favorite_drinks"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    drink_id = Column(Integer, ForeignKey("drinks.id"), primary_key=True)


class MachineSlot(Base):
    __tablename__ = "machine_slots"
    id = Column(Integer, primary_key=True)
    slot_number = Column(Integer, nullable=False, unique=True)
    ingredient_type = Column(Enum(IngredientType), nullable=False)
    ingredient_id = Column(Integer, nullable=False)
    volume_ml = Column(Integer)
    active = Column(Boolean, default=True)


class MachineFiller(Base):
    __tablename__ = "machine_fillers"
    id = Column(Integer, primary_key=True)
    slot_number = Column(Integer, nullable=False, unique=True)
    mixer_id = Column(Integer, ForeignKey("mixers.id"))
    volume_ml = Column(Integer)
    active = Column(Boolean, default=True)
