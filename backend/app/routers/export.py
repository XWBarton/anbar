import csv
import io
import os
import re
import sqlite3
import tempfile
import zipfile
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from ..crud import box as box_crud
from ..crud import stored_item as item_crud
from ..database import engine
from ..dependencies import get_current_user, get_db, require_admin
from ..models.user import User

router = APIRouter(prefix="/export", tags=["export"])

FIELDS = [
    "id", "item_type", "name", "label", "state", "location", "freezer", "box",
    "slot", "owner", "date_added", "opened_date", "lot_number", "expiry_date",
    "concentration", "concentration_unit", "volume_ul", "notes",
]


def _item_row(item) -> dict:
    read = item_crud.to_read(item)
    return {
        "id": read.id,
        "item_type": read.item_type,
        "name": read.name or "",
        "label": read.label or "",
        "state": read.state,
        "location": read.location or "",
        "freezer": read.freezer_name or "",
        "box": read.box_name or "",
        "slot": read.slot_label or "",
        "owner": read.owner_display or "",
        "date_added": read.date_added or "",
        "opened_date": read.opened_date or "",
        "lot_number": read.lot_number or "",
        "expiry_date": read.expiry_date or "",
        "concentration": read.concentration if read.concentration is not None else "",
        "concentration_unit": read.concentration_unit or "",
        "volume_ul": read.volume_ul if read.volume_ul is not None else "",
        "notes": read.notes or "",
    }


def _write_csv(items) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=FIELDS, extrasaction="ignore")
    writer.writeheader()
    for item in items:
        writer.writerow(_item_row(item))
    return output.getvalue()


def _safe_filename(name: str, fallback: str) -> str:
    name = (name or fallback).strip()
    name = re.sub(r"[^A-Za-z0-9 _.-]", "_", name)
    return name or fallback


@router.get("/items.csv")
def export_items(
    item_type: Optional[str] = None,
    freezer_id: Optional[int] = None,
    include_empty: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items = item_crud.get_items(
        db, item_type=item_type, freezer_id=freezer_id, include_empty=include_empty
    )
    csv_text = _write_csv(items)
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="anbar-inventory.csv"'},
    )


@router.get("/boxes.zip")
def export_boxes_zip(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """One CSV per box, plus one for items with no box, bundled in a zip."""
    buffer = io.BytesIO()
    used_names: set[str] = set()

    def unique_name(base: str) -> str:
        name = f"{base}.csv"
        n = 2
        while name in used_names:
            name = f"{base} ({n}).csv"
            n += 1
        used_names.add(name)
        return name

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for box in box_crud.get_boxes(db):
            items = item_crud.get_items(db, box_id=box.id, include_empty=True)
            items = sorted(items, key=lambda i: (i.row is None, i.row or 0, i.col or 0))
            filename = unique_name(_safe_filename(box.name, f"box-{box.id}"))
            zf.writestr(filename, _write_csv(items))

        unassigned = [i for i in item_crud.get_items(db, include_empty=True) if i.box_id is None]
        if unassigned:
            zf.writestr(unique_name("Unassigned"), _write_csv(unassigned))

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="anbar-boxes.zip"'},
    )


@router.get("/database.sqlite")
def export_database(
    _: User = Depends(require_admin),
):
    """A consistent full-database snapshot, taken via SQLite's backup API so
    it's safe to run while the app is live under WAL mode."""
    source_path = engine.url.database

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()

    source = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
    try:
        dest = sqlite3.connect(tmp.name)
        try:
            source.backup(dest)
        finally:
            dest.close()
    finally:
        source.close()

    def cleanup():
        try:
            os.unlink(tmp.name)
        except OSError:
            pass

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return StreamingResponse(
        open(tmp.name, "rb"),
        media_type="application/vnd.sqlite3",
        headers={"Content-Disposition": f'attachment; filename="anbar-backup-{stamp}.db"'},
        background=BackgroundTask(cleanup),
    )
