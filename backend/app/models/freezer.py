from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Freezer(Base):
    """A storage unit — a -80/-20 freezer, a fridge, an LN2 dewar or an RT cupboard.

    Boxes sit at a (shelf, slot) coordinate inside it, so `shelf_count` and
    `slots_per_shelf` define the grid the freezer map renders.
    """

    __tablename__ = "freezers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    kind: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    shelf_count: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    slots_per_shelf: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    boxes = relationship("Box", back_populates="freezer", cascade="all, delete-orphan")
