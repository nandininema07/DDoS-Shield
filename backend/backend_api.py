import os
from dotenv import load_dotenv

# --- Load Environment Variables FIRST ---
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)

from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta
import uvicorn

# --- Middleware, DB, and other imports ---
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Text, func, cast, case, Boolean
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client
from chatbot_service import get_chatbot_response

# --- Database Configuration ---
DATABASE_URL = "postgresql://user:password@localhost:5432/ddos_shield_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---
class FlowLogDB(Base):
    __tablename__ = "flow_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_ip = Column(String, index=True)
    status = Column(String)
    details = Column(JSON)

class AttackLogDB(Base):
    __tablename__ = "attack_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_ip = Column(String, index=True)
    details = Column(JSON)
    email_status = Column(String, default="pending")
    call_status = Column(String, default="pending")

class BlacklistDB(Base):
    __tablename__ = "blacklist"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ChatMessageDB(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

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


# --- Pydantic Models ---
class FlowLogCreate(BaseModel):
    timestamp: datetime
    source_ip: str
    status: str
    details: Dict[str, Any]

class AttackLogCreate(BaseModel):
    timestamp: datetime
    source_ip: str
    details: Dict[str, Any]

class FlowLogRead(FlowLogCreate):
    id: int
    class Config:
        from_attributes = True

class AttackLogRead(AttackLogCreate):
    id: int
    email_status: str
    call_status: str
    class Config:
        from_attributes = True

class BlacklistItem(BaseModel):
    id: int
    ip_address: str
    reason: str
    timestamp: datetime
    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    role: str
    content: str

class ChatMessageRead(ChatMessageCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class ChatQuery(BaseModel):
    query: str

app = FastAPI(title="DDoS Detection API")
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

# --- Notification Functions ---
def send_email_alert(db: Session, log_id: int, source_ip: str, details: dict):
    status = "failed"
    try:
        SENDER_EMAIL = os.getenv("SENDER_EMAIL")
        APP_PASSWORD = os.getenv("APP_PASSWORD")
        ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
        if not all([SENDER_EMAIL, APP_PASSWORD, ADMIN_EMAIL]):
            raise ValueError("Missing email credentials.")
        
        msg_body = f"🚨 DDoS Alert!\n\nIP Address: {source_ip}.\nAttack Type: {details.get('type', 'N/A')}"
        msg = MIMEText(msg_body)
        msg["Subject"] = f"🚨 DDoS Attack Alert: {source_ip}"
        msg["From"] = SENDER_EMAIL
        msg["To"] = ADMIN_EMAIL
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.send_message(msg)
        status = "success"
    except Exception as e:
        print(f"[❌ EMAIL ERROR] {e}")
    finally:
        db.query(AttackLogDB).filter(AttackLogDB.id == log_id).update({"email_status": status})
        db.commit()
        db.close()

def send_twilio_call(db: Session, log_id: int, source_ip: str):
    status = "failed"
    try:
        TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
        TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
        TWILIO_PHONE = os.getenv("TWILIO_PHONE")
        ADMIN_PHONE = os.getenv("ADMIN_PHONE")
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE, ADMIN_PHONE]):
            raise ValueError("Missing Twilio credentials.")
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        twiml = f"<Response><Say>Alert. A D Doss attack has been detected from I P address {'. '.join(list(source_ip))}. The I P has been blocked.</Say></Response>"
        client.calls.create(twiml=twiml, to=ADMIN_PHONE, from_=TWILIO_PHONE)
        status = "success"
    except Exception as e:
        print(f"[❌ TWILIO ERROR] {e}")
    finally:
        db.query(AttackLogDB).filter(AttackLogDB.id == log_id).update({"call_status": status})
        db.commit()
        db.close()

