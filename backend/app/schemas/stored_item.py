from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, model_validator

from ..models.stored_item import ITEM_TYPES, states_for


class StoredItemBase(BaseModel):
    item_type: str
    primer_id: Optional[int] = None
    reagent_id: Optional[int] = None
    extract_id: Optional[int] = None
    box_id: Optional[int] = None
    row: Optional[int] = None
    col: Optional[int] = None
    label: Optional[str] = None
    state: Optional[str] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_shared: bool = False
    date_added: Optional[date] = None
    opened_date: Optional[date] = None
    lot_number: Optional[str] = None
    expiry_date: Optional[date] = None
    concentration: Optional[float] = None
    concentration_unit: Optional[str] = None
    volume_ul: Optional[float] = None
    notes: Optional[str] = None


class StoredItemCreate(StoredItemBase):
    @model_validator(mode="after")
    def check(self):
        if self.item_type not in ITEM_TYPES:
            raise ValueError(f"item_type must be one of {', '.join(ITEM_TYPES)}")

        parents = {
            "primer": self.primer_id,
            "reagent": self.reagent_id,
            "extract": self.extract_id,
        }
        if parents[self.item_type] is None:
            raise ValueError(f"{self.item_type}_id is required for a {self.item_type} item")
        if sum(1 for v in parents.values() if v is not None) != 1:
            raise ValueError("an item belongs to exactly one primer, reagent or extract")

        allowed = states_for(self.item_type)
        if self.state is None:
            self.state = allowed[0]
        elif self.state not in allowed:
            raise ValueError(f"state for a {self.item_type} must be one of {', '.join(allowed)}")

        if (self.row is None) != (self.col is None):
            raise ValueError("row and col must be given together")
        if self.row is not None and self.box_id is None:
            raise ValueError("a position needs a box")
        return self


class StoredItemUpdate(BaseModel):
    box_id: Optional[int] = None
    row: Optional[int] = None
    col: Optional[int] = None
    label: Optional[str] = None
    state: Optional[str] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_shared: Optional[bool] = None
    date_added: Optional[date] = None
    opened_date: Optional[date] = None
    lot_number: Optional[str] = None
    expiry_date: Optional[date] = None
    concentration: Optional[float] = None
    concentration_unit: Optional[str] = None
    volume_ul: Optional[float] = None
    notes: Optional[str] = None


class StoredItemRead(BaseModel):
    id: int
    item_type: str
    primer_id: Optional[int] = None
    reagent_id: Optional[int] = None
    extract_id: Optional[int] = None
    box_id: Optional[int] = None
    row: Optional[int] = None
    col: Optional[int] = None
    slot_label: Optional[str] = None
    label: Optional[str] = None
    state: str
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_shared: bool
    owner_display: Optional[str] = None
    date_added: Optional[date] = None
    opened_date: Optional[date] = None
    lot_number: Optional[str] = None
    expiry_date: Optional[date] = None
    concentration: Optional[float] = None
    concentration_unit: Optional[str] = None
    volume_ul: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # denormalised for tables and the sibling-app integration endpoints
    name: Optional[str] = None
    location: Optional[str] = None
    box_name: Optional[str] = None
    box_location: Optional[str] = None
    freezer_name: Optional[str] = None

    class Config:
        from_attributes = True
