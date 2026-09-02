from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class FreezerBase(BaseModel):
    name: str
    kind: Optional[str] = None
    location: Optional[str] = None
    shelf_count: int = 4
    slots_per_shelf: int = 3
    notes: Optional[str] = None


class FreezerCreate(FreezerBase):
    pass


class FreezerUpdate(BaseModel):
    name: Optional[str] = None
    kind: Optional[str] = None
    location: Optional[str] = None
    shelf_count: Optional[int] = None
    slots_per_shelf: Optional[int] = None
    notes: Optional[str] = None


class FreezerRead(FreezerBase):
    id: int
    created_at: datetime
    box_count: int = 0
    item_count: int = 0

    class Config:
        from_attributes = True


class FreezerMapBox(BaseModel):
    id: int
    name: str
    shelf: Optional[int] = None
    slot: Optional[int] = None
    kind: Optional[str] = None
    rows: int
    cols: int
    filled: int = 0
    capacity: int = 0


class FreezerMap(BaseModel):
    freezer: FreezerRead
    shelf_count: int
    slots_per_shelf: int
    boxes: List[FreezerMapBox]
    unplaced_boxes: List[FreezerMapBox]
