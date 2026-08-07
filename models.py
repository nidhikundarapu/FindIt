from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user")
    phone = Column(String)
    joined = Column(String)

class Item(Base):
    __tablename__ = "items"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String)
    desc = Column(String)
    location = Column(String)
    date = Column(String)
    time = Column(String)
    color = Column(String)
    brand = Column(String)
    userId = Column(String, ForeignKey("users.id"))
    status = Column(String, default="open")
    private = Column(Boolean, default=False)
    escalated = Column(Boolean, default=False)
    ticketId = Column(String, unique=True, index=True)
    tags = Column(JSON)  # Store list of tags as JSON
    created = Column(Integer)

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String, primary_key=True, index=True)
    itemId = Column(String, ForeignKey("items.id"))
    claimantId = Column(String, ForeignKey("users.id"))
    proof = Column(String)
    status = Column(String, default="pending")
    adminNote = Column(String)
    created = Column(Integer)

class Log(Base):
    __tablename__ = "logs"

    id = Column(String, primary_key=True, index=True)
    event = Column(String)
    desc = Column(String)
    userId = Column(String)
    severity = Column(String, default="low")
    time = Column(Integer)
