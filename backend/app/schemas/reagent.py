from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReagentBase(BaseModel):
    name: str
    category: Optional[str] = None
    supplier: Optional[str] = None
    catalogue_number: Optional[str] = None
    notes: Optional[str] = None


class ReagentCreate(ReagentBase):
    pass


class ReagentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    catalogue_number: Optional[str] = None
    notes: Optional[str] = None


class ReagentRead(ReagentBase):
    id: int
    created_at: datetime
    tube_count: int = 0
    available_count: int = 0

    class Config:
        from_attributes = True
