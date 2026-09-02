from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from ..models.stored_item import StoredItem, states_for
from ..schemas.stored_item import StoredItemCreate, StoredItemRead, StoredItemUpdate
from ..utils.location import describe_box, describe_location, slot_label


def _loaded(query):
    return query.options(
        joinedload(StoredItem.primer),
        joinedload(StoredItem.reagent),
        joinedload(StoredItem.extract),
        joinedload(StoredItem.owner),
        joinedload(StoredItem.box),
    )


def owner_display(obj) -> Optional[str]:
    """How ownership reads in the UI: a person, a name, or the lab at large."""
    if getattr(obj, "is_shared", False):
        return "Shared (lab)"
    if getattr(obj, "owner", None):
        return obj.owner.full_name
    return getattr(obj, "owner_name", None)


def to_read(item: StoredItem) -> StoredItemRead:
    """The one place a StoredItem becomes API output, so every consumer —
    tables, search, CSV, the sibling apps — sees identical location text."""
    read = StoredItemRead.model_validate(item)
    read.slot_label = slot_label(item.row, item.col)
    read.name = item.parent_name
    read.location = describe_location(item)
    read.box_name = item.box.name if item.box else None
    read.box_location = describe_box(item.box) if item.box else None
    read.freezer_name = item.box.freezer.name if item.box and item.box.freezer else None
    read.owner_display = owner_display(item)
    return read


def get_items(
    db: Session,
    item_type: Optional[str] = None,
    state: Optional[str] = None,
    box_id: Optional[int] = None,
    freezer_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    primer_id: Optional[int] = None,
    reagent_id: Optional[int] = None,
    extract_id: Optional[int] = None,
    include_empty: bool = False,
) -> List[StoredItem]:
    from ..models.box import Box

    query = _loaded(db.query(StoredItem))
    if item_type:
        query = query.filter(StoredItem.item_type == item_type)
    if state:
        query = query.filter(StoredItem.state == state)
    elif not include_empty:
        # 'empty' tubes are kept as history but stay out of the way by default
        query = query.filter(StoredItem.state != "empty")
    if box_id is not None:
        query = query.filter(StoredItem.box_id == box_id)
    if freezer_id is not None:
        query = query.join(Box, StoredItem.box_id == Box.id).filter(Box.freezer_id == freezer_id)
    if owner_id is not None:
        query = query.filter(StoredItem.owner_id == owner_id)
    if primer_id is not None:
        query = query.filter(StoredItem.primer_id == primer_id)
    if reagent_id is not None:
        query = query.filter(StoredItem.reagent_id == reagent_id)
    if extract_id is not None:
        query = query.filter(StoredItem.extract_id == extract_id)
    return query.order_by(StoredItem.id.desc()).all()


def get_item(db: Session, item_id: int) -> Optional[StoredItem]:
    return _loaded(db.query(StoredItem)).filter(StoredItem.id == item_id).first()


def slot_occupant(db: Session, box_id: int, row: int, col: int, exclude_id: Optional[int] = None):
    query = db.query(StoredItem).filter(
        StoredItem.box_id == box_id, StoredItem.row == row, StoredItem.col == col
    )
    if exclude_id is not None:
        query = query.filter(StoredItem.id != exclude_id)
    return query.first()


def create_item(db: Session, data: StoredItemCreate) -> StoredItem:
    item = StoredItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return db.query(StoredItem).filter(StoredItem.id == item.id).first()


def update_item(db: Session, item: StoredItem, data: StoredItemUpdate) -> StoredItem:
    update = data.model_dump(exclude_unset=True)

    if "state" in update and update["state"] is not None:
        allowed = states_for(item.item_type)
        if update["state"] not in allowed:
            raise ValueError(f"state for a {item.item_type} must be one of {', '.join(allowed)}")

    for field, value in update.items():
        setattr(item, field, value)

    # A reagent gets its opened date the first time it is marked opened, unless
    # one was supplied.
    if update.get("state") == "opened" and item.opened_date is None and "opened_date" not in update:
        from datetime import date as _date
        item.opened_date = _date.today()

    # An empty tube releases its slot so the space can be reused, but the record
    # survives as history until someone deletes it.
    if update.get("state") == "empty":
        item.row = None
        item.col = None

    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item: StoredItem) -> None:
    db.delete(item)
    db.commit()


def counts_for(db: Session, **filters) -> tuple[int, int]:
    """(all tubes, tubes not marked empty) for a primer / reagent / extract."""
    query = db.query(StoredItem).filter_by(**filters)
    total = query.count()
    available = query.filter(StoredItem.state != "empty").count()
    return total, available
