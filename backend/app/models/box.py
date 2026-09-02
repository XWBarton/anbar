from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Box(Base):
    """A physical box, and its position within a freezer.

    `shelf` / `slot` place the box in the freezer; `rows` / `cols` define the
    grid of tube positions inside it. Both positions are nullable so a box can
    be created before it is placed, or kept unplaced on the bench.
    """

    __tablename__ = "boxes"
    __table_args__ = (
        UniqueConstraint("freezer_id", "shelf", "slot", name="uq_box_freezer_position"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    freezer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("freezers.id", ondelete="CASCADE"), nullable=True, index=True
    )
    shelf: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    slot: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rows: Mapped[int] = mapped_column(Integer, default=9, nullable=False)
    cols: Mapped[int] = mapped_column(Integer, default=9, nullable=False)
    kind: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    owner_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    freezer = relationship("Freezer", back_populates="boxes")
    owner = relationship("User", back_populates="boxes_owned")
    items = relationship("StoredItem", back_populates="box")
