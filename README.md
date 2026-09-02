<p align="center">
  <img src="anbar-logo.png" alt="anbār" height="120" />
</p>

# anbār

> *انبار — a storehouse, magazine or granary; the place where a thing is kept until it is wanted.*

anbār is the freezer and fridge inventory for a molecular lab. It answers one question —
**where is it right now?** — for primers, reagents and extracted DNA.

It is the fourth of a family: [Tessera](../tessera) tracks specimens, [Elementa](../elementa)
tracks molecular runs, [Forma](../forma) records field data, and anbār holds the physical
location of everything in cold storage.

---

## Features

### Storage that matches the room
- **Freezers** — −80, −20, fridges, LN2 dewars, RT cupboards; each with a shelf × slot layout
- **Boxes** sit at a real position in a freezer (shelf 2, slot 1), and carry their own grid
  of tube positions — rows lettered A–Z, columns numbered
- **Freezer map** — see every shelf at a glance and how full each box is; click an empty slot
  to put a box there
- **Box map** — the grid of slots, coloured by item type, click a cell to view, place or clear
  a tube
- Opening a freezer lists its boxes first, with the shelf × slot layout underneath
- One tube per slot and one box per freezer position, enforced by the database
- A full location reads the same everywhere: `−20 A · Shelf 2 · Slot 1 · Box "Primers 2026" · C4`

### Designs and their tubes
A primer, reagent or extract is recorded **once** with its identity. Its physical tubes are
recorded separately against it, each with its own location, owner and state — so one primer
design can have a stock aliquot in one box and a working dilution in another without
duplicating the sequence. Its page lists one row per **box** that holds it, expandable to the
individual tubes.

- **Primers** — name, sequence, direction, target gene, target organism, Tm, reference
- **Reagents** — name, category, supplier, catalogue number at the product level; lot number,
  expiry and opened date on each bottle
- **Extracted DNA** — source organism, tissue, kit, extraction date, concentration, A260/280,
  plus links to the Tessera specimen and the Elementa run that produced it

### States, not quantities
anbār deliberately does **not** track volumes. A number that is only right when everybody
remembers to log a withdrawal is worse than no number at all. Each tube carries one coarse
state that a person sets by hand:

| Applies to | States |
|---|---|
| Reagents | `sealed` → `opened` → `low` → `empty` |
| Primers, DNA | `stock` / `working` → `low` → `empty` |

Marking a tube **empty** releases its slot so the space can be reused, while keeping the record
as history until someone deletes it. Marking a reagent **opened** stamps the opened date
automatically.

### Ownership
A tube belongs to a user with an anbār login, to a name typed by hand for people without one,
or to the lab at large when marked **shared**.

### Finding things
- **Find** — one search box across all three item types, answering with every tube and its
  resolved location
- **Dashboard** — live shelf × slot maps of the freezers you choose (tick and reorder them
  under *Customise*), plus counts by type, per-freezer occupancy, recently added, and anything
  marked low or empty
- **Export** — CSV of every tube with its location, filterable by type and freezer

---

## Working with the rest of the family

Integration is **read-only in both directions**, which is what keeps it safe: anbār never
mutates Elementa or Tessera, and neither of them may mutate inventory.

**anbār → siblings.** With a URL and API token set in Settings:
- import a primer design straight out of Elementa's library instead of retyping it
- link an extract to the Elementa extraction that produced it
- resolve a Tessera specimen code against the live Tessera instance
- deep links to both apps on the records that carry a reference

**siblings → anbār.** With an anbār API token set in Settings, Elementa and Tessera can ask
where something is:

```
GET /integration/locate/primer?name=16S-F
GET /integration/locate/extract?elementa_ref=EXT-42
GET /integration/locate/extract?specimen_code=AMPH2026-004
GET /integration/summary
```

Each returns every matching tube with its state and full location — enough for an Elementa PCR
form to show `16S-F: −20 A · Box 3 · C4 (working)` beside the primer field.

If a sibling is unconfigured or offline, its links and search boxes simply do not appear.
Nothing in anbār stops working.

---

## Quick start

```bash
cp .env.example .env          # then edit SECRET_KEY at minimum
docker compose up -d --build
```

Open http://localhost:8410 and complete the first-run setup — it creates your administrator
account and removes the seeded default admin.

Family ports: Tessera `8520`, Elementa `8231`, Forma `8312`, anbār `8410`.

### Development

```bash
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
DATABASE_URL="sqlite:///./dev.db" .venv/bin/uvicorn app.main:app --reload

# frontend (proxies /api to :8000)
cd frontend
npm install && npm run dev
```

`http://localhost:8000/docs` has the full API.

---

## Stack

FastAPI · SQLAlchemy 2 · SQLite (WAL) · JWT auth · React 18 · Vite · Ant Design ·
TanStack Query · nginx · Docker — the same stack as the rest of the family.
# update-script live test Wed  2 Sep 2026 11:44:11 AWST
