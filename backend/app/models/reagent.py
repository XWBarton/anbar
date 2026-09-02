from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Reagent(Base):
    """A reagent product. Supplier and catalogue number belong here; lot number
    and expiry belong to the individual bottle (StoredItem)."""

    __tablename__ = "reagents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    supplier: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    catalogue_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship("StoredItem", back_populates="reagent", cascade="all, delete-orphan")
