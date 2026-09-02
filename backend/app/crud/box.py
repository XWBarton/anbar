from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from ..models.box import Box
from ..models.stored_item import StoredItem
from ..models.user import User
from ..schemas.box import BoxCreate, BoxRead, BoxUpdate
from ..utils.location import describe_box


def _loaded(query):
    return query.options(joinedload(Box.freezer), joinedload(Box.owner))


def get_boxes(db: Session, freezer_id: Optional[int] = None, q: Optional[str] = None) -> List[Box]:
    query = _loaded(db.query(Box))
    if freezer_id is not None:
        query = query.filter(Box.freezer_id == freezer_id)
    if q:
        like = f"%{q}%"
        query = query.outerjoin(User, Box.owner_id == User.id).filter(
            Box.name.ilike(like)
            | Box.owner_name.ilike(like)
            | Box.notes.ilike(like)
            | User.full_name.ilike(like)
        )
    return query.order_by(Box.name).all()


def get_box(db: Session, box_id: int) -> Optional[Box]:
    return _loaded(db.query(Box)).filter(Box.id == box_id).first()


def position_taken(db: Session, freezer_id: int, shelf: int, slot: int, exclude_id: Optional[int] = None):
    query = db.query(Box).filter(Box.freezer_id == freezer_id, Box.shelf == shelf, Box.slot == slot)
    if exclude_id is not None:
        query = query.filter(Box.id != exclude_id)
    return query.first()


def fill_counts(db: Session, box: Box) -> tuple[int, int]:
    """(occupied slots, total slots) — 'empty' tubes have already released
    their slot, so they are not counted as occupying space."""
    filled = (
        db.query(StoredItem)
        .filter(StoredItem.box_id == box.id, StoredItem.row.isnot(None))
        .count()
    )
    return filled, box.rows * box.cols


def to_read(db: Session, box: Box) -> BoxRead:
    from .stored_item import owner_display

    read = BoxRead.model_validate(box)
    read.freezer_name = box.freezer.name if box.freezer else None
    read.location = describe_box(box)
    read.filled, read.capacity = fill_counts(db, box)
    read.owner_name = owner_display(box) or box.owner_name
    return read


def create_box(db: Session, data: BoxCreate) -> Box:
    box = Box(**data.model_dump())
    db.add(box)
    db.commit()
    db.refresh(box)
    return box


def update_box(db: Session, box: Box, data: BoxUpdate) -> Box:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(box, field, value)
    db.commit()
    db.refresh(box)
    return box


def delete_box(db: Session, box: Box) -> None:
    """Deleting a box turns its tubes loose rather than destroying them —
    losing a box lid should not lose the record of what was inside."""
    db.query(StoredItem).filter(StoredItem.box_id == box.id).update(
        {StoredItem.box_id: None, StoredItem.row: None, StoredItem.col: None},
        synchronize_session=False,
    )
    db.delete(box)
    db.commit()
