from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ExtractBase(BaseModel):
    code: str
    source_organism: Optional[str] = None
    tissue_type: Optional[str] = None
    kit: Optional[str] = None
    extraction_date: Optional[date] = None
    specimen_code: Optional[str] = None
    elementa_extraction_ref: Optional[str] = None
    elementa_extraction_id: Optional[int] = None
    concentration_ng_ul: Optional[float] = None
    a260_280: Optional[float] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_shared: bool = False
    notes: Optional[str] = None


class ExtractCreate(ExtractBase):
    pass


class ExtractUpdate(BaseModel):
    code: Optional[str] = None
    source_organism: Optional[str] = None
    tissue_type: Optional[str] = None
    kit: Optional[str] = None
    extraction_date: Optional[date] = None
    specimen_code: Optional[str] = None
    elementa_extraction_ref: Optional[str] = None
    elementa_extraction_id: Optional[int] = None
    concentration_ng_ul: Optional[float] = None
    a260_280: Optional[float] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    is_shared: Optional[bool] = None
    notes: Optional[str] = None


class ExtractRead(ExtractBase):
    id: int
    created_at: datetime
    owner_display: Optional[str] = None
    tube_count: int = 0
    available_count: int = 0

    class Config:
        from_attributes = True
