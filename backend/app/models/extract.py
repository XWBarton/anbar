from datetime import date, datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Extract(Base):
    """Extracted DNA from one extraction event.

    `specimen_code` points back at Tessera, `elementa_extraction_id` /
    `elementa_extraction_ref` at the Elementa run that produced it.
    """

    __tablename__ = "extracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    source_organism: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    tissue_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    kit: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    extraction_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    specimen_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    elementa_extraction_ref: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    elementa_extraction_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    concentration_ng_ul: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    a260_280: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    owner_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="extracts_owned")
    items = relationship("StoredItem", back_populates="extract", cascade="all, delete-orphan")