# --- API Endpoints ---
@app.post("/api/report-attack")
def report_attack(log: AttackLogCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_log = AttackLogDB(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    existing_blacklist_item = db.query(BlacklistDB).filter(BlacklistDB.ip_address == log.source_ip).first()
    if not existing_blacklist_item:
        reason = log.details.get("type", "Generic DDoS Attack")
        db_blacklist_item = BlacklistDB(
            ip_address=log.source_ip, reason=reason, timestamp=log.timestamp
        )
        db.add(db_blacklist_item)
        background_tasks.add_task(send_email_alert, SessionLocal(), db_log.id, log.source_ip, log.details)
        background_tasks.add_task(send_twilio_call, SessionLocal(), db_log.id, log.source_ip)
        
    db.commit()
    return {"status": "Attack reported successfully"}

# ... (All other endpoints for dashboard, logs, blacklist, and chatbot)
@app.get("/")
def read_root():
    return {"status": "DDoS Detection API is running"}

@app.post("/api/log-flow")
def log_flow(flow_log: FlowLogCreate, db: Session = Depends(get_db)):
    db_flow_log = FlowLogDB(**flow_log.model_dump())
    db.add(db_flow_log)
    db.commit()
    return {"status": "Flow logged successfully"}

@app.get("/api/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_attacks = db.query(func.count(AttackLogDB.id)).scalar()
    blocked_ips = db.query(func.count(BlacklistDB.id)).scalar()
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    active_threats = db.query(func.count(func.distinct(AttackLogDB.source_ip)))\
        .filter(AttackLogDB.timestamp >= five_minutes_ago).scalar()
    return {
        "total_detected_attacks": total_attacks,
        "blocked_ips": blocked_ips,
        "active_threats": active_threats
    }

@app.get("/api/traffic-chart-data")
def get_traffic_chart_data(db: Session = Depends(get_db)):
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    attack_counts = db.query(
        func.date_trunc('hour', AttackLogDB.timestamp).label('hour'),
        func.count(AttackLogDB.id).label('attack_count')
    ).filter(AttackLogDB.timestamp >= twenty_four_hours_ago)\
     .group_by('hour')\
     .order_by('hour')\
     .all()

    chart_data = []
    for row in attack_counts:
        simulated_total_traffic = row.attack_count * (10 + (row.attack_count % 5)) + 1000
        chart_data.append({
            "time": row.hour.strftime("%H:%M"),
            "attacks": row.attack_count,
            "traffic": simulated_total_traffic 
        })
    return chart_data

@app.get("/api/live-activity-chart")
def get_live_activity_chart(db: Session = Depends(get_db)):
    # --- CHANGE: Fetch the dynamic threshold from the database ---
    user_settings = db.query(UserDB).first()
    threshold = user_settings.ddos_threshold if user_settings else 50

    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    results = db.query(
        func.date_trunc('minute', FlowLogDB.timestamp).label('minute'),
        func.count(FlowLogDB.id).label('total_flows')
    ).filter(FlowLogDB.timestamp >= one_hour_ago)\
     .group_by('minute').order_by('minute').all()

    chart_data = []
    for row in results:
        chart_data.append({
            "time": row.minute.strftime("%H:%M"),
            "traffic": row.total_flows,
            "threshold": threshold # Use the dynamic threshold
        })
    return chart_data

@app.get("/api/traffic-log", response_model=List[FlowLogRead])
def get_traffic_log(db: Session = Depends(get_db)):
    logs = db.query(FlowLogDB).order_by(FlowLogDB.timestamp.desc()).limit(200).all()
    return logs

@app.get("/api/attack-logs", response_model=List[AttackLogRead])
def get_attack_logs(db: Session = Depends(get_db)):
    # --- FIX: Restored the subquery to fetch unique logs ---
    subquery = db.query(
        AttackLogDB.source_ip,
        func.max(AttackLogDB.timestamp).label('max_timestamp')
    ).group_by(AttackLogDB.source_ip).subquery()
    logs = db.query(AttackLogDB).join(
        subquery,
        (AttackLogDB.source_ip == subquery.c.source_ip) &
        (AttackLogDB.timestamp == subquery.c.max_timestamp)
    ).order_by(AttackLogDB.timestamp.desc()).limit(10).all()
    return logs

@app.get("/api/attack-distribution-chart")
def get_attack_distribution_chart(db: Session = Depends(get_db)):
    distribution = db.query(
        cast(AttackLogDB.details['type'], String).label('attack_type'),
        func.count(AttackLogDB.id).label('count')
    ).group_by('attack_type').all()
    chart_data = [{"name": row.attack_type, "value": row.count} for row in distribution]
    return chart_data

@app.get("/api/chat-history", response_model=List[ChatMessageRead])
def get_chat_history(db: Session = Depends(get_db)):
    history = db.query(ChatMessageDB).order_by(ChatMessageDB.timestamp.asc()).all()
    return history

@app.post("/api/chatbot")
async def handle_chat(chat_query: ChatQuery, db: Session = Depends(get_db)):
    user_message = ChatMessageDB(role="user", content=chat_query.query)
    db.add(user_message)
    db.commit()

    assistant_response_content = get_chatbot_response(chat_query.query)

    assistant_message = ChatMessageDB(role="assistant", content=assistant_response_content)
    db.add(assistant_message)
    db.commit()

    return {"response": assistant_response_content}

@app.post("/api/reset-database")
def reset_database(db: Session = Depends(get_db)):
    try:
        num_flows = db.query(FlowLogDB).delete()
        num_attacks = db.query(AttackLogDB).delete()
        num_blacklist = db.query(BlacklistDB).delete()
        num_chats = db.query(ChatMessageDB).delete()
        db.commit()
        return {
            "status": "Database cleared successfully",
            "deleted_flows": num_flows,
            "deleted_attacks": num_attacks,
            "deleted_blacklist_entries": num_blacklist,
            "deleted_chat_messages": num_chats,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/blacklist", response_model=List[BlacklistItem])
def get_blacklist(db: Session = Depends(get_db)):
    items = db.query(BlacklistDB).order_by(BlacklistDB.timestamp.desc()).limit(200).all()
    return items

@app.delete("/api/blacklist/{ip_address}")
def remove_from_blacklist(ip_address: str, db: Session = Depends(get_db)):
    item_to_delete = db.query(BlacklistDB).filter(BlacklistDB.ip_address == ip_address).first()
    
    if not item_to_delete:
        raise HTTPException(status_code=404, detail="IP address not found in blacklist")
        
    db.delete(item_to_delete)
    db.commit()
    
    print(f"✅ IP address {ip_address} has been unblocked and removed from the database.")
    return {"status": "success", "message": f"IP address {ip_address} unblocked."}

if __name__ == "__main__":
    uvicorn.run("backend_api:app", host="127.0.0.1", port=8000, reload=True)
