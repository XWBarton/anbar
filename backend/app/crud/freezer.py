from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.box import Box
from ..models.freezer import Freezer
from ..models.stored_item import StoredItem
from ..schemas.freezer import FreezerCreate, FreezerUpdate


def get_freezers(db: Session) -> List[Freezer]:
    return db.query(Freezer).order_by(Freezer.name).all()


def get_freezer(db: Session, freezer_id: int) -> Optional[Freezer]:
    return db.query(Freezer).filter(Freezer.id == freezer_id).first()


def get_freezer_by_name(db: Session, name: str) -> Optional[Freezer]:
    return db.query(Freezer).filter(Freezer.name == name).first()


def create_freezer(db: Session, data: FreezerCreate) -> Freezer:
    freezer = Freezer(**data.model_dump())
    db.add(freezer)
    db.commit()
    db.refresh(freezer)
    return freezer


def update_freezer(db: Session, freezer: Freezer, data: FreezerUpdate) -> Freezer:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(freezer, field, value)
    db.commit()
    db.refresh(freezer)
    return freezer


def delete_freezer(db: Session, freezer: Freezer) -> None:
    db.delete(freezer)
    db.commit()


def counts(db: Session, freezer: Freezer) -> tuple[int, int]:
    """(boxes in this freezer, tubes across those boxes)"""
    box_ids = [b.id for b in freezer.boxes]
    if not box_ids:
        return 0, 0
    items = db.query(StoredItem).filter(StoredItem.box_id.in_(box_ids)).count()
    return len(box_ids), items
