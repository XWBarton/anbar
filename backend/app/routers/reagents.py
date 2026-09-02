from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..crud import reagent as crud
from ..crud import stored_item as item_crud
from ..dependencies import get_current_user, get_db, require_admin
from ..models.user import User
from ..schemas.reagent import ReagentCreate, ReagentRead, ReagentUpdate
from ..schemas.stored_item import StoredItemRead

router = APIRouter(prefix="/reagents", tags=["reagents"])


@router.get("/", response_model=List[ReagentRead])
def list_reagents(
    q: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return [crud.to_read(db, r) for r in crud.get_reagents(db, q=q, category=category)]


@router.post("/", response_model=ReagentRead)
def create(data: ReagentCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return crud.to_read(db, crud.create_reagent(db, data))


@router.get("/{reagent_id}", response_model=ReagentRead)
def get_one(reagent_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    reagent = crud.get_reagent(db, reagent_id)
    if not reagent:
        raise HTTPException(status_code=404, detail="Reagent not found")
    return crud.to_read(db, reagent)


@router.get("/{reagent_id}/items", response_model=List[StoredItemRead])
def list_bottles(
    reagent_id: int,
    include_empty: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not crud.get_reagent(db, reagent_id):
        raise HTTPException(status_code=404, detail="Reagent not found")
    items = item_crud.get_items(db, reagent_id=reagent_id, include_empty=include_empty)
    return [item_crud.to_read(i) for i in items]


@router.put("/{reagent_id}", response_model=ReagentRead)
def update(reagent_id: int, data: ReagentUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    reagent = crud.get_reagent(db, reagent_id)
    if not reagent:
        raise HTTPException(status_code=404, detail="Reagent not found")
    return crud.to_read(db, crud.update_reagent(db, reagent, data))


@router.delete("/{reagent_id}")
def delete(reagent_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    reagent = crud.get_reagent(db, reagent_id)
    if not reagent:
        raise HTTPException(status_code=404, detail="Reagent not found")
    crud.delete_reagent(db, reagent)
    return {"ok": True}
