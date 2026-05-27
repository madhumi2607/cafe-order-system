from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, os, uuid, base64
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'cafe.db')
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        active INTEGER DEFAULT 1
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        department TEXT NOT NULL,
        pickup_slot TEXT NOT NULL,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        screenshot_path TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
    )''')
    # Seed default menu items if empty
    c.execute('SELECT COUNT(*) FROM menu_items')
    if c.fetchone()[0] == 0:
        defaults = [
            (str(uuid.uuid4()), 'Tea', 10, 'Beverages', 1),
            (str(uuid.uuid4()), 'Coffee', 20, 'Beverages', 1),
            (str(uuid.uuid4()), 'Cold Coffee', 40, 'Beverages', 1),
            (str(uuid.uuid4()), 'Lime Soda', 30, 'Beverages', 1),
            (str(uuid.uuid4()), 'Veg Puff', 20, 'Snacks', 1),
            (str(uuid.uuid4()), 'Egg Puff', 25, 'Snacks', 1),
            (str(uuid.uuid4()), 'Veg Sandwich', 40, 'Snacks', 1),
            (str(uuid.uuid4()), 'Chicken Sandwich', 60, 'Snacks', 1),
            (str(uuid.uuid4()), 'Maggi', 35, 'Meals', 1),
            (str(uuid.uuid4()), 'Veg Fried Rice', 60, 'Meals', 1),
        ]
        c.executemany('INSERT INTO menu_items VALUES (?,?,?,?,?)', defaults)
    conn.commit()
    conn.close()

init_db()

# --- MENU ROUTES ---
@app.route('/menu', methods=['GET'])
def get_menu():
    conn = get_db()
    items = conn.execute('SELECT * FROM menu_items ORDER BY category, name').fetchall()
    conn.close()
    return jsonify([dict(i) for i in items])

@app.route('/menu/active', methods=['GET'])
def get_active_menu():
    conn = get_db()
    items = conn.execute('SELECT * FROM menu_items WHERE active=1 ORDER BY category, name').fetchall()
    conn.close()
    return jsonify([dict(i) for i in items])

@app.route('/menu', methods=['POST'])
def add_menu_item():
    data = request.json
    if not data.get('name') or not data.get('price') or not data.get('category'):
        return jsonify({'error': 'name, price, category required'}), 400
    item_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute('INSERT INTO menu_items VALUES (?,?,?,?,1)',
                 (item_id, data['name'], float(data['price']), data['category']))
    conn.commit()
    conn.close()
    return jsonify({'id': item_id, 'message': 'Item added'}), 201

@app.route('/menu/<item_id>', methods=['PATCH'])
def toggle_item(item_id):
    data = request.json
    conn = get_db()
    conn.execute('UPDATE menu_items SET active=? WHERE id=?', (int(data['active']), item_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Updated'})

@app.route('/menu/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db()
    conn.execute('DELETE FROM menu_items WHERE id=?', (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'})

# --- ORDER ROUTES ---
@app.route('/orders', methods=['POST'])
def place_order():
    data = request.json
    required = ['customer_name', 'department', 'pickup_slot', 'items', 'total']
    for f in required:
        if f not in data:
            return jsonify({'error': f'{f} is required'}), 400
    if not data['items']:
        return jsonify({'error': 'No items in order'}), 400

    order_id = str(uuid.uuid4())[:8].upper()
    screenshot_path = None

    # Handle base64 screenshot
    if data.get('screenshot'):
        try:
            header, encoded = data['screenshot'].split(',', 1)
            ext = 'jpg' if 'jpeg' in header else 'png'
            filename = f"{order_id}.{ext}"
            filepath = os.path.join(UPLOADS_DIR, filename)
            with open(filepath, 'wb') as f:
                f.write(base64.b64decode(encoded))
            screenshot_path = filename
        except Exception as e:
            return jsonify({'error': f'Screenshot upload failed: {str(e)}'}), 400

    import json
    conn = get_db()
    conn.execute('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?)', (
        order_id,
        data['customer_name'],
        data['department'],
        data['pickup_slot'],
        json.dumps(data['items']),
        float(data['total']),
        screenshot_path,
        'pending',
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return jsonify({'order_id': order_id, 'message': 'Order placed!'}), 201

@app.route('/orders', methods=['GET'])
def get_orders():
    import json
    conn = get_db()
    orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    conn.close()
    result = []
    for o in orders:
        d = dict(o)
        d['items'] = json.loads(d['items'])
        result.append(d)
    return jsonify(result)

@app.route('/orders/<order_id>', methods=['PATCH'])
def update_order_status(order_id):
    data = request.json
    conn = get_db()
    conn.execute('UPDATE orders SET status=? WHERE id=?', (data['status'], order_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Status updated'})

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(UPLOADS_DIR, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)