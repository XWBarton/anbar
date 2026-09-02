from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class BoxBase(BaseModel):
    name: str
    freezer_id: Optional[int] = None
    shelf: Optional[int] = None
    slot: Optional[int] = None
    rows: int = 9
    cols: int = 9
    kind: Optional[str] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_shared: bool = False
    notes: Optional[str] = None


class BoxCreate(BoxBase):
    pass


class BoxUpdate(BaseModel):
    name: Optional[str] = None
    freezer_id: Optional[int] = None
    shelf: Optional[int] = None
    slot: Optional[int] = None
    rows: Optional[int] = None
    cols: Optional[int] = None
    kind: Optional[str] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_shared: Optional[bool] = None
    notes: Optional[str] = None


class BoxRead(BoxBase):
    id: int
    created_at: datetime
    freezer_name: Optional[str] = None
    location: str = ""
    filled: int = 0
    capacity: int = 0

    class Config:
        from_attributes = True


class BoxCell(BaseModel):
    row: int
    col: int
    slot_label: str
    item: Optional[dict] = None


class BoxMap(BaseModel):
    box: BoxRead
    rows: int
    cols: int
    cells: List[BoxCell]
    unplaced: List[dict]


class MoveItem(BaseModel):
    item_id: int
    row: Optional[int] = None
    col: Optional[int] = None
