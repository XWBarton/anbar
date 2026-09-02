from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..crud import primer as crud
from ..crud import stored_item as item_crud
from ..dependencies import get_current_user, get_db, require_admin
from ..models.user import User
from ..schemas.primer import PrimerCreate, PrimerRead, PrimerUpdate
from ..schemas.stored_item import StoredItemRead

router = APIRouter(prefix="/primers", tags=["primers"])


@router.get("/", response_model=List[PrimerRead])
def list_primers(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return [crud.to_read(db, p) for p in crud.get_primers(db, q=q)]


@router.post("/", response_model=PrimerRead)
def create(data: PrimerCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return crud.to_read(db, crud.create_primer(db, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"A primer named '{data.name}' already exists")


@router.get("/{primer_id}", response_model=PrimerRead)
def get_one(primer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    primer = crud.get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    return crud.to_read(db, primer)


@router.get("/{primer_id}/items", response_model=List[StoredItemRead])
def list_tubes(
    primer_id: int,
    include_empty: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not crud.get_primer(db, primer_id):
        raise HTTPException(status_code=404, detail="Primer not found")
    items = item_crud.get_items(db, primer_id=primer_id, include_empty=include_empty)
    return [item_crud.to_read(i) for i in items]


@router.put("/{primer_id}", response_model=PrimerRead)
def update(primer_id: int, data: PrimerUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    primer = crud.get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    try:
        return crud.to_read(db, crud.update_primer(db, primer, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A primer with that name already exists")


@router.delete("/{primer_id}")
def delete(primer_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    primer = crud.get_primer(db, primer_id)
    if not primer:
        raise HTTPException(status_code=404, detail="Primer not found")
    crud.delete_primer(db, primer)
    return {"ok": True}
