import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api/workOrders'
import api from '../api/client'
import LabLogo from '../components/LabLogo'
import type { Lab } from '../types'

const calcAge = (iso: string): number | null => {
  if (!iso) return null
  const today = new Date(), birth = new Date(iso)
  let age = today.getFullYear() - birth.getFullYear()
  const mo = today.getMonth() - birth.getMonth()
  if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

// Auto-format: digits only → dd/mm/yyyy (slashes inserted automatically)
const autoFormatDate = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`
}

const parseDateText = (text: string): string => {
  const parts = text.split('/')
  if (parts.length !== 3) return ''
  const [dd, mm, yyyy] = parts
  if (yyyy.length < 4) return ''
  const iso = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
  return isNaN(new Date(iso).getTime()) ? '' : iso
}

// ISO → dd/mm/yyyy display string
const isoToDisplay = (iso: string): string => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Simple date input — text only, auto-slash, no dropdowns
function DateSelect({ label, value, onChange }: {
  label: string; value: string; onChange: (iso: string) => void
}) {
  const [typed, setTyped] = useState(() => isoToDisplay(value))

  const onTyped = (raw: string) => {
    const formatted = autoFormatDate(raw)
    setTyped(formatted)
    onChange(parseDateText(formatted))
  }

  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={typed}
        onChange={e => onTyped(e.target.value)}
        className="input text-left tracking-widest"
        dir="ltr"
        maxLength={10}
      />
    </div>
  )
}

export default function NewWorkOrder() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [selectedLab, setSelectedLab] = useState<Lab | null>(null)
  const [labs, setLabs] = useState<Lab[]>([])
  const [labsLoading, setLabsLoading] = useState(false)
  const [labSearch, setLabSearch] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    gender:    '',
    birthDate: '',
    scanDate:  new Date().toISOString().split('T')[0],
    notes:     '',
  })

  const setField = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))
  const [files, setFiles]   = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [r2Ready, setR2Ready] = useState<boolean | null>(null)

  useEffect(() => {
    api.get<{ r2: boolean }>('/health').then(r => setR2Ready(r.data.r2)).catch(() => setR2Ready(false))
  }, [])

  useEffect(() => {
    setLabsLoading(true)
    import('../api/labs').then(m => m.getLabs()).then(setLabs).finally(() => setLabsLoading(false))
  }, [])

  const age = calcAge(form.birthDate)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedLab) {
      setError('יש לבחור מעבדה')
      return
    }

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
      fd.append('labId',     selectedLab._id)
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
      <h2 className="text-xl font-bold text-gray-900 mb-2">עבודה חדשה</h2>

      {/* Lab selection screen */}
      {!selectedLab ? (
        <>
          <p className="text-sm text-gray-500 mb-3">בחר מעבדה לשליחת העבודה:</p>

          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="חיפוש מעבדה..."
              value={labSearch}
              onChange={e => setLabSearch(e.target.value)}
              className="input pr-9"
            />
          </div>

          {labsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {labs
                .filter(l => l.name.toLowerCase().includes(labSearch.toLowerCase()) ||
                             (l.address || '').toLowerCase().includes(labSearch.toLowerCase()))
                .map(lab => (
                  <button
                    key={lab._id}
                    type="button"
                    onClick={() => setSelectedLab(lab)}
                    className="w-full card flex items-center gap-4 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer text-right"
                  >
                    <LabLogo lab={lab} size="lg" />
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{lab.name}</p>
                      {lab.address && <p className="text-sm text-gray-400">{lab.address}</p>}
                    </div>
                    <div className="mr-auto text-gray-300 text-2xl">‹</div>
                  </button>
                ))}
              {labs.filter(l => l.name.toLowerCase().includes(labSearch.toLowerCase())).length === 0 && (
                <p className="text-center text-gray-400 py-8">לא נמצאו מעבדות</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Selected lab header */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
            <LabLogo lab={selectedLab} size="sm" />
            <span className="font-semibold text-gray-800">{selectedLab.name}</span>
            <button
              type="button"
              onClick={() => setSelectedLab(null)}
              className="mr-auto text-xs text-primary-500 hover:text-primary-700 underline"
            >
              שנה מעבדה
            </button>
          </div>

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
                onChange={e => setField('firstName')(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">שם משפחה *</label>
              <input
                className="input"
                value={form.lastName}
                onChange={e => setField('lastName')(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Gender — segmented control */}
          <div>
            <label className="label">מין</label>
            <div className="flex mt-1 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 p-1 gap-1">
              {[
                { val: 'זכר',  label: 'זכר ♂',  active: 'bg-[#1a3a6b] text-white' },
                { val: 'נקבה', label: 'נקבה ♀', active: 'bg-[#d946ef] text-white'  },
              ].map(({ val, label, active }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, gender: val }))}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 ${
                    form.gender === val ? active : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Birth date — simple dropdowns */}
          <div>
            <DateSelect
              label={`תאריך לידה${age !== null ? ` — גיל: ${age}` : ''}`}
              value={form.birthDate}
              onChange={setField('birthDate')}
            />
          </div>

          {/* Scan date — simple dropdowns */}
          <div>
            <DateSelect
              label="תאריך סריקת עבודה *"
              value={form.scanDate}
              onChange={setField('scanDate')}
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
            onChange={e => setField('notes')(e.target.value)}
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
        </>
      )}
    </div>
  )
}
