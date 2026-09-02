from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..crud import box as box_crud
from ..crud import freezer as crud
from ..dependencies import get_current_user, get_db, require_admin
from ..models.user import User
from ..schemas.freezer import (
    FreezerCreate, FreezerMap, FreezerMapBox, FreezerRead, FreezerUpdate,
)

router = APIRouter(prefix="/freezers", tags=["freezers"])


def _read(db: Session, freezer) -> FreezerRead:
    read = FreezerRead.model_validate(freezer)
    read.box_count, read.item_count = crud.counts(db, freezer)
    return read


@router.get("/", response_model=List[FreezerRead])
def list_freezers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return [_read(db, f) for f in crud.get_freezers(db)]


@router.post("/", response_model=FreezerRead)
def create(data: FreezerCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    try:
        return _read(db, crud.create_freezer(db, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"A freezer named '{data.name}' already exists")


@router.get("/{freezer_id}", response_model=FreezerRead)
def get_one(freezer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    freezer = crud.get_freezer(db, freezer_id)
    if not freezer:
        raise HTTPException(status_code=404, detail="Freezer not found")
    return _read(db, freezer)


@router.get("/{freezer_id}/map", response_model=FreezerMap)
def get_map(freezer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Shelves x slots, with the box in each position and how full it is."""
    freezer = crud.get_freezer(db, freezer_id)
    if not freezer:
        raise HTTPException(status_code=404, detail="Freezer not found")

    placed, unplaced = [], []
    for b in box_crud.get_boxes(db, freezer_id=freezer_id):
        filled, capacity = box_crud.fill_counts(db, b)
        entry = FreezerMapBox(
            id=b.id, name=b.name, shelf=b.shelf, slot=b.slot, kind=b.kind,
            rows=b.rows, cols=b.cols, filled=filled, capacity=capacity,
        )
        (placed if b.shelf is not None and b.slot is not None else unplaced).append(entry)

    return FreezerMap(
        freezer=_read(db, freezer),
        shelf_count=freezer.shelf_count,
        slots_per_shelf=freezer.slots_per_shelf,
        boxes=placed,
        unplaced_boxes=unplaced,
    )


@router.put("/{freezer_id}", response_model=FreezerRead)
def update(
    freezer_id: int,
    data: FreezerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    freezer = crud.get_freezer(db, freezer_id)
    if not freezer:
        raise HTTPException(status_code=404, detail="Freezer not found")
    try:
        return _read(db, crud.update_freezer(db, freezer, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A freezer with that name already exists")


@router.delete("/{freezer_id}")
def delete(freezer_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    freezer = crud.get_freezer(db, freezer_id)
    if not freezer:
        raise HTTPException(status_code=404, detail="Freezer not found")
    if freezer.boxes:
        raise HTTPException(
            status_code=400,
            detail=f"'{freezer.name}' still holds {len(freezer.boxes)} box(es) — move or delete them first",
        )
    crud.delete_freezer(db, freezer)
    return {"ok": True}
