import os
import time
import uuid
import math
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError, jwt

import models
import schemas
import auth_utils
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FindIt API")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Auth Dependency ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_security_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "security"]:
        raise HTTPException(status_code=403, detail="Security/Admin access required")
    return current_user

# --- Helpers ---
def gen_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:9].upper()}"

def gen_ticket(db: Session):
    count = db.query(models.Item).count()
    return f"TKT-{str(count + 1).zfill(4)}"

def add_log(db: Session, event, desc, user_id, severity="low"):
    log = models.Log(
        id=gen_id("l"),
        event=event,
        desc=desc,
        userId=user_id,
        severity=severity,
        time=int(time.time() * 1000)
    )
    db.add(log)
    db.commit()

# --- Seed Data ---
@app.on_event("startup")
async def seed_data():
    db = next(get_db())
    if db.query(models.User).count() == 0:
        print("Seeding database...")
        # Users
        users = [
            models.User(id="u1", name="Admin User", email="admin@lf.com", password=auth_utils.get_password_hash("admin123"), role="admin", joined="2024-01-01", phone="555-0001"),
            models.User(id="u2", name="Alice Johnson", email="alice@lf.com", password=auth_utils.get_password_hash("alice123"), role="user", joined="2024-02-10", phone="555-0002"),
            models.User(id="u3", name="Bob Smith", email="bob@lf.com", password=auth_utils.get_password_hash("bob123"), role="user", joined="2024-03-05", phone="555-0003"),
            models.User(id="u4", name="Officer Chen", email="security@lf.com", password=auth_utils.get_password_hash("sec123"), role="security", joined="2024-01-15", phone="555-0004"),
        ]
        db.add_all(users)
        
        # Items
        items = [
            models.Item(id="i1", type="lost", title="Black Leather Wallet", category="Accessories", desc="Black leather wallet containing ID cards and cash.", location="Central Library, 2nd Floor", date="2024-06-10", time="14:30", color="Black", brand="Coach", userId="u2", status="open", private=False, escalated=False, ticketId="TKT-0001", tags=["wallet", "black", "leather", "id", "cash"], created=int(time.time() * 1000) - 86400000 * 5),
            models.Item(id="i2", type="found", title="Blue Backpack", category="Bags", desc="Blue Nike backpack found near the cafeteria.", location="Building A Cafeteria", date="2024-06-11", time="09:00", color="Blue", brand="Nike", userId="u3", status="open", private=False, escalated=False, ticketId="TKT-0002", tags=["backpack", "blue", "nike", "bag"], created=int(time.time() * 1000) - 86400000 * 4),
            models.Item(id="i3", type="lost", title="iPhone 14 Pro", category="Electronics", desc="Space grey iPhone 14 Pro with a cracked case.", location="Main Auditorium", date="2024-06-12", time="18:15", color="Grey", brand="Apple", userId="u2", status="matched", private=False, escalated=False, ticketId="TKT-0003", tags=["iphone", "phone", "apple", "grey", "cracked"], created=int(time.time() * 1000) - 86400000 * 3),
            models.Item(id="i4", type="found", title="Gold Ring", category="Jewelry", desc="A small gold ring found on the sports field.", location="Sports Field", date="2024-06-13", time="07:30", color="Gold", brand="", userId="u3", status="open", private=True, escalated=True, ticketId="TKT-0004", tags=["ring", "gold", "jewelry"], created=int(time.time() * 1000) - 86400000 * 2),
        ]
        db.add_all(items)
        
        # Claims
        claims = [
            models.Claim(id="c1", itemId="i3", claimantId="u2", proof="Screen wallpaper is a photo of my dog, Biscuit.", status="pending", created=int(time.time() * 1000) - 86400000)
        ]
        db.add_all(claims)
        
        # Logs
        logs = [
            models.Log(id="l1", event="ITEM_REPORTED", desc="Lost item reported: iPhone 14 Pro", userId="u2", severity="low", time=int(time.time() * 1000) - 86400000 * 3),
            models.Log(id="l2", event="ESCALATION", desc="Item TKT-0004 escalated: Gold Ring", userId="u3", severity="high", time=int(time.time() * 1000) - 86400000 * 2),
            models.Log(id="l3", event="CLAIM_SUBMITTED", desc="Claim submitted for TKT-0003", userId="u2", severity="medium", time=int(time.time() * 1000) - 86400000)
        ]
        db.add_all(logs)
        
        db.commit()

