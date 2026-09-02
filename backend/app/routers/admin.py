from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import sibling_client
from ..config import settings
from ..dependencies import get_current_user, get_db, require_admin
from ..models.app_setting import AppSetting
from ..models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_KEYS = {
    "elementa_url",
    "elementa_api_token",
    "tessera_url",
    "tessera_api_token",
    "anbar_api_token",
}
SECRET_KEYS = {"elementa_api_token", "tessera_api_token", "anbar_api_token"}


class SettingValue(BaseModel):
    value: str


def _map(db: Session) -> dict[str, str]:
    return sibling_client.settings_map(db)


@router.get("/public-settings")
def public_settings(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Non-secret values every signed-in user needs for the sibling deep links."""
    m = _map(db)
    return {
        "elementa_url": m.get("elementa_url", "") or settings.ELEMENTA_URL,
        "tessera_url": m.get("tessera_url", "") or settings.TESSERA_URL,
        "app_version": settings.APP_VERSION,
    }


@router.get("/settings/")
def get_settings(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    m = _map(db)
    return {
        "elementa_url": m.get("elementa_url", "") or settings.ELEMENTA_URL,
        "tessera_url": m.get("tessera_url", "") or settings.TESSERA_URL,
        "elementa_token_set": bool(m.get("elementa_api_token")),
        "tessera_token_set": bool(m.get("tessera_api_token")),
        "anbar_token_set": bool(m.get("anbar_api_token")),
        "app_version": settings.APP_VERSION,
    }


@router.put("/settings/{key}")
def set_setting(
    key: str,
    payload: SettingValue,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail="Unknown setting key")
    existing = db.query(AppSetting).filter(AppSetting.key == key).first()
    if existing:
        existing.value = payload.value
    else:
        db.add(AppSetting(key=key, value=payload.value))
    db.commit()
    return {"ok": True}


@router.get("/{app}/test")
def test_sibling(app: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if app not in sibling_client.APPS:
        raise HTTPException(status_code=404, detail="Unknown app")
    ok, message = sibling_client.ping(db, app)
    if not ok:
        raise HTTPException(status_code=502, detail=message)
    return {"ok": True}


@router.get("/elementa/extractions")
def elementa_extractions(q: str = "", db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return sibling_client.search_elementa_extractions(db, q)


@router.get("/elementa/primers")
def elementa_primers(q: str = "", db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return sibling_client.search_elementa_primers(db, q)


@router.get("/tessera/specimens")
def tessera_specimens(q: str = "", db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return sibling_client.search_tessera_specimens(db, q)
