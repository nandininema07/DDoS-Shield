## Run command
# uvicorn backend_api:app --host 127.0.0.1 --port 8000 --workers 4

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

# --- Load Environment Variables ---
# Construct the path to the .env file in the project root and load it.
# This ensures all environment variables are loaded before any other module needs them.
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    print(f"Loading environment variables from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"Warning: .env file not found at '{dotenv_path}'.")


# --- Database Imports ---
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from contextlib import asynccontextmanager

# --- Notification Imports ---
import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client

# --- Chatbot Import ---
# Now we can safely import the chatbot service, as credentials are already loaded
from chatbot_service import get_chatbot_response

# --- Database Configuration ---
DATABASE_URL = "postgresql://user:password@localhost:5432/ddos_shield_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy ORM Models ---
class AttackLogDB(Base):
    __tablename__ = "attack_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_ip = Column(String, index=True)
    details = Column(JSON)

class BlacklistDB(Base):
    __tablename__ = "blacklist"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# --- Pydantic Models ---
class AttackLog(BaseModel):
    timestamp: datetime
    source_ip: str
    details: Dict[str, Any]

class BlacklistItem(BaseModel):
    ip_address: str
    reason: str
    timestamp: datetime

class ChatQuery(BaseModel):
    query: str

# --- Notification Functions ---
def send_email_alert(source_ip: str, details: dict):
    SENDER_EMAIL = os.getenv("SENDER_EMAIL")
    APP_PASSWORD = os.getenv("APP_PASSWORD")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
    if not all([SENDER_EMAIL, APP_PASSWORD, ADMIN_EMAIL]):
        print("[EMAIL ERROR] Missing email credentials.")
        return
    try:
        print(f"[EMAIL] Sending alert for IP {source_ip} to {ADMIN_EMAIL}...")
        msg_body = f"DDoS Alert!\n\nIP Address: {source_ip}.\nDetails: {details.get('type', 'N/A')}"
        msg = MIMEText(msg_body)
        msg["Subject"] = f"DDoS Attack Alert: {source_ip}"
        msg["From"] = SENDER_EMAIL
        msg["To"] = ADMIN_EMAIL
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.send_message(msg)
        print(f"[EMAIL] Sent successfully.")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")

def send_twilio_call(source_ip: str):
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE = os.getenv("TWILIO_PHONE")
    ADMIN_PHONE = os.getenv("ADMIN_PHONE")
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE, ADMIN_PHONE]):
        print("[TWILIO ERROR] Missing Twilio credentials.")
        return
    try:
        print(f"[TWILIO] Sending call to {ADMIN_PHONE}...")
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        twiml = f"<Response><Say>Alert. A D Doss attack has been detected from I P address {'. '.join(list(source_ip))}. The I P has been blocked.</Say></Response>"
        call = client.calls.create(twiml=twiml, to=ADMIN_PHONE, from_=TWILIO_PHONE)
        print(f"[TWILIO] Call initiated. SID: {call.sid}")
    except Exception as e:
        print(f"[TWILIO ERROR] {e}")

# --- FastAPI App and Endpoints ---
app = FastAPI(title="DDoS Detection API")

def get_db():
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@app.get("/")
def read_root():
    return {"status": "DDoS Detection API is running"}

@app.get("/api/attack-logs", response_model=List[AttackLog])
def get_attack_logs(db: Session = Depends(get_db)):
    logs = db.query(AttackLogDB).order_by(AttackLogDB.timestamp.desc()).limit(100).all()
    return logs

@app.get("/api/blacklist", response_model=List[BlacklistItem])
def get_blacklist(db: Session = Depends(get_db)):
    items = db.query(BlacklistDB).order_by(BlacklistDB.timestamp.desc()).limit(100).all()
    return items

@app.post("/api/report-attack")
def report_attack(log: AttackLog, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    print(f"Received attack report for IP: {log.source_ip}")
    db_log = AttackLogDB(source_ip=log.source_ip, details=log.details, timestamp=log.timestamp)
    db.add(db_log)
    existing_blacklist_item = db.query(BlacklistDB).filter(BlacklistDB.ip_address == log.source_ip).first()
    if not existing_blacklist_item:
        db_blacklist_item = BlacklistDB(ip_address=log.source_ip, reason=log.details.get("type", "High-volume attack"), timestamp=log.timestamp)
        db.add(db_blacklist_item)
        print(f"Added {log.source_ip} to the blacklist in the database.")
        background_tasks.add_task(send_email_alert, log.source_ip, log.details)
        background_tasks.add_task(send_twilio_call, log.source_ip)
    db.commit()
    return {"status": "Attack reported successfully. Notifications triggered."}

# --- Chatbot Endpoint ---
@app.post("/api/chatbot")
async def handle_chat(chat_query: ChatQuery):
    """
    Receives a query from the user, passes it to the chatbot service,
    and returns the natural language response.
    """
    print(f"Received chatbot query: '{chat_query.query}'")
    response = get_chatbot_response(chat_query.query)
    return {"response": response}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
