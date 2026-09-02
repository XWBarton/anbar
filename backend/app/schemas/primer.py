from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PrimerBase(BaseModel):
    name: str
    sequence: Optional[str] = None
    direction: Optional[str] = None
    target_gene: Optional[str] = None
    target_organism: Optional[str] = None
    tm_c: Optional[float] = None
    reference: Optional[str] = None
    elementa_primer_id: Optional[int] = None
    notes: Optional[str] = None


class PrimerCreate(PrimerBase):
    pass


class PrimerUpdate(BaseModel):
    name: Optional[str] = None
    sequence: Optional[str] = None
    direction: Optional[str] = None
    target_gene: Optional[str] = None
    target_organism: Optional[str] = None
    tm_c: Optional[float] = None
    reference: Optional[str] = None
    elementa_primer_id: Optional[int] = None
    notes: Optional[str] = None


class PrimerRead(PrimerBase):
    id: int
    created_at: datetime
    tube_count: int = 0
    available_count: int = 0

    class Config:
        from_attributes = True
