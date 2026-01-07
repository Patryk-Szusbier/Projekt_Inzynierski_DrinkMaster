# backend/app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

def get_password_hash(password: str):
    safe_password = password.encode("utf-8")[:72].decode("utf-8", "ignore")
    return pwd_context.hash(safe_password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = models.User(
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        email=user_in.email
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me", response_model=schemas.UserOut)
def me(current: models.User = Depends(get_current_user)):
    return current

@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    if payload.username and payload.username != current.username:
        existing = (
            db.query(models.User)
            .filter(models.User.username == payload.username)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current.username = payload.username

    if payload.email is not None:
        current.email = payload.email

    db.commit()
    db.refresh(current)
    return current

@router.put("/me/password")
def change_password(
    payload: schemas.UserPasswordChange,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"detail": "password updated"}
