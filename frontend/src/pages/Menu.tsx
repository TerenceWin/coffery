import { useEffect, useState } from 'react'
import api from '../services/api'
import { MenuItem } from '../models/MenuItem'

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<MenuItem[]>('/api/menu')
      .then(res => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-coffee-600">Loading...</div>
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-coffee-800 mb-8">Our Menu</h1>
      {items.length === 0 ? (
        <p className="text-coffee-500">No items available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-coffee-700">{item.code}</h2>
              <p className="text-coffee-500 mt-1 text-sm">{item.item}</p>
              <p className="text-coffee-800 font-bold mt-3">${item.cost.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
