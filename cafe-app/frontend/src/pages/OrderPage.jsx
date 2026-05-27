import { useState, useEffect, useRef } from 'react'
import styles from './OrderPage.module.css'

const PICKUP_SLOTS = ['8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM']
const API = ''

export default function OrderPage() {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [name, setName] = useState('')
  const [dept, setDept] = useState('')
  const [slot, setSlot] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    fetch(`${API}/api/menu/active`)
      .then(r => r.json())
      .then(setMenu)
      .catch(() => setError('Could not load menu. Is the server running?'))
  }, [])

  const grouped = menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const setQty = (id, delta) => {
    setCart(prev => {
      const curr = prev[id] || 0
      const next = Math.max(0, curr + delta)
      if (next === 0) { const c = {...prev}; delete c[id]; return c }
      return {...prev, [id]: next}
    })
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = menu.find(m => m.id === id)
    return item ? {...item, qty} : null
  }).filter(Boolean)

  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setScreenshot(ev.target.result); setScreenshotPreview(ev.target.result) }
    reader.readAsDataURL(file)
  }

  const canProceedStep2 = name.trim() && dept.trim() && slot
  const canSubmit = screenshot

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, department: dept, pickup_slot: slot, items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })), total, screenshot })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      setOrderId(data.order_id); setStep(4)
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  if (step === 4) return (
    <div className={styles.success}>
      <div className={styles.successCard}>
        <img src="/logo.jpeg" alt="Velaa Café" className={styles.successLogo} />
        <div className={styles.successIcon}>✓</div>
        <h1>Order Placed!</h1>
        <p className={styles.orderId}>#{orderId}</p>
        <p className={styles.successSub}>Pick up at <strong style={{color:'var(--gold2)'}}>{slot}</strong></p>
        <p className={styles.successNote}>Show this order ID at the counter</p>
        <div className={styles.divider} />
        <button className={styles.newOrder} onClick={() => { setCart({}); setName(''); setDept(''); setSlot(''); setScreenshot(null); setScreenshotPreview(null); setStep(1); }}>
          Place Another Order
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <img src="/logo.jpeg" alt="Velaa Café" className={styles.logoImg} />
          <div className={styles.logoText}>
            <span className={styles.logoName}>VELAA CAFÉ</span>
            <span className={styles.logoTagline}>students favourite spot</span>
          </div>
        </div>
        <div className={styles.steps}>
          {['Menu','Details','Payment'].map((s, i) => (
            <div key={s} className={`${styles.stepDot} ${step > i+1 ? styles.done : ''} ${step === i+1 ? styles.active : ''}`}>
              <span>{step > i+1 ? '✓' : i+1}</span>
              <label>{s}</label>
            </div>
          ))}
        </div>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* STEP 1 — MENU */}
        {step === 1 && (
          <div className={styles.menuStep}>
            <h2 className={styles.stepTitle}>What would you like? <span>☕</span></h2>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className={styles.category}>
                <div className={styles.catLabel}>{cat}</div>
                <div className={styles.itemGrid}>
                  {items.map(item => {
                    const qty = cart[item.id] || 0
                    return (
                      <div key={item.id} className={`${styles.itemCard} ${qty > 0 ? styles.selected : ''}`}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemPrice}>₹{item.price}</span>
                        </div>
                        <div className={styles.qtyControl}>
                          {qty > 0 ? (
                            <>
                              <button className={styles.qtyBtn} onClick={() => setQty(item.id, -1)}>−</button>
                              <span className={styles.qtyNum}>{qty}</span>
                              <button className={styles.qtyBtn} onClick={() => setQty(item.id, 1)}>+</button>
                            </>
                          ) : (
                            <button className={styles.addBtn} onClick={() => setQty(item.id, 1)}>Add</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {cartItems.length > 0 && (
              <div className={styles.cartSummary}>
                <div className={styles.cartInfo}>
                  <span>{cartItems.reduce((s,i) => s+i.qty, 0)} item{cartItems.reduce((s,i) => s+i.qty, 0) > 1 ? 's' : ''} selected</span>
                  <span className={styles.cartTotal}>₹{total}</span>
                </div>
                <button className={styles.nextBtn} onClick={() => setStep(2)}>Continue →</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — DETAILS */}
        {step === 2 && (
          <div className={styles.detailStep}>
            <h2 className={styles.stepTitle}>Your Details</h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Name</label>
                <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Department</label>
                <input type="text" placeholder="e.g. CSE, ECE, MBA..." value={dept} onChange={e => setDept(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label>Pickup Time</label>
                <select value={slot} onChange={e => setSlot(e.target.value)} className={styles.select}>
                  <option value="">Select a time slot</option>
                  {PICKUP_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.orderReview}>
              <div className={styles.reviewTitle}>Order Summary</div>
              {cartItems.map(i => (
                <div key={i.id} className={styles.reviewRow}>
                  <span>{i.name} × {i.qty}</span>
                  <span>₹{i.price * i.qty}</span>
                </div>
              ))}
              <div className={styles.reviewTotal}>
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
            <div className={styles.navRow}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
              <button className={styles.nextBtn} disabled={!canProceedStep2} onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — PAYMENT */}
        {step === 3 && (
          <div className={styles.payStep}>
            <h2 className={styles.stepTitle}>Payment</h2>
            <div className={styles.qrBox}>
              <div className={styles.qrCard}>
                <div className={styles.upiLabel}>Scan & Pay</div>
                <div className={styles.upiAmt}>₹{total}</div>
                <div className={styles.qrInner}>
                  {/* Replace this SVG with <img src="/upi-qr.png"> for your real QR */}
                  <svg viewBox="0 0 100 100" width="150" height="150">
                    <rect width="100" height="100" fill="#fff"/>
                    <rect x="10" y="10" width="30" height="30" fill="none" stroke="#7a1a2e" strokeWidth="4"/>
                    <rect x="15" y="15" width="20" height="20" fill="#7a1a2e"/>
                    <rect x="60" y="10" width="30" height="30" fill="none" stroke="#7a1a2e" strokeWidth="4"/>
                    <rect x="65" y="15" width="20" height="20" fill="#7a1a2e"/>
                    <rect x="10" y="60" width="30" height="30" fill="none" stroke="#7a1a2e" strokeWidth="4"/>
                    <rect x="15" y="65" width="20" height="20" fill="#7a1a2e"/>
                    <rect x="60" y="60" width="8" height="8" fill="#7a1a2e"/>
                    <rect x="72" y="60" width="8" height="8" fill="#7a1a2e"/>
                    <rect x="84" y="60" width="8" height="8" fill="#7a1a2e"/>
                    <rect x="60" y="72" width="8" height="8" fill="#7a1a2e"/>
                    <rect x="72" y="84" width="8" height="8" fill="#7a1a2e"/>
                    <rect x="84" y="72" width="8" height="8" fill="#7a1a2e"/>
                    <rect x="84" y="84" width="8" height="8" fill="#7a1a2e"/>
                  </svg>
                </div>
                <div className={styles.upiId}>velaa@upi</div>
                <div className={styles.upiNote}>Replace with your actual UPI QR image</div>
              </div>
            </div>
            <div className={styles.uploadSection}>
              <div className={styles.uploadLabel}>Upload Payment Screenshot</div>
              <div className={`${styles.uploadBox} ${screenshotPreview ? styles.hasPreview : ''}`} onClick={() => fileRef.current.click()}>
                {screenshotPreview ? (
                  <img src={screenshotPreview} alt="Screenshot" className={styles.preview} />
                ) : (
                  <div className={styles.uploadPrompt}>
                    <span className={styles.uploadIcon}>📎</span>
                    <span>Tap to upload screenshot</span>
                    <span className={styles.uploadSub}>JPG or PNG</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} />
            </div>
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.navRow}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>← Back</button>
              <button className={styles.submitBtn} disabled={!canSubmit || submitting} onClick={handleSubmit}>
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
