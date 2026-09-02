from typing import List, Optional
from sqlalchemy.orm import Session

from ..models.reagent import Reagent
from ..schemas.reagent import ReagentCreate, ReagentRead, ReagentUpdate
from .stored_item import counts_for


def get_reagents(db: Session, q: Optional[str] = None, category: Optional[str] = None) -> List[Reagent]:
    query = db.query(Reagent)
    if q:
        like = f"%{q}%"
        query = query.filter(
            Reagent.name.ilike(like)
            | Reagent.supplier.ilike(like)
            | Reagent.catalogue_number.ilike(like)
        )
    if category:
        query = query.filter(Reagent.category == category)
    return query.order_by(Reagent.name).all()


def get_reagent(db: Session, reagent_id: int) -> Optional[Reagent]:
    return db.query(Reagent).filter(Reagent.id == reagent_id).first()


def to_read(db: Session, reagent: Reagent) -> ReagentRead:
    read = ReagentRead.model_validate(reagent)
    read.tube_count, read.available_count = counts_for(db, reagent_id=reagent.id)
    return read


def create_reagent(db: Session, data: ReagentCreate) -> Reagent:
    reagent = Reagent(**data.model_dump())
    db.add(reagent)
    db.commit()
    db.refresh(reagent)
    return reagent


def update_reagent(db: Session, reagent: Reagent, data: ReagentUpdate) -> Reagent:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(reagent, field, value)
    db.commit()
    db.refresh(reagent)
    return reagent


def delete_reagent(db: Session, reagent: Reagent) -> None:
    db.delete(reagent)
    db.commit()
