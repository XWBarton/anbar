from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..crud import extract as extract_crud
from ..crud import primer as primer_crud
from ..crud import reagent as reagent_crud
from ..crud import stored_item as item_crud
from ..dependencies import get_current_user, get_db
from ..models.user import User

router = APIRouter(prefix="/search", tags=["search"])


def _tubes(db: Session, **filters):
    return [
        {
            "id": i.id,
            "label": i.label,
            "state": i.state,
            "location": item_crud.to_read(i).location,
            "slot_label": item_crud.to_read(i).slot_label,
            "owner_display": item_crud.owner_display(i),
        }
        for i in item_crud.get_items(db, include_empty=True, **filters)
    ]


@router.get("/")
def search(
    q: str = "",
    item_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """One box, one question: where is it? Searches all three item types and
    answers with every tube and its resolved location."""
    q = (q or "").strip()
    if len(q) < 2:
        return {"query": q, "results": []}

    results = []

    if item_type in (None, "primer"):
        for p in primer_crud.get_primers(db, q=q):
            results.append({
                "kind": "primer",
                "id": p.id,
                "name": p.name,
                "subtitle": " · ".join(x for x in [p.target_gene, p.target_organism, p.direction] if x),
                "tubes": _tubes(db, primer_id=p.id),
            })

    if item_type in (None, "reagent"):
        for r in reagent_crud.get_reagents(db, q=q):
            results.append({
                "kind": "reagent",
                "id": r.id,
                "name": r.name,
                "subtitle": " · ".join(x for x in [r.category, r.supplier, r.catalogue_number] if x),
                "tubes": _tubes(db, reagent_id=r.id),
            })

    if item_type in (None, "extract"):
        for e in extract_crud.get_extracts(db, q=q):
            results.append({
                "kind": "extract",
                "id": e.id,
                "name": e.code,
                "subtitle": " · ".join(x for x in [e.source_organism, e.kit, e.specimen_code] if x),
                "tubes": _tubes(db, extract_id=e.id),
            })

    return {"query": q, "results": results}


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Dashboard counts — items by type and by state, plus what needs a look."""
    from ..models.box import Box
    from ..models.freezer import Freezer
    from ..models.stored_item import StoredItem

    by_type, by_state = {}, {}
    for item in db.query(StoredItem).all():
        by_type[item.item_type] = by_type.get(item.item_type, 0) + 1
        by_state[item.state] = by_state.get(item.state, 0) + 1

    needs_attention = [
        item_crud.to_read(i).model_dump()
        for i in item_crud.get_items(db, include_empty=True)
        if i.state in ("low", "empty")
    ]
    recent = [item_crud.to_read(i).model_dump() for i in item_crud.get_items(db)[:8]]

    return {
        "freezers": db.query(Freezer).count(),
        "boxes": db.query(Box).count(),
        "primers": db.query(StoredItem).filter(StoredItem.item_type == "primer").count(),
        "reagents": db.query(StoredItem).filter(StoredItem.item_type == "reagent").count(),
        "extracts": db.query(StoredItem).filter(StoredItem.item_type == "extract").count(),
        "by_type": by_type,
        "by_state": by_state,
        "needs_attention": needs_attention,
        "recent": recent,
    }
