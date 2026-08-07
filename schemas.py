from pydantic import BaseModel
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"
    phone: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str

class User(UserBase):
    id: str
    role: str
    phone: Optional[str]
    joined: Optional[str]

    class Config:
        from_attributes = True

class ItemBase(BaseModel):
    type: str
    title: str
    category: str
    desc: str
    location: str
    date: str
    time: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    private: Optional[bool] = False
    tags: Optional[List[str]] = []

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    status: Optional[str] = None
    escalated: Optional[bool] = None

class Item(ItemBase):
    id: str
    userId: str
    status: str
    escalated: bool
    ticketId: str
    created: int

    class Config:
        from_attributes = True

class ClaimBase(BaseModel):
    itemId: str
    proof: str

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(BaseModel):
    status: str

class Claim(ClaimBase):
    id: str
    claimantId: str
    status: str
    adminNote: Optional[str]
    created: int

    class Config:
        from_attributes = True

class LogBase(BaseModel):
    event: str
    desc: str
    severity: Optional[str] = "low"

class Log(LogBase):
    id: str
    userId: Optional[str]
    time: int

    class Config:
        from_attributes = True
