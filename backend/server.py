from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, Visit, BlockedIP, TelegramAdmin, create_tables
from typing import List, Optional
import os
from datetime import datetime

# Environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/prankvz")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

# Initialize FastAPI
app = FastAPI(title="PrankVZ API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGINS] if CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AdminCreate(BaseModel):
    name: str
    telegram_id: str

class BlockIpRequest(BaseModel):
    ip: str

class UnblockIpRequest(BaseModel):
    ip: str

class VisitLog(BaseModel):
    user_agent: str

# Helper functions
def get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def is_ip_blocked(ip: str, db: Session) -> bool:
    """Check if IP is blocked"""
    blocked_ip = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()
    return blocked_ip is not None

# Middleware to check IP blocking
@app.middleware("http")
async def check_ip_blocking(request: Request, call_next):
    # Skip IP check for non-API endpoints
    if not request.url.path.startswith("/api/"):
        response = await call_next(request)
        return response
    
    # Skip for health check
    if request.url.path == "/api/health":
        response = await call_next(request)
        return response
        
    client_ip = get_client_ip(request)
    
    # Check if IP is blocked
    from database import SessionLocal
    from fastapi.responses import JSONResponse
    db = SessionLocal()
    try:
        if is_ip_blocked(client_ip, db):
            return JSONResponse(
                status_code=403,
                content={"detail": "IP address is blocked"}
            )
    finally:
        db.close()
    
    response = await call_next(request)
    return response

# API Endpoints

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/log-visit")
async def log_visit(visit_data: VisitLog, request: Request, db: Session = Depends(get_db)):
    """Log visitor information"""
    client_ip = get_client_ip(request)
    
    visit = Visit(
        ip_address=client_ip,
        user_agent=visit_data.user_agent,
        timestamp=datetime.now()
    )
    
    db.add(visit)
    db.commit()
    db.refresh(visit)
    
    return {"message": "Visit logged successfully", "ip": client_ip}

@app.get("/api/visits")
async def get_visits(db: Session = Depends(get_db)):
    """Get all visits (admin only)"""
    visits = db.query(Visit).order_by(Visit.timestamp.desc()).limit(100).all()
    
    return [
        {
            "id": visit.id,
            "ip": visit.ip_address,
            "timestamp": visit.timestamp.isoformat(),
            "user_agent": visit.user_agent
        }
        for visit in visits
    ]

@app.get("/api/admins")
async def get_admins(db: Session = Depends(get_db)):
    """Get all Telegram admins"""
    admins = db.query(TelegramAdmin).filter(TelegramAdmin.is_active == True).all()
    
    return [
        {
            "id": admin.id,
            "name": admin.name,
            "telegram_id": admin.telegram_id,
            "created_at": admin.created_at.isoformat()
        }
        for admin in admins
    ]

@app.post("/api/admins")
async def create_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    """Create a new Telegram admin"""
    # Check if admin with this telegram_id already exists
    existing = db.query(TelegramAdmin).filter(TelegramAdmin.telegram_id == admin.telegram_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admin with this Telegram ID already exists")
    
    new_admin = TelegramAdmin(
        name=admin.name,
        telegram_id=admin.telegram_id,
        created_at=datetime.now()
    )
    
    db.add(new_admin)
    try:
        db.commit()
        db.refresh(new_admin)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create admin - possibly duplicate Telegram ID")
    
    return {"id": new_admin.id, "message": "Admin created successfully"}

@app.delete("/api/admins/{admin_id}")
async def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    """Delete a Telegram admin"""
    admin = db.query(TelegramAdmin).filter(TelegramAdmin.id == admin_id).first()
    
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    db.delete(admin)
    db.commit()
    
    return {"message": "Admin deleted successfully"}

@app.post("/api/block-ip")
async def block_ip(request: BlockIpRequest, db: Session = Depends(get_db)):
    """Block an IP address"""
    # Check if IP is already blocked
    existing = db.query(BlockedIP).filter(BlockedIP.ip_address == request.ip).first()
    if existing:
        raise HTTPException(status_code=400, detail="IP is already blocked")
    
    blocked_ip = BlockedIP(
        ip_address=request.ip,
        blocked_at=datetime.now()
    )
    
    db.add(blocked_ip)
    db.commit()
    
    return {"message": f"IP {request.ip} blocked successfully"}

@app.post("/api/unblock-ip")
async def unblock_ip(request: UnblockIpRequest, db: Session = Depends(get_db)):
    """Unblock an IP address"""
    blocked_ip = db.query(BlockedIP).filter(BlockedIP.ip_address == request.ip).first()
    
    if not blocked_ip:
        raise HTTPException(status_code=404, detail="IP not found in blocked list")
    
    db.delete(blocked_ip)
    db.commit()
    
    return {"message": f"IP {request.ip} unblocked successfully"}

@app.get("/api/blocked-ips")
async def get_blocked_ips(db: Session = Depends(get_db)):
    """Get all blocked IP addresses"""
    blocked_ips = db.query(BlockedIP).order_by(BlockedIP.blocked_at.desc()).all()
    
    return [ip.ip_address for ip in blocked_ips]

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and default data"""
    try:
        # Create tables
        create_tables()
        print("Database tables created successfully")
        
        # Add sample admins if none exist
        db = next(get_db())
        try:
            admin_count = db.query(TelegramAdmin).count()
            if admin_count == 0:
                sample_admins = [
                    TelegramAdmin(
                        name="Главный Админ",
                        telegram_id="123456789",
                        created_at=datetime.now()
                    ),
                    TelegramAdmin(
                        name="Модератор",
                        telegram_id="987654321",
                        created_at=datetime.now()
                    )
                ]
                db.add_all(sample_admins)
                db.commit()
                print("Sample admins created")
        finally:
            db.close()
            
    except Exception as e:
        print(f"Startup error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)