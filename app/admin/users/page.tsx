'use client'
import { useEffect, useState } from 'react'

type User = {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'GUARD' | 'RESIDENT'
  buildingName: string | null
  unitNumber: string | null
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Partial<User>>({ role: 'RESIDENT' })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    setLoading(false)
    if (res.ok) {
      setUsers(await res.json())
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save() {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setForm({ role: 'RESIDENT' })
      load()
    }
  }

  async function update(u: User) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    })
    if (res.ok) load()
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <main style={{ padding: 24 }}>
      <h2>User Management</h2>
      <div style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
        <input placeholder="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
        <select value={form.role || 'RESIDENT'} onChange={e => setForm({ ...form, role: e.target.value as User['role'] })}>
          <option value="ADMIN">ADMIN</option>
          <option value="GUARD">GUARD</option>
          <option value="RESIDENT">RESIDENT</option>
        </select>
        <input placeholder="Building" value={form.buildingName || ''} onChange={e => setForm({ ...form, buildingName: e.target.value })} />
        <input placeholder="Unit" value={form.unitNumber || ''} onChange={e => setForm({ ...form, unitNumber: e.target.value })} />
        <button onClick={save}>Add User</button>
      </div>
      <h3 style={{ marginTop: 24 }}>Users</h3>
      {loading ? <p>Loading...</p> : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
          {users.map(u => (
            <li key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
              <span>{u.email}</span>
              <input value={u.name || ''} onChange={e => setUsers(users.map(x => x.id === u.id ? { ...x, name: e.target.value } : x))} />
              <select value={u.role} onChange={e => setUsers(users.map(x => x.id === u.id ? { ...x, role: e.target.value as User['role'] } : x))}>
                <option value="ADMIN">ADMIN</option>
                <option value="GUARD">GUARD</option>
                <option value="RESIDENT">RESIDENT</option>
              </select>
              <input value={u.buildingName || ''} onChange={e => setUsers(users.map(x => x.id === u.id ? { ...x, buildingName: e.target.value } : x))} />
              <input value={u.unitNumber || ''} onChange={e => setUsers(users.map(x => x.id === u.id ? { ...x, unitNumber: e.target.value } : x))} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => update(users.find(x => x.id === u.id)!)}>Save</button>
                <button onClick={() => remove(u.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
