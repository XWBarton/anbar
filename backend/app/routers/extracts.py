from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..crud import extract as crud
from ..crud import stored_item as item_crud
from ..dependencies import get_current_user, get_db, require_admin
from ..models.user import User
from ..schemas.extract import ExtractCreate, ExtractRead, ExtractUpdate
from ..schemas.stored_item import StoredItemRead

router = APIRouter(prefix="/extracts", tags=["extracts"])


@router.get("/", response_model=List[ExtractRead])
def list_extracts(
    q: Optional[str] = None,
    owner_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return [crud.to_read(db, e) for e in crud.get_extracts(db, q=q, owner_id=owner_id)]


@router.post("/", response_model=ExtractRead)
def create(data: ExtractCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return crud.to_read(db, crud.create_extract(db, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"An extract coded '{data.code}' already exists")


@router.get("/{extract_id}", response_model=ExtractRead)
def get_one(extract_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    extract = crud.get_extract(db, extract_id)
    if not extract:
        raise HTTPException(status_code=404, detail="Extract not found")
    return crud.to_read(db, extract)


@router.get("/{extract_id}/items", response_model=List[StoredItemRead])
def list_tubes(
    extract_id: int,
    include_empty: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not crud.get_extract(db, extract_id):
        raise HTTPException(status_code=404, detail="Extract not found")
    items = item_crud.get_items(db, extract_id=extract_id, include_empty=include_empty)
    return [item_crud.to_read(i) for i in items]


@router.put("/{extract_id}", response_model=ExtractRead)
def update(extract_id: int, data: ExtractUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    extract = crud.get_extract(db, extract_id)
    if not extract:
        raise HTTPException(status_code=404, detail="Extract not found")
    try:
        return crud.to_read(db, crud.update_extract(db, extract, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An extract with that code already exists")


@router.delete("/{extract_id}")
def delete(extract_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    extract = crud.get_extract(db, extract_id)
    if not extract:
        raise HTTPException(status_code=404, detail="Extract not found")
    crud.delete_extract(db, extract)
    return {"ok": True}