# --- Auth Routes ---

@app.post("/api/auth/login", response_model=schemas.Token)
async def login(request: Request, db: Session = Depends(get_db)):
    # Simple workaround for OAuth2PasswordBearer which expects form data, 
    # but the frontend sends JSON. We'll handle both or just JSON for our specific FE.
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")
    except:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not auth_utils.verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    add_log(db, "LOGIN", f"{user.name} logged in", user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/register", response_model=schemas.Token)
async def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = models.User(
        id=gen_id("u"),
        name=user_in.name,
        email=user_in.email,
        password=auth_utils.get_password_hash(user_in.password),
        role=user_in.role,
        phone=user_in.phone,
        joined=time.strftime("%Y-%m-%d")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = auth_utils.create_access_token(data={"sub": user.email})
    add_log(db, "REGISTER", f"New user registered: {user.name}", user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/api/auth/profile", response_model=schemas.User)
async def update_profile(profile: schemas.UserProfileUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile.name: current_user.name = profile.name
    if profile.phone: current_user.phone = profile.phone
    if profile.password: current_user.password = auth_utils.get_password_hash(profile.password)
    db.commit()
    db.refresh(current_user)
    add_log(db, "PROFILE_UPDATE", f"Profile updated by {current_user.name}", current_user.id)
    return current_user

# --- Item Routes ---

@app.get("/api/items", response_model=List[schemas.Item])
async def list_items(
    type: Optional[str] = None, 
    category: Optional[str] = None, 
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Item)
    
    # Apply filtering
    if type: query = query.filter(models.Item.type == type)
    if category: query = query.filter(models.Item.category == category)
    if status: query = query.filter(models.Item.status == status)
    
    items = query.all()
    
    # Role-based visibility filtering
    filtered_items = []
    is_privileged = current_user.role in ["admin", "security"]
    
    for it in items:
        # User can see their own items, or public items if it's not restricted by owner
        if is_privileged or it.userId == current_user.id or not it.private:
            filtered_items.append(it)
            
    return filtered_items

@app.post("/api/items", response_model=schemas.Item)
async def create_item(item_in: schemas.ItemCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = models.Item(
        **item_in.dict(),
        id=gen_id("i"),
        userId=current_user.id,
        status="open",
        escalated=False,
        ticketId=gen_ticket(db),
        created=int(time.time() * 1000)
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    add_log(db, "ITEM_REPORTED", f"Item reported: {item.title}", current_user.id)
    return item

@app.put("/api/items/{id}", response_model=schemas.Item)
async def update_item(id: str, item_up: schemas.ItemUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == id).first()
    if not item: raise HTTPException(status_code=404, detail="Item not found")
    
    # Access check (owner or admin/security)
    if item.userId != current_user.id and current_user.role not in ["admin", "security"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if item_up.status is not None: 
        item.status = item_up.status
        add_log(db, "ITEM_STATUS", f"Item {item.ticketId} status changed to {item_up.status}", current_user.id)
    if item_up.escalated is not None: 
        item.escalated = item_up.escalated
        add_log(db, "ESCALATION", f"Item {item.ticketId} escalation updated", current_user.id)
        
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/items/{id}")
async def delete_item(id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == id).first()
    if not item: raise HTTPException(status_code=404, detail="Item not found")
    if item.userId != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# --- Match Score Algorithm ---

def word_set(s):
    if not s: return set()
    return set(s.lower().replace(",", " ").split())

def word_overlap(sa, sb):
    if not sa and not sb: return 1.0
    if not sa or not sb: return 0.0
    union = sa | sb
    intersection = sa & sb
    return len(intersection) / len(union)

def match_score(lost, found):
    s = 0
    # Title (25 pts)
    s += int(word_overlap(word_set(lost.title), word_set(found.title)) * 25)
    # Category (15 pts)
    if lost.category == found.category: s += 15
    # Brand (15 pts)
    if (lost.brand or "").lower() == (found.brand or "").lower(): s += 15
    # Description (15 pts)
    s += int(word_overlap(word_set(lost.desc), word_set(found.desc)) * 15)
    # Color (10 pts)
    if (lost.color or "").lower() == (found.color or "").lower(): s += 10
    # Tags (10 pts)
    s += int(word_overlap(set(lost.tags or []), set(found.tags or [])) * 10)
    # Location (5 pts)
    s += int(word_overlap(word_set(lost.location), word_set(found.location)) * 5)
    # Date (5 pts) - simplified
    return min(s, 100)

@app.get("/api/items/matches")
async def get_matches(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    lost = db.query(models.Item).filter(models.Item.type == "lost", models.Item.status != "closed").all()
    found = db.query(models.Item).filter(models.Item.type == "found", models.Item.status != "closed").all()
    
    matches = []
    for l in lost:
        for f in found:
            score = match_score(l, f)
            if score >= 20: # matches.push if score >= 20
                matches.append({
                    "lost": l,
                    "found": f,
                    "score": score
                })
    
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches

# --- Claim Routes ---

@app.get("/api/claims", response_model=List[schemas.Claim])
async def list_claims(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        return db.query(models.Claim).all()
    
    # Users can see claims THEY made, or claims made ON items they reported
    return db.query(models.Claim).filter(
        (models.Claim.claimantId == current_user.id) | 
        (models.Claim.itemId.in_(db.query(models.Item.id).filter(models.Item.userId == current_user.id)))
    ).all()

@app.post("/api/claims", response_model=schemas.Claim)
async def create_claim(claim_in: schemas.ClaimCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    claim = models.Claim(
        **claim_in.dict(),
        id=gen_id("c"),
        claimantId=current_user.id,
        status="pending",
        created=int(time.time() * 1000)
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    add_log(db, "CLAIM_SUBMITTED", f"Claim submitted for {claim.itemId}", current_user.id)
    return claim

@app.put("/api/claims/{id}", response_model=schemas.Claim)
async def update_claim(id: str, claim_up: schemas.ClaimUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    claim = db.query(models.Claim).filter(models.Claim.id == id).first()
    if not claim: raise HTTPException(status_code=404, detail="Claim not found")
    
    item = db.query(models.Item).filter(models.Item.id == claim.itemId).first()
    
    # Authorized to resolve: Admin or Item Owner
    if current_user.role != "admin" and (not item or item.userId != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    claim.status = claim_up.status
    if claim_up.status == "approved" and item:
        item.status = "matched"
        
    db.commit()
    db.refresh(claim)
    add_log(db, f"CLAIM_{claim_up.status.upper()}", f"Claim {id} {claim_up.status}", current_user.id)
    return claim

# --- Admin Routes ---

@app.get("/api/admin/users", response_model=List[schemas.User])
async def list_users(admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.put("/api/admin/users/{id}/role")
async def update_user_role(id: str, role_up: schemas.UserRoleUpdate, admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.role = role_up.role
    db.commit()
    add_log(db, "ROLE_CHANGE", f"Role of {user.name} changed to {role_up.role}", admin.id)
    return {"message": "Updated"}

@app.get("/api/admin/logs", response_model=List[schemas.Log])
async def list_logs(security: models.User = Depends(get_security_user), db: Session = Depends(get_db)):
    return db.query(models.Log).order_by(models.Log.time.desc()).limit(100).all()

@app.post("/api/admin/logs")
async def create_log(log_in: schemas.LogBase, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    add_log(db, log_in.event, log_in.desc, current_user.id, log_in.severity)
    return {"message": "Logged"}

# --- Static Files & SPA Routing ---

# Mount static files (css, js, assets)
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
# Assets might be empty but we should handle it if exists
if os.path.exists("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

@app.get("/")
async def serve_index():
    return FileResponse("index.html")

# Final fallback for SPA routing if needed, though the custom router handles hash or direct rendering.
# In our case, the frontend is hash-based or internal state based, so '/' is enough.
