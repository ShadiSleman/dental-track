import { useState, useEffect } from 'react'
import { getTeam, createMember, updateMember, deleteMember } from '../api/team'
import type { TeamMember, CreateMemberData } from '../api/team'

const EMPTY_FORM: CreateMemberData = { name: '', email: '', password: '', phone: '', role: 'technician' }

export default function TeamManagement() {
  const [technicians, setTechnicians] = useState<TeamMember[]>([])
  const [doctors, setDoctors]         = useState<TeamMember[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // Modal state
  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState<TeamMember | null>(null)
  const [form, setForm]               = useState<CreateMemberData>(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState('')

  const load = () => {
    setLoading(true)
    getTeam()
      .then(d => { setTechnicians(d.technicians); setDoctors(d.doctors) })
      .catch(() => setError('שגיאה בטעינת הצוות'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true) }
  const openEdit = (m: TeamMember) => {
    setEditing(m)
    setForm({ name: m.name, email: m.email, password: '', phone: m.phone || '', role: m.role as 'technician' | 'doctor' })
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.name || !form.email) { setFormError('שם ואימייל הם שדות חובה'); return }
    if (!editing && !form.password) { setFormError('סיסמה היא שדה חובה עבור משתמש חדש'); return }

    setSaving(true)
    try {
      if (editing) {
        const { password, ...rest } = form
        await updateMember(editing._id, password ? form : rest)
      } else {
        await createMember(form)
      }
      setShowForm(false)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setFormError(e?.response?.data?.error || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (m: TeamMember) => {
    if (!confirm(`האם למחוק את ${m.name}?\n\nפעולה זו אינה ניתנת לביטול.`)) return
    if (!confirm(`אישור סופי — למחוק לצמיתות את ${m.name}?`)) return
    try {
      await deleteMember(m._id)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      alert(e?.response?.data?.error || 'שגיאה במחיקה')
    }
  }

  const set = (key: keyof CreateMemberData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  const MemberRow = ({ m }: { m: TeamMember }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{m.name}</p>
        <p className="text-xs text-gray-400">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
      </div>
      <div className="flex items-center gap-2">
        {!m.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">לא פעיל</span>}
        <button onClick={() => openEdit(m)} className="text-sm text-primary-600 hover:underline">עריכה</button>
        <button onClick={() => handleDelete(m)} className="text-sm text-red-500 hover:underline">מחיקה</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">ניהול צוות</h2>
        <button onClick={openAdd} className="btn-primary text-sm">+ הוסף חבר צוות</button>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-400 py-8">טוען...</p>
      ) : (
        <>
          {/* Technicians */}
          <div className="card space-y-1">
            <h3 className="font-semibold text-gray-700 mb-2">טכנאים ({technicians.length})</h3>
            {technicians.length === 0
              ? <p className="text-sm text-gray-400">אין טכנאים עדיין</p>
              : technicians.map(m => <MemberRow key={m._id} m={m} />)
            }
          </div>

          {/* Doctors */}
          <div className="card space-y-1">
            <h3 className="font-semibold text-gray-700 mb-2">רופאים ({doctors.length})</h3>
            {doctors.length === 0
              ? <p className="text-sm text-gray-400">אין רופאים עדיין</p>
              : doctors.map(m => <MemberRow key={m._id} m={m} />)
            }
          </div>
        </>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{editing ? 'עריכת' : 'הוספת'} חבר צוות</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Role (only for new) */}
              {!editing && (
                <div>
                  <label className="label">תפקיד *</label>
                  <select className="input" value={form.role} onChange={set('role')}>
                    <option value="technician">טכנאי</option>
                    <option value="doctor">רופא</option>
                  </select>
                </div>
              )}

              <div>
                <label className="label">שם מלא *</label>
                <input className="input" value={form.name} onChange={set('name')} placeholder="ישראל ישראלי" />
              </div>

              {!editing && (
                <div>
                  <label className="label">אימייל *</label>
                  <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" />
                </div>
              )}

              <div>
                <label className="label">{editing ? 'סיסמה חדשה (השאר ריק לאי שינוי)' : 'סיסמה *'}</label>
                <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
              </div>

              <div>
                <label className="label">טלפון</label>
                <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="050-0000000" />
              </div>

              {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'שומר...' : editing ? 'עדכן' : 'הוסף'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
