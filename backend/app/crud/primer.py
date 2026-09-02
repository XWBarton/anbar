from typing import List, Optional
from sqlalchemy.orm import Session

from ..models.primer import Primer
from ..schemas.primer import PrimerCreate, PrimerRead, PrimerUpdate
from .stored_item import counts_for


def get_primers(db: Session, q: Optional[str] = None) -> List[Primer]:
    query = db.query(Primer)
    if q:
        like = f"%{q}%"
        query = query.filter(
            Primer.name.ilike(like)
            | Primer.sequence.ilike(like)
            | Primer.target_gene.ilike(like)
            | Primer.target_organism.ilike(like)
        )
    return query.order_by(Primer.name).all()


def get_primer(db: Session, primer_id: int) -> Optional[Primer]:
    return db.query(Primer).filter(Primer.id == primer_id).first()


def get_primer_by_name(db: Session, name: str) -> Optional[Primer]:
    return db.query(Primer).filter(Primer.name == name).first()


def to_read(db: Session, primer: Primer) -> PrimerRead:
    read = PrimerRead.model_validate(primer)
    read.tube_count, read.available_count = counts_for(db, primer_id=primer.id)
    return read


def create_primer(db: Session, data: PrimerCreate) -> Primer:
    primer = Primer(**data.model_dump())
    db.add(primer)
    db.commit()
    db.refresh(primer)
    return primer


def update_primer(db: Session, primer: Primer, data: PrimerUpdate) -> Primer:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(primer, field, value)
    db.commit()
    db.refresh(primer)
    return primer


def delete_primer(db: Session, primer: Primer) -> None:
    db.delete(primer)
    db.commit()
