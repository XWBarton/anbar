from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

from .config import settings
from .crud.user import create_user, get_user_by_username
from .database import Base, SessionLocal, engine
from .models import (  # noqa: F401 — most imported so create_all sees every table
    AppSetting, Box, Extract, Freezer, LookupOption, Primer, Reagent, StoredItem, User,
)

SETUP_COMPLETED_KEY = "setup_completed"
from .routers import (
    admin, auth, boxes, export, extracts, freezers, integration, items,
    lookups, primers, reagents, search, setup, users,
)
from .schemas.user import UserCreate

# Seeded once, then owned by admins through Settings.
DEFAULT_LOOKUPS = {
    "freezer_kind": ["-80", "-20", "4 (fridge)", "RT", "LN2"],
    "box_kind": ["Primers", "Reagents", "Extracted DNA", "Mixed"],
    "reagent_category": ["Enzyme", "Buffer", "Kit", "Consumable", "Stain", "Solvent"],
    "extraction_kit": ["Qiagen DNeasy", "Qiagen QIAamp", "Zymo Quick-DNA", "Phenol-chloroform", "Chelex"],
    "concentration_unit": ["uM", "nM", "ng/uL", "mg/mL", "X"],
}


def create_tables():
    Base.metadata.create_all(bind=engine)


def run_migrations():
    """Add missing columns to existing tables without dropping data."""
    with engine.connect() as conn:
        add_column_migrations = [
            # (table, column, definition)
        ]
        for table, column, col_def in add_column_migrations:
            rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
            existing = {row[1] for row in rows}
            if column not in existing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"))
                conn.commit()
                print(f"[anbar] Migration: added {table}.{column}")


def _setup_completed(db) -> bool:
    return db.query(AppSetting).filter(AppSetting.key == SETUP_COMPLETED_KEY).first() is not None


def migrate_setup_completed_flag():
    """Infer 'setup already happened' for instances deployed before this flag
    existed, so upgrading never re-seeds a default admin on an already-live
    install. A real admin (any username other than the configured default)
    is proof setup ran; any leftover default-admin account from a restart
    under the old logic is a phantom with a known password, so it's removed
    rather than left as a standing login."""
    db = SessionLocal()
    try:
        if _setup_completed(db):
            return
        real_admin_exists = (
            db.query(User)
            .filter(User.username != settings.FIRST_ADMIN_USERNAME, User.is_admin == True)  # noqa: E712
            .first()
            is not None
        )
        if not real_admin_exists:
            return
        phantoms = db.query(User).filter(User.username == settings.FIRST_ADMIN_USERNAME).all()
        for phantom in phantoms:
            db.delete(phantom)
        db.add(AppSetting(key=SETUP_COMPLETED_KEY, value="true"))
        db.commit()
        if phantoms:
            print(f"[anbar] Migration: removed {len(phantoms)} leftover default-admin account(s)")
        print("[anbar] Migration: marked setup as already completed")
    finally:
        db.close()


def seed_default_admin():
    db = SessionLocal()
    try:
        if _setup_completed(db):
            return
        if not get_user_by_username(db, settings.FIRST_ADMIN_USERNAME):
            create_user(db, UserCreate(
                username=settings.FIRST_ADMIN_USERNAME,
                full_name=settings.FIRST_ADMIN_FULL_NAME,
                email=settings.FIRST_ADMIN_EMAIL,
                password=settings.FIRST_ADMIN_PASSWORD,
                is_admin=True,
            ))
            print(f"[anbar] Seeded default admin: {settings.FIRST_ADMIN_USERNAME}")
    finally:
        db.close()


def seed_lookups():
    db = SessionLocal()
    try:
        for category, values in DEFAULT_LOOKUPS.items():
            if db.query(LookupOption).filter(LookupOption.category == category).count():
                continue
            for order, value in enumerate(values):
                db.add(LookupOption(category=category, value=value, sort_order=order))
            print(f"[anbar] Seeded {len(values)} {category} options")
        db.commit()
    finally:
        db.close()


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="anbar API", version=settings.APP_VERSION)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = ["http://localhost:5173", "http://localhost:8410"]
if settings.CORS_ORIGINS:
    origins += [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(setup.router)
app.include_router(users.router)
app.include_router(freezers.router)
app.include_router(boxes.router)
app.include_router(items.router)
app.include_router(primers.router)
app.include_router(reagents.router)
app.include_router(extracts.router)
app.include_router(search.router)
app.include_router(lookups.router)
app.include_router(export.router)
app.include_router(admin.router)
app.include_router(integration.router)


@app.on_event("startup")
def on_startup():
    create_tables()
    run_migrations()
    migrate_setup_completed_flag()
    seed_default_admin()
    seed_lookups()


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}
