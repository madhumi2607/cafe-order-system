import { useState } from 'react'
import OrderPage from './pages/OrderPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  const path = window.location.pathname
  if (path === '/admin') return <AdminPage />
  return <OrderPage />
}
