from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.lookup_option import LookupOption


def get_options(db: Session, category: str) -> List[LookupOption]:
    return (
        db.query(LookupOption)
        .filter(LookupOption.category == category)
        .order_by(LookupOption.sort_order, LookupOption.value)
        .all()
    )


def get_option(db: Session, option_id: int) -> Optional[LookupOption]:
    return db.query(LookupOption).filter(LookupOption.id == option_id).first()


def create_option(db: Session, category: str, value: str, sort_order: int = 0) -> LookupOption:
    option = LookupOption(category=category, value=value.strip(), sort_order=sort_order)
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


def delete_option(db: Session, option: LookupOption) -> None:
    db.delete(option)
    db.commit()
