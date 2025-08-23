import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)

from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from passlib.context import CryptContext
from jose import jwt
import socket
from urllib.parse import urlparse

# --- Security and JWT Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_for_development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Database Configuration ---
DATABASE_URL = "postgresql://user:password@localhost:5432/ddos_shield_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String)
    hashed_password = Column(String)
    website_url = Column(String, default="https://example.com")
    email_alerts = Column(Boolean, default=True)
    phone_alerts = Column(Boolean, default=False)
    ddos_threshold = Column(Integer, default=50)

Base.metadata.create_all(bind=engine, checkfirst=True)

# --- Pydantic Models ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    phone_number: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SettingsUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    website_url: Optional[str] = None
    email_alerts: Optional[bool] = None
    phone_alerts: Optional[bool] = None
    ddos_threshold: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    
class UrlRequest(BaseModel):
    url: str

# --- FastAPI App ---
app = FastAPI(title="User and Settings API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Utility Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- API Endpoints ---
@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(UserDB).filter(UserDB.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = UserDB(
        username=user.username,
        email=user.email,
        phone_number=user.phone_number,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/api/auth/login", response_model=Token)
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    user = db.query(UserDB).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "profile": {"name": user.username, "email": user.email, "phone": user.phone_number},
        "website": {"url": user.website_url},
        "alerts": {"emailAlerts": user.email_alerts, "phoneAlerts": user.phone_alerts},
        "advanced": {"ddosThreshold": user.ddos_threshold}
    }

@app.put("/api/settings")
def update_settings(settings: SettingsUpdate, db: Session = Depends(get_db)):
    user = db.query(UserDB).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = settings.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    return {"message": "Settings updated successfully"}

@app.post("/api/get-ip")
def get_ip_from_url(request: UrlRequest):
    try:
        hostname = urlparse(request.url).hostname
        if not hostname:
            raise HTTPException(status_code=400, detail="Invalid URL provided")
        ip_address = socket.gethostbyname(hostname)
        return {"ip_address": ip_address}
    except socket.gaierror:
        raise HTTPException(status_code=404, detail="Could not resolve hostname")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
