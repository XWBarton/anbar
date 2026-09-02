"""Single source of truth for how a physical location is written.

Every serializer that shows a location — item tables, search results, the
integration endpoints the sibling apps call, CSV export — formats through
`describe_location`, so a tube reads the same everywhere.
"""
from typing import Optional

SEP = " · "  # middle dot


def slot_label(row: Optional[int], col: Optional[int]) -> Optional[str]:
    """Position within a box, 1-indexed: row 1, col 4 -> 'A4'."""
    if row is None or col is None:
        return None
    if row < 1 or col < 1:
        return None
    letter = chr(ord("A") + row - 1) if row <= 26 else str(row)
    return f"{letter}{col}"


def parse_slot_label(label: str) -> Optional[tuple[int, int]]:
    """Inverse of `slot_label` — 'C4' -> (3, 4). Returns None if unparseable."""
    label = (label or "").strip().upper()
    if len(label) < 2 or not label[0].isalpha() or not label[1:].isdigit():
        return None
    return ord(label[0]) - ord("A") + 1, int(label[1:])


def describe_box(box) -> str:
    """'-20 A · Shelf 2 · Slot 1 · Box "Primers 2026"'"""
    if box is None:
        return ""
    parts = []
    if box.freezer is not None:
        parts.append(box.freezer.name)
    if box.shelf is not None:
        parts.append(f"Shelf {box.shelf}")
    if box.slot is not None:
        parts.append(f"Slot {box.slot}")
    parts.append(f'Box "{box.name}"')
    return SEP.join(parts)


def describe_location(item) -> str:
    """Full human-readable location of a stored item.

    Unplaced items say so rather than returning an empty string — 'no location'
    is a real answer to "where is it?".
    """
    if item is None or item.box is None:
        return "Unplaced"
    parts = [describe_box(item.box)]
    slot = slot_label(item.row, item.col)
    if slot:
        parts.append(slot)
    return SEP.join(p for p in parts if p)
