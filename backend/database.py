from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:password@localhost/prankvz")

# For psycopg 3, we need to make sure URL uses the right driver
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Модели таблиц
class Visit(Base):
    __tablename__ = "visits"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_agent = Column(Text)

class BlockedIP(Base):
    __tablename__ = "blocked_ips"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    blocked_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(String, default="Blocked by admin")

class TelegramAdmin(Base):
    __tablename__ = "telegram_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    telegram_id = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

# Создание таблиц
def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()