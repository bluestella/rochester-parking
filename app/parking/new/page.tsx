'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewParking() {
  const router = useRouter()
  const [plateNumber, setPlateNumber] = useState('')
  const [buildingName, setBuildingName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [codename, setCodename] = useState('')
  const [residentEmail, setResidentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/parking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plateNumber, buildingName, unitNumber, codename, residentEmail })
    })
    setLoading(false)
    if (res.ok) {
      router.push('/parking')
    }
  }
  return (
    <main style={{ padding: 24, maxWidth: 640 }}>
      <h2>Add Parking Entry</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="Plate Number" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} required />
        <input placeholder="Building Name" value={buildingName} onChange={e => setBuildingName(e.target.value)} required />
        <input placeholder="Unit Number" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} required />
        <input placeholder="Codename" value={codename} onChange={e => setCodename(e.target.value)} required />
        <input placeholder="Resident Email (optional)" value={residentEmail} onChange={e => setResidentEmail(e.target.value)} />
        <button disabled={loading} type="submit">{loading ? 'Saving...' : 'Save'}</button>
      </form>
    </main>
  )
}
