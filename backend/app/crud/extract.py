from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from ..models.extract import Extract
from ..schemas.extract import ExtractCreate, ExtractRead, ExtractUpdate
from .stored_item import counts_for, owner_display


def get_extracts(db: Session, q: Optional[str] = None, owner_id: Optional[int] = None) -> List[Extract]:
    query = db.query(Extract).options(joinedload(Extract.owner))
    if q:
        like = f"%{q}%"
        query = query.filter(
            Extract.code.ilike(like)
            | Extract.source_organism.ilike(like)
            | Extract.specimen_code.ilike(like)
            | Extract.kit.ilike(like)
        )
    if owner_id is not None:
        query = query.filter(Extract.owner_id == owner_id)
    return query.order_by(Extract.code).all()


def get_extract(db: Session, extract_id: int) -> Optional[Extract]:
    return db.query(Extract).options(joinedload(Extract.owner)).filter(Extract.id == extract_id).first()


def get_extract_by_code(db: Session, code: str) -> Optional[Extract]:
    return db.query(Extract).filter(Extract.code == code).first()


def to_read(db: Session, extract: Extract) -> ExtractRead:
    read = ExtractRead.model_validate(extract)
    read.owner_display = owner_display(extract)
    read.tube_count, read.available_count = counts_for(db, extract_id=extract.id)
    return read


def create_extract(db: Session, data: ExtractCreate) -> Extract:
    extract = Extract(**data.model_dump())
    db.add(extract)
    db.commit()
    db.refresh(extract)
    return extract


def update_extract(db: Session, extract: Extract, data: ExtractUpdate) -> Extract:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(extract, field, value)
    db.commit()
    db.refresh(extract)
    return extract


def delete_extract(db: Session, extract: Extract) -> None:
    db.delete(extract)
    db.commit()
