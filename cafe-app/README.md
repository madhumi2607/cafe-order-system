# Campus Cafe Order System

Simple order management system for a college cafe. No login, no fuss.

---

## What it does

**Customer side** (`/`)
- Browse active menu items grouped by category
- Add items with +/- quantity controls
- Enter name, department, pickup time slot
- Pay via UPI QR and upload screenshot
- Get an order ID on confirmation

**Admin side** (`/admin`)
- View all incoming orders in real time (auto-refreshes every 15 sec)
- Click an order to see items, total, payment screenshot
- Update order status: Pending → Preparing → Ready → Done
- Manage menu: add items, toggle active/inactive, delete

---

## Setup

### Requirements
- Python 3.8+
- pip packages: `flask flask-cors`
- Node.js 18+ (for frontend dev only)

### Install backend
```bash
pip install flask flask-cors
```

### Run backend
```bash
cd backend
python3 server.py
```
Backend starts at `http://localhost:5000`

### Dev (frontend with hot reload)
```bash
cd frontend
npm install
npm run dev
```
Frontend at `http://localhost:5173`
Admin at `http://localhost:5173/admin`

### Production build
```bash
cd frontend
npm run build
```
Then serve the `frontend/dist` folder via Flask or any static host.

---

## Serving frontend from Flask (production)

Add this to `backend/server.py` to serve the built frontend:

```python
from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    dist = os.path.join(os.path.dirname(__file__), '../frontend/dist')
    if path and os.path.exists(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    return send_from_directory(dist, 'index.html')
```

Then just run `python3 server.py` — both frontend and API at `localhost:5000`.

---

## Files

```
cafe-app/
├── backend/
│   ├── server.py        # Flask API + SQLite
│   ├── cafe.db          # Auto-created on first run
│   └── uploads/         # Payment screenshots stored here
├── frontend/
│   ├── src/
│   │   ├── pages/OrderPage.jsx    # Customer order flow
│   │   ├── pages/AdminPage.jsx    # Admin dashboard
│   │   └── App.jsx
│   └── dist/            # Built frontend (after npm run build)
└── start.sh
```

---

## Customise

**Menu items** — Log in to `/admin` → Menu tab → Add/remove items anytime.

**Pickup slots** — Edit `PICKUP_SLOTS` array in `frontend/src/pages/OrderPage.jsx`.

**UPI QR** — Replace the placeholder SVG in `OrderPage.jsx` Step 3 with:
```jsx
<img src="/your-qr.png" width="160" height="160" />
```
Put `your-qr.png` in `frontend/public/`.

**Admin password** — Currently open. To add basic protection, add a simple password check in `AdminPage.jsx` or use HTTP Basic Auth in Flask.
