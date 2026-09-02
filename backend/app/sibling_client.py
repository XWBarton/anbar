"""Outbound calls to the sibling apps — Elementa and Tessera.

Deliberately fire-and-forget in spirit: every failure is logged and swallowed so
that a sibling being down, mid-deploy or misconfigured never blocks inventory
work. anbar only ever *reads* from its siblings.

Mirrors elementa/backend/app/tessera_client.py, which is the established pattern
for app-to-app calls in this family.
"""
import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from sqlalchemy.orm import Session

from .models.app_setting import AppSetting

log = logging.getLogger(__name__)

TIMEOUT = 8

# app -> (url setting key, token setting key, internal-url env var)
APPS = {
    "elementa": ("elementa_url", "elementa_api_token", "ELEMENTA_INTERNAL_URL"),
    "tessera": ("tessera_url", "tessera_api_token", "TESSERA_INTERNAL_URL"),
}


def settings_map(db: Session) -> dict[str, str]:
    return {s.key: s.value for s in db.query(AppSetting).all()}


def server_url(url: str, env_var: str) -> str:
    """Prefer the internal URL on same-server or tunnelled deployments,
    otherwise rewrite localhost so the request escapes the container."""
    internal = os.environ.get(env_var, "").strip()
    if internal:
        return internal.rstrip("/")
    return re.sub(r"(?i)^(https?://)localhost\b", r"\1host.docker.internal", url.rstrip("/"))


def credentials(db: Session, app: str) -> tuple[str, str]:
    url_key, token_key, env_var = APPS[app]
    settings = settings_map(db)
    url = settings.get(url_key, "").strip()
    token = settings.get(token_key, "").strip()
    return (server_url(url, env_var) if url else ""), token


def _get(url: str, token: str, path: str, params: dict | None = None):
    query = f"?{urllib.parse.urlencode(params)}" if params else ""
    req = urllib.request.Request(
        f"{url}{path}{query}",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read())


def ping(db: Session, app: str) -> tuple[bool, str]:
    """Check a sibling's URL and token. Returns (ok, message)."""
    url, token = credentials(db, app)
    if not url:
        return False, f"{app.title()} URL not configured"
    if not token:
        return False, f"{app.title()} API token not configured"
    probe = "/api/specimens/?limit=1" if app == "tessera" else "/api/primers/?q="
    try:
        _get(url, token, probe)
        return True, "ok"
    except urllib.error.HTTPError as e:
        return False, f"{app.title()} rejected the request ({e.code}) — check the API token"
    except Exception as e:
        log.error("%s connection failed: %s", app, e)
        return False, f"Could not reach {app.title()}"


def search_elementa_extractions(db: Session, q: str) -> list[dict]:
    url, token = credentials(db, "elementa")
    if not url or not token or len(q) < 2:
        return []
    try:
        data = _get(url, token, "/api/extractions/", {"q": q, "limit": 10})
        items = data.get("items", []) if isinstance(data, dict) else data
        return [
            {
                "id": e.get("id"),
                "specimen_code": e.get("specimen_code"),
                "extraction_type": e.get("extraction_type"),
                "kit": e.get("kit"),
                "date": e.get("date"),
                "yield_ng_ul": e.get("yield_ng_ul"),
            }
            for e in items[:10]
        ]
    except Exception as e:
        log.error("Elementa extraction search failed: %s", e)
        return []


def search_elementa_primers(db: Session, q: str) -> list[dict]:
    url, token = credentials(db, "elementa")
    if not url or not token or len(q) < 2:
        return []
    try:
        data = _get(url, token, "/api/primers/", {"q": q})
        items = data.get("items", []) if isinstance(data, dict) else data
        return [
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "sequence": p.get("sequence"),
                "direction": p.get("direction"),
                "target_gene": p.get("target_gene"),
                "target_organism": p.get("target_taxa"),
                "tm_c": p.get("annealing_temp_c"),
                "reference": p.get("reference"),
            }
            for p in items[:20]
        ]
    except Exception as e:
        log.error("Elementa primer search failed: %s", e)
        return []


def search_tessera_specimens(db: Session, q: str) -> list[dict]:
    url, token = credentials(db, "tessera")
    if not url or not token or len(q) < 2:
        return []
    try:
        data = _get(url, token, "/api/specimens/", {"search": q, "limit": 10})
        items = data.get("items", []) if isinstance(data, dict) else data
        return [
            {
                "specimen_code": s.get("specimen_code"),
                "collection_date": s.get("collection_date"),
                "project_code": (s.get("project") or {}).get("code", ""),
            }
            for s in items[:10]
        ]
    except Exception as e:
        log.error("Tessera specimen search failed: %s", e)
        return []
