from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Primer(Base):
    """A primer design — the identity, not a tube.

    Field names deliberately track Elementa's primer library so a design can be
    linked or imported without translation.
    """

    __tablename__ = "primers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    sequence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    direction: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # F / R
    target_gene: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    target_organism: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, index=True)
    tm_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    elementa_primer_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship("StoredItem", back_populates="primer", cascade="all, delete-orphan")
