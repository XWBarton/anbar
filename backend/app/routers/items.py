from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..crud import box as box_crud
from ..crud import stored_item as crud
from ..dependencies import get_current_user, get_db
from ..models.stored_item import states_for
from ..models.user import User
from ..schemas.stored_item import StoredItemCreate, StoredItemRead, StoredItemUpdate
from ..utils.location import slot_label

router = APIRouter(prefix="/items", tags=["items"])


def _check_slot(db: Session, box_id, row, col, exclude_id=None):
    if box_id is None or row is None or col is None:
        return
    box = box_crud.get_box(db, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    if not (1 <= row <= box.rows and 1 <= col <= box.cols):
        raise HTTPException(status_code=400, detail="That position is outside the box")
    occupant = crud.slot_occupant(db, box_id, row, col, exclude_id=exclude_id)
    if occupant:
        raise HTTPException(
            status_code=409,
            detail=f"{slot_label(row, col)} in '{box.name}' already holds '{occupant.parent_name}'",
        )


@router.get("/states/{item_type}", response_model=List[str])
def list_states(item_type: str, _: User = Depends(get_current_user)):
    """The coarse states valid for this item type. There is no quantity to
    track beyond these — nothing here is computed or decremented."""
    return list(states_for(item_type))


@router.get("/", response_model=List[StoredItemRead])
def list_items(
    item_type: Optional[str] = None,
    state: Optional[str] = None,
    box_id: Optional[int] = None,
    freezer_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    primer_id: Optional[int] = None,
    reagent_id: Optional[int] = None,
    extract_id: Optional[int] = None,
    include_empty: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items = crud.get_items(
        db,
        item_type=item_type,
        state=state,
        box_id=box_id,
        freezer_id=freezer_id,
        owner_id=owner_id,
        primer_id=primer_id,
        reagent_id=reagent_id,
        extract_id=extract_id,
        include_empty=include_empty,
    )
    return [crud.to_read(i) for i in items]


@router.post("/", response_model=StoredItemRead)
def create(data: StoredItemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    _check_slot(db, data.box_id, data.row, data.col)
    try:
        return crud.to_read(crud.create_item(db, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That slot is already taken")


@router.get("/{item_id}", response_model=StoredItemRead)
def get_one(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return crud.to_read(item)


@router.put("/{item_id}", response_model=StoredItemRead)
def update(
    item_id: int,
    data: StoredItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    fields = data.model_dump(exclude_unset=True)
    if fields.get("state") != "empty":
        _check_slot(
            db,
            fields.get("box_id", item.box_id),
            fields.get("row", item.row),
            fields.get("col", item.col),
            exclude_id=item.id,
        )
    try:
        return crud.to_read(crud.update_item(db, item, data))
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That slot is already taken")


@router.delete("/{item_id}")
def delete(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    crud.delete_item(db, item)
    return {"ok": True}
