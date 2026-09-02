from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..crud import box as crud
from ..crud import stored_item as item_crud
from ..dependencies import get_current_user, get_db, require_admin
from ..models.user import User
from ..schemas.box import BoxCell, BoxCreate, BoxMap, BoxRead, BoxUpdate, MoveItem
from ..utils.location import slot_label

router = APIRouter(prefix="/boxes", tags=["boxes"])


def _check_position(db: Session, freezer_id, shelf, slot, exclude_id=None):
    if freezer_id is None or shelf is None or slot is None:
        return
    clash = crud.position_taken(db, freezer_id, shelf, slot, exclude_id=exclude_id)
    if clash:
        raise HTTPException(
            status_code=409,
            detail=f"Shelf {shelf}, slot {slot} is already occupied by '{clash.name}'",
        )


@router.get("/", response_model=List[BoxRead])
def list_boxes(
    freezer_id: Optional[int] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return [crud.to_read(db, b) for b in crud.get_boxes(db, freezer_id=freezer_id, q=q)]


@router.post("/", response_model=BoxRead)
def create(data: BoxCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    _check_position(db, data.freezer_id, data.shelf, data.slot)
    try:
        return crud.to_read(db, crud.create_box(db, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That freezer position is already taken")


@router.get("/{box_id}", response_model=BoxRead)
def get_one(box_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    box = crud.get_box(db, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    return crud.to_read(db, box)


@router.get("/{box_id}/map", response_model=BoxMap)
def get_map(box_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Every slot in the box, filled or not, plus tubes that belong to this box
    but hold no position (typically ones marked empty)."""
    box = crud.get_box(db, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    items = item_crud.get_items(db, box_id=box_id, include_empty=True)
    by_position = {(i.row, i.col): i for i in items if i.row is not None and i.col is not None}

    cells = [
        BoxCell(
            row=r,
            col=c,
            slot_label=slot_label(r, c) or "",
            item=(item_crud.to_read(by_position[(r, c)]).model_dump()
                  if (r, c) in by_position else None),
        )
        for r in range(1, box.rows + 1)
        for c in range(1, box.cols + 1)
    ]

    unplaced = [
        item_crud.to_read(i).model_dump()
        for i in items
        if i.row is None or i.col is None
    ]

    return BoxMap(box=crud.to_read(db, box), rows=box.rows, cols=box.cols, cells=cells, unplaced=unplaced)


@router.post("/{box_id}/move", response_model=BoxMap)
def move_item(
    box_id: int,
    payload: MoveItem,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Move a tube to a slot in this box, or out of its slot when row/col are null."""
    box = crud.get_box(db, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    item = item_crud.get_item(db, payload.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.row is None or payload.col is None:
        item.row = None
        item.col = None
        item.box_id = box_id
    else:
        if not (1 <= payload.row <= box.rows and 1 <= payload.col <= box.cols):
            raise HTTPException(status_code=400, detail="That position is outside the box")
        occupant = item_crud.slot_occupant(db, box_id, payload.row, payload.col, exclude_id=item.id)
        if occupant:
            raise HTTPException(
                status_code=409,
                detail=f"{slot_label(payload.row, payload.col)} already holds '{occupant.parent_name}'",
            )
        item.box_id = box_id
        item.row = payload.row
        item.col = payload.col

    db.commit()
    return get_map(box_id, db)


@router.put("/{box_id}", response_model=BoxRead)
def update(box_id: int, data: BoxUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    box = crud.get_box(db, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")

    fields = data.model_dump(exclude_unset=True)
    _check_position(
        db,
        fields.get("freezer_id", box.freezer_id),
        fields.get("shelf", box.shelf),
        fields.get("slot", box.slot),
        exclude_id=box.id,
    )

    # Shrinking a box must not strand tubes outside the new grid.
    new_rows = fields.get("rows", box.rows)
    new_cols = fields.get("cols", box.cols)
    if new_rows < box.rows or new_cols < box.cols:
        stranded = [
            i for i in item_crud.get_items(db, box_id=box.id, include_empty=True)
            if i.row is not None and (i.row > new_rows or i.col > new_cols)
        ]
        if stranded:
            raise HTTPException(
                status_code=400,
                detail=f"{len(stranded)} tube(s) sit outside a {new_rows}x{new_cols} grid — move them first",
            )

    try:
        return crud.to_read(db, crud.update_box(db, box, data))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That freezer position is already taken")


@router.delete("/{box_id}")
def delete(box_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    box = crud.get_box(db, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    crud.delete_box(db, box)
    return {"ok": True}
