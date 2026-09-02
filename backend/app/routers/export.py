import csv
import io
from typing import Optional
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..crud import stored_item as item_crud
from ..dependencies import get_current_user, get_db
from ..models.user import User

router = APIRouter(prefix="/export", tags=["export"])

FIELDS = [
    "id", "item_type", "name", "label", "state", "location", "freezer", "box",
    "slot", "owner", "date_added", "opened_date", "lot_number", "expiry_date",
    "concentration", "concentration_unit", "volume_ul", "notes",
]


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

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=FIELDS, extrasaction="ignore")
    writer.writeheader()
    for item in items:
        read = item_crud.to_read(item)
        writer.writerow({
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
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="anbar-inventory.csv"'},
    )
