from datetime import date, datetime, timezone
from typing import Optional
from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Integer,
    String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base

ITEM_TYPES = ("primer", "reagent", "extract")

# The whole of stock tracking: a coarse, human-set state. Nothing computes it,
# nothing decrements it, so nothing can drift out of step with the freezer.
REAGENT_STATES = ("sealed", "opened", "low", "empty")
STOCK_STATES = ("stock", "working", "low", "empty")


def states_for(item_type: str) -> tuple[str, ...]:
    return REAGENT_STATES if item_type == "reagent" else STOCK_STATES


class StoredItem(Base):
    """One physical tube or bottle sitting in a box slot.

    A single table for all three item types so that one query fills a box map,
    one search covers everything, and location logic is written once.
    """

    __tablename__ = "stored_items"
    __table_args__ = (
        UniqueConstraint("box_id", "row", "col", name="uq_item_box_position"),
        CheckConstraint(
            "(CASE WHEN primer_id IS NULL THEN 0 ELSE 1 END + "
            " CASE WHEN reagent_id IS NULL THEN 0 ELSE 1 END + "
            " CASE WHEN extract_id IS NULL THEN 0 ELSE 1 END) = 1",
            name="ck_item_exactly_one_parent",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    primer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("primers.id", ondelete="CASCADE"), nullable=True, index=True
    )
    reagent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("reagents.id", ondelete="CASCADE"), nullable=True, index=True
    )
    extract_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("extracts.id", ondelete="CASCADE"), nullable=True, index=True
    )

    box_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("boxes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    row: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    col: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    label: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    state: Mapped[str] = mapped_column(String(20), nullable=False, default="stock", index=True)

    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    owner_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    date_added: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    opened_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    lot_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    concentration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    concentration_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    volume_ul: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    primer = relationship("Primer", back_populates="items")
    reagent = relationship("Reagent", back_populates="items")
    extract = relationship("Extract", back_populates="items")
    box = relationship("Box", back_populates="items")
    owner = relationship("User", back_populates="items_owned")

    @property
    def parent_name(self) -> str:
        if self.primer:
            return self.primer.name
        if self.reagent:
            return self.reagent.name
        if self.extract:
            return self.extract.code
        return ""
