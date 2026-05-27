import { useState, useEffect } from 'react'
import styles from './AdminPage.module.css'

const API = ''
const CATEGORIES = ['Beverages', 'Snacks', 'Meals', 'Desserts', 'Other']
const STATUS_COLORS = { pending: '#c9943a', preparing: '#4a9eff', ready: '#5aab7a', done: '#6b5540' }

export default function AdminPage() {
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [menu, setMenu] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Beverages' })
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchOrders = async () => {
    const res = await fetch(`${API}fetch("https://cafe-order-system-stl6.onrender.com/api/menu")/orders`)
    setOrders(await res.json())
  }
  const fetchMenu = async () => {
    const res = await fetch(`${API}fetch("https://cafe-order-system-stl6.onrender.com/api/menu")/menu`)
    setMenu(await res.json())
  }

  useEffect(() => {
    fetchOrders(); fetchMenu()
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [])

  const updateStatus = async (id, status) => {
    await fetch(`${API}fetch("https://cafe-order-system-stl6.onrender.com/api/menu")/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    fetchOrders()
    setSelectedOrder(prev => prev?.id === id ? {...prev, status} : prev)
  }

  const toggleItem = async (id, active) => {
    await fetch(`${API}fetch("https://cafe-order-system-stl6.onrender.com/api/menu")/menu/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: active ? 0 : 1 }) })
    fetchMenu()
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    await fetch(`${API}fetch("https://cafe-order-system-stl6.onrender.com/api/menu")/menu/${id}`, { method: 'DELETE' })
    fetchMenu()
  }

  const addItem = async () => {
    if (!newItem.name || !newItem.price) return
    setLoading(true)
    await fetch(`${API}fetch("https://cafe-order-system-stl6.onrender.com/api/menu")/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newItem, price: parseFloat(newItem.price) }) })
    setNewItem({ name: '', price: '', category: 'Beverages' }); setAdding(false); setLoading(false); fetchMenu()
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const grouped = menu.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {})
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <img src="/logo.jpeg" alt="Velaa Café" className={styles.sideLogo} />
          <div className={styles.sideTitle}>VELAA CAFÉ</div>
          <div className={styles.sideTag}>Admin Panel</div>
        </div>
        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${tab === 'orders' ? styles.active : ''}`} onClick={() => setTab('orders')}>
            📋 Orders {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
          </button>
          <button className={`${styles.navItem} ${tab === 'menu' ? styles.active : ''}`} onClick={() => setTab('menu')}>
            🍽️ Menu Items
          </button>
        </nav>
        <div className={styles.sideFooter}>
          <a href="/" className={styles.viewStore}>← Customer View</a>
        </div>
      </aside>

      <main className={styles.content}>
        {/* ORDERS */}
        {tab === 'orders' && (
          <div className={styles.ordersLayout}>
            <div className={styles.ordersList}>
              <div className={styles.contentHeader}>
                <h2>Orders</h2>
                <button className={styles.refreshBtn} onClick={fetchOrders}>↺ Refresh</button>
              </div>
              {orders.length === 0 && <div className={styles.empty}>No orders yet. Waiting for students...</div>}
              {orders.map(order => (
                <div key={order.id} className={`${styles.orderCard} ${selectedOrder?.id === order.id ? styles.orderSelected : ''}`} onClick={() => setSelectedOrder(order)}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderName}>{order.customer_name}</span>
                    <span className={styles.orderStatus} style={{ color: STATUS_COLORS[order.status] }}>{order.status}</span>
                  </div>
                  <div className={styles.orderMeta}>
                    <span>{order.department}</span><span>·</span><span>{order.pickup_slot}</span><span>·</span><span>₹{order.total}</span>
                  </div>
                  <div className={styles.orderTime}>{formatTime(order.created_at)}</div>
                </div>
              ))}
            </div>

            <div className={styles.orderDetail}>
              {!selectedOrder ? (
                <div className={styles.noSelection}>
                  <span className={styles.noSelectionIcon}>📋</span>
                  <span>Select an order to view details</span>
                </div>
              ) : (
                <>
                  <div className={styles.detailHeader}>
                    <div>
                      <div className={styles.detailId}>ORDER #{selectedOrder.id}</div>
                      <div className={styles.detailName}>{selectedOrder.customer_name}</div>
                      <div className={styles.detailMeta}>{selectedOrder.department} · Pickup at {selectedOrder.pickup_slot}</div>
                    </div>
                  </div>
                  <div className={styles.detailItems}>
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className={styles.detailItem}>
                        <span>{item.name} × {item.qty}</span>
                        <span>₹{item.price * item.qty}</span>
                      </div>
                    ))}
                    <div className={styles.detailItemTotal}>
                      <span>Total</span><span>₹{selectedOrder.total}</span>
                    </div>
                  </div>
                  {selectedOrder.screenshot_path && (
                    <div className={styles.screenshotSection}>
                      <div className={styles.screenshotLabel}>Payment Screenshot</div>
                      <img src={`${API}/uploads/${selectedOrder.screenshot_path}`} alt="Payment" className={styles.screenshot} />
                    </div>
                  )}
                  <div className={styles.statusBtns}>
                    {['pending','preparing','ready','done'].map(s => (
                      <button key={s} className={`${styles.statusBtn} ${selectedOrder.status === s ? styles.statusActive : ''}`}
                        style={selectedOrder.status === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
                        onClick={() => updateStatus(selectedOrder.id, s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MENU */}
        {tab === 'menu' && (
          <div className={styles.menuAdmin}>
            <div className={styles.contentHeader}>
              <h2>Menu Items</h2>
              <button className={styles.addItemBtn} onClick={() => setAdding(true)}>+ Add Item</button>
            </div>
            {adding && (
              <div className={styles.addForm}>
                <input className={styles.input} placeholder="Item name" value={newItem.name} onChange={e => setNewItem(p => ({...p, name: e.target.value}))} />
                <input className={styles.input} placeholder="Price (₹)" type="number" value={newItem.price} onChange={e => setNewItem(p => ({...p, price: e.target.value}))} />
                <select className={styles.input} value={newItem.category} onChange={e => setNewItem(p => ({...p, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <div className={styles.addFormBtns}>
                  <button className={styles.cancelBtn} onClick={() => setAdding(false)}>Cancel</button>
                  <button className={styles.saveBtn} onClick={addItem} disabled={loading}>{loading ? 'Adding...' : 'Add Item'}</button>
                </div>
              </div>
            )}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className={styles.menuSection}>
                <div className={styles.menuCatLabel}>{cat}</div>
                {items.map(item => (
                  <div key={item.id} className={`${styles.menuAdminItem} ${!item.active ? styles.inactive : ''}`}>
                    <div className={styles.menuItemLeft}>
                      <span className={styles.menuItemName}>{item.name}</span>
                      <span className={styles.menuItemPrice}>₹{item.price}</span>
                    </div>
                    <div className={styles.menuItemActions}>
                      <button className={`${styles.toggleBtn} ${item.active ? styles.toggleActive : ''}`} onClick={() => toggleItem(item.id, item.active)}>
                        {item.active ? 'Active' : 'Hidden'}
                      </button>
                      <button className={styles.deleteBtn} onClick={() => deleteItem(item.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
