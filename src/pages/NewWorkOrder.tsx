import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api/workOrders'

// Calculate age from birthDate string
const calcAge = (birthDate: string): number | null => {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

export default function NewWorkOrder() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    gender:    '',
    birthDate: '',
    scanDate:  new Date().toISOString().split('T')[0], // default today
    notes:     '',
  })
  const [files, setFiles]   = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const age = calcAge(form.birthDate)

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('יש למלא שם פרטי ושם משפחה')
      return
    }
    if (!form.scanDate) {
      setError('יש למלא תאריך סריקת עבודה')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('firstName', form.firstName.trim())
      fd.append('lastName',  form.lastName.trim())
      fd.append('gender',    form.gender)
      fd.append('birthDate', form.birthDate)
      fd.append('scanDate',  form.scanDate)
      fd.append('notes',     form.notes)
      files.forEach(f => fd.append('files', f))

      const order = await createOrder(fd)
      navigate(`/orders/${order._id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'שגיאה בשמירת העבודה. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-20 md:pb-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">עבודה חדשה</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Patient details */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-700">פרטי מטופל</h3>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">שם פרטי *</label>
              <input
                className="input"
                value={form.firstName}
                onChange={set('firstName')}
                placeholder="ישראל"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">שם משפחה *</label>
              <input
                className="input"
                value={form.lastName}
                onChange={set('lastName')}
                placeholder="ישראלי"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="label">מין</label>
            <select className="input" value={form.gender} onChange={set('gender')}>
              <option value="">-- בחר --</option>
              <option value="זכר">זכר</option>
              <option value="נקבה">נקבה</option>
            </select>
          </div>

          {/* Birth date + age */}
          <div>
            <label className="label">תאריך לידה</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                className="input flex-1"
                value={form.birthDate}
                onChange={set('birthDate')}
                max={new Date().toISOString().split('T')[0]}
              />
              {age !== null && (
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  גיל: <strong>{age}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Scan date */}
          <div>
            <label className="label">תאריך סריקת עבודה *</label>
            <input
              type="date"
              className="input"
              value={form.scanDate}
              onChange={set('scanDate')}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="label">הערות מיוחדות</label>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={set('notes')}
            placeholder="הנחיות, צבע, מידות מיוחדות..."
          />
        </div>

        {/* Files */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700">קבצים</h3>
          <p className="text-xs text-gray-400">STL, PLY, OBJ, PDF, תמונות</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".stl,.ply,.obj,.pdf,image/*"
            onChange={e => { if (e.target.files) setFiles(Array.from(e.target.files)) }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-secondary w-full text-sm"
          >
            📎 בחר קבצים
          </button>
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 mr-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'שולח...' : '📤 שלח למעבדה'}
        </button>
      </form>
    </div>
  )
}
