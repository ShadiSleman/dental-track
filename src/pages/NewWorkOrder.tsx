import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api/workOrders'
import api from '../api/client'

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
  const [r2Ready, setR2Ready] = useState<boolean | null>(null)

  useEffect(() => {
    api.get<{ r2: boolean }>('/health').then(r => setR2Ready(r.data.r2)).catch(() => setR2Ready(false))
  }, [])

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
      const e = err as { response?: { data?: { error?: string } }; code?: string; message?: string }
      if (e?.code === 'ECONNABORTED' || e?.message?.includes('timeout')) {
        setError('הבקשה לקחה יותר מדי זמן — נסה שוב (רשת איטית?)')
      } else {
        setError(e?.response?.data?.error || 'שגיאה בשמירת העבודה. נסה שוב.')
      }
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
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">שם משפחה *</label>
              <input
                className="input"
                value={form.lastName}
                onChange={set('lastName')}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="label">מין</label>
            <div className="flex gap-4 mt-1">
              {['זכר', 'נקבה'].map(g => (
                <label key={g} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                  form.gender === g
                    ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => setForm(prev => ({ ...prev, gender: g }))}
                    className="hidden"
                  />
                  <span>{g === 'זכר' ? '👨' : '👩'}</span>
                  <span>{g}</span>
                </label>
              ))}
            </div>
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
          {r2Ready === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
              ⚠️ שירות אחסון הקבצים (R2) טרם הוגדר — הקבצים לא יישמרו עד להגדרתו.
            </div>
          )}
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
            disabled={r2Ready === false}
            className={`btn-secondary w-full text-sm ${r2Ready === false ? 'opacity-40 cursor-not-allowed' : ''}`}
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
