import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api/workOrders'
import type { WorkType } from '../types'
import { WORK_TYPE_LABELS } from '../types'

const WORK_TYPES = Object.entries(WORK_TYPE_LABELS) as [WorkType, string][]

export default function NewWorkOrder() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    patientCode: '',
    workType: 'crown' as WorkType,
    dueDate: '',
    notes: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.patientCode || !form.dueDate) {
      setError('יש למלא שם/קוד מטופל ותאריך יעד')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('patientCode', form.patientCode)
      fd.append('workType', form.workType)
      fd.append('dueDate', form.dueDate)
      fd.append('notes', form.notes)
      files.forEach((f) => fd.append('files', f))
      const order = await createOrder(fd)
      navigate(`/orders/${order._id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error || 'שגיאה בשמירת העבודה. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  return (
    <div className="max-w-lg mx-auto pb-20 md:pb-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">עבודה חדשה</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-700">פרטי מטופל</h3>
          <div>
            <label className="label">שם / קוד מטופל *</label>
            <input
              className="input"
              value={form.patientCode}
              onChange={(e) => setForm({ ...form, patientCode: e.target.value })}
              placeholder="לדוג': כהן דוד / P-1234"
            />
          </div>
          <div>
            <label className="label">תאריך יעד לאספקה *</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Work type */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700">סוג העבודה</h3>
          <div className="grid grid-cols-2 gap-2">
            {WORK_TYPES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, workType: key })}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  form.workType === key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="label">הערות מיוחדות</label>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            onChange={handleFiles}
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
