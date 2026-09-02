from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from ..dependencies import get_db
from ..schemas.user import UserCreate
from ..crud.user import get_user_by_username, get_user_by_email, create_user
from ..config import settings
from ..models.app_setting import AppSetting

router = APIRouter(prefix="/setup", tags=["setup"])

SETUP_COMPLETED_KEY = "setup_completed"


class SetupData(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str


def _setup_completed(db: Session) -> bool:
    return db.query(AppSetting).filter(AppSetting.key == SETUP_COMPLETED_KEY).first() is not None


@router.get("/status")
def setup_status(db: Session = Depends(get_db)):
    """A durable flag, not 'does the seeded default-admin username still
    exist' — that check alone would flip back to true on every restart,
    since the real admin deletes that account as part of finishing setup."""
    return {"needs_setup": not _setup_completed(db)}


@router.post("/complete")
def complete_setup(data: SetupData, db: Session = Depends(get_db)):
    if _setup_completed(db):
        raise HTTPException(status_code=400, detail="Setup already complete")
    if get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    create_user(db, UserCreate(
        username=data.username,
        full_name=data.full_name,
        email=data.email,
        password=data.password,
        is_admin=True,
    ))
    default_admin = get_user_by_username(db, settings.FIRST_ADMIN_USERNAME)
    if default_admin:
        db.delete(default_admin)
    db.add(AppSetting(key=SETUP_COMPLETED_KEY, value="true"))
    db.commit()
    return {"ok": True}
