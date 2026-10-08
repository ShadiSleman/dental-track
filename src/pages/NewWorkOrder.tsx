import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api/workOrders'
import api from '../api/client'

const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 100 }, (_, i) => THIS_YEAR - i)
const DAYS  = Array.from({ length: 31 }, (_, i) => i + 1)

// Convert d/m/y parts to ISO string or ''
const partsToISO = (d: string, m: string, y: string) => {
  if (!d || !m || !y) return ''
  const mm = String(Number(m)).padStart(2, '0')
  const dd = String(Number(d)).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

const calcAge = (iso: string): number | null => {
  if (!iso) return null
  const today = new Date(), birth = new Date(iso)
  let age = today.getFullYear() - birth.getFullYear()
  const mo = today.getMonth() - birth.getMonth()
  if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

// Parse dd/mm/yyyy or dd.mm.yyyy typed text → ISO
const textToISO = (text: string): string => {
  const clean = text.replace(/\./g, '/')
  const parts = clean.split('/')
  if (parts.length !== 3) return ''
  const [dd, mm, yyyy] = parts
  if (!dd || !mm || !yyyy || yyyy.length < 4) return ''
  const iso = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
  return isNaN(new Date(iso).getTime()) ? '' : iso
}

// Date select + manual input
function DateSelect({ label, value, onChange, maxYear }: {
  label: string; value: string; onChange: (iso: string) => void; maxYear?: number
}) {
  const [d, setD] = useState('')
  const [m, setM] = useState('')
  const [y, setY] = useState('')
  const [manual, setManual] = useState(false)
  const [typed, setTyped]   = useState('')

  const updSelects = (nd: string, nm: string, ny: string) => {
    setD(nd); setM(nm); setY(ny)
    onChange(partsToISO(nd, nm, ny))
  }

  const onTyped = (val: string) => {
    setTyped(val)
    onChange(textToISO(val))
  }

  const years = maxYear ? YEARS.filter(yr => yr <= maxYear) : YEARS
  const selectCls = 'flex-1 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white cursor-pointer'
  const displayDate = value ? new Date(value).toLocaleDateString('he-IL') : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">{label}</label>
        <button
          type="button"
          onClick={() => { setManual(v => !v); onChange(''); setTyped(''); setD(''); setM(''); setY('') }}
          className="text-xs text-primary-500 hover:text-primary-700 underline"
        >
          {manual ? 'בחר מרשימה' : 'הקלדה ידנית'}
        </button>
      </div>

      {manual ? (
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/yyyy"
            value={typed}
            onChange={e => onTyped(e.target.value)}
            className="input text-left"
            dir="ltr"
            maxLength={10}
          />
          {value && <p className="text-xs text-emerald-600 mt-1">✓ {displayDate}</p>}
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <select value={d} onChange={e => updSelects(e.target.value, m, y)} className={selectCls}>
              <option value="">יום</option>
              {DAYS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={m} onChange={e => updSelects(d, e.target.value, y)} className={selectCls}>
              <option value="">חודש</option>
              {HE_MONTHS.map((name, i) => <option key={i+1} value={i+1}>{name}</option>)}
            </select>
            <select value={y} onChange={e => updSelects(d, m, e.target.value)} className={selectCls}>
              <option value="">שנה</option>
              {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </div>
          {value && <p className="text-xs text-emerald-600 mt-1">✓ {displayDate}</p>}
        </div>
      )}
    </div>
  )
}

export default function NewWorkOrder() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

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

  const age = calcAge(form.birthDate)


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
                { val: '',     label: 'לא ידוע',  active: 'bg-gray-400 text-white'   },
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
              maxYear={THIS_YEAR}
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
    </div>
  )
}
