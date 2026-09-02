"""The read-only API the sibling apps call to ask "where is it?".

Authenticated with a shared token an admin sets in Settings, matching how
Tessera exposes its endpoints to Elementa. Nothing here mutates inventory —
that one-way rule is what keeps the coupling safe.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..crud import extract as extract_crud
from ..crud import primer as primer_crud
from ..crud import stored_item as item_crud
from ..dependencies import get_db
from ..models.app_setting import AppSetting
from ..models.stored_item import StoredItem

router = APIRouter(prefix="/integration", tags=["integration"])


def require_api_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> None:
    configured = db.query(AppSetting).filter(AppSetting.key == "anbar_api_token").first()
    if not configured or not configured.value.strip():
        raise HTTPException(status_code=503, detail="anbar API token not configured")
    supplied = (authorization or "").removeprefix("Bearer ").strip()
    if supplied != configured.value.strip():
        raise HTTPException(status_code=401, detail="Invalid API token")


def _tube(item: StoredItem) -> dict:
    read = item_crud.to_read(item)
    return {
        "id": read.id,
        "label": read.label,
        "state": read.state,
        "location": read.location,
        "freezer": read.freezer_name,
        "box": read.box_name,
        "slot": read.slot_label,
        "owner": read.owner_display,
        "concentration": read.concentration,
        "concentration_unit": read.concentration_unit,
    }


@router.get("/locate/primer", dependencies=[Depends(require_api_token)])
def locate_primer(name: str = "", db: Session = Depends(get_db)):
    """Every tube of a primer, by design name. Lets an Elementa PCR form show
    '16S-F: -20 A · Box 3 · C4 (working)' beside the primer field."""
    primer = primer_crud.get_primer_by_name(db, name.strip())
    if not primer:
        return {"found": False, "name": name, "tubes": []}
    tubes = item_crud.get_items(db, primer_id=primer.id, include_empty=True)
    return {
        "found": True,
        "name": primer.name,
        "target_gene": primer.target_gene,
        "target_organism": primer.target_organism,
        "tubes": [_tube(i) for i in tubes],
    }


@router.get("/locate/extract", dependencies=[Depends(require_api_token)])
def locate_extract(
    elementa_ref: Optional[str] = None,
    specimen_code: Optional[str] = None,
    code: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Extracted DNA by Elementa run reference, Tessera specimen code, or anbar code."""
    from ..models.extract import Extract

    query = db.query(Extract)
    if elementa_ref:
        query = query.filter(Extract.elementa_extraction_ref == elementa_ref)
    elif specimen_code:
        query = query.filter(Extract.specimen_code == specimen_code)
    elif code:
        query = query.filter(Extract.code == code)
    else:
        raise HTTPException(status_code=400, detail="Give one of elementa_ref, specimen_code or code")

    extracts = query.all()
    return {
        "found": bool(extracts),
        "extracts": [
            {
                "code": e.code,
                "source_organism": e.source_organism,
                "kit": e.kit,
                "extraction_date": str(e.extraction_date) if e.extraction_date else None,
                "specimen_code": e.specimen_code,
                "elementa_extraction_ref": e.elementa_extraction_ref,
                "owner": item_crud.owner_display(e),
                "tubes": [_tube(i) for i in item_crud.get_items(db, extract_id=e.id, include_empty=True)],
            }
            for e in extracts
        ],
    }


@router.get("/summary", dependencies=[Depends(require_api_token)])
def summary(db: Session = Depends(get_db)):
    """Counts a sibling dashboard widget can show."""
    from ..models.box import Box
    from ..models.freezer import Freezer

    return {
        "freezers": db.query(Freezer).count(),
        "boxes": db.query(Box).count(),
        "tubes": db.query(StoredItem).count(),
        "primers": db.query(StoredItem).filter(StoredItem.item_type == "primer").count(),
        "reagents": db.query(StoredItem).filter(StoredItem.item_type == "reagent").count(),
        "extracts": db.query(StoredItem).filter(StoredItem.item_type == "extract").count(),
        "low_or_empty": db.query(StoredItem).filter(StoredItem.state.in_(("low", "empty"))).count(),
    }
