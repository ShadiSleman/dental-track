import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getAdminLabs, getAdminLab, createAdminLab, updateAdminLab, deleteAdminLab,
  uploadLabLogo, addLabTeamMember, removeLabTeamMember, addLabSubscription, getPricing,
  type AdminLabEntry, type AdminLabDetail, type CreateLabPayload, type AddTeamMemberPayload, type PriceCatalog,
} from '../../api/admin'
import type { User } from '../../types'

// ─── Plan definitions ─────────────────────────────────────────────────────────
const FALLBACK_PRICES: PriceCatalog = {
  lifetimePrice: 19000, starterPrice: 290, standardPrice: 590, proPrice: 990,
  termYears: 3, starterDoctors: 3, standardDoctors: 10,
}

function plansFrom(c: PriceCatalog) {
  const n = (v: number) => v.toLocaleString('he-IL')
  const y = c.termYears || 3
  const s = c.starterDoctors || 3
  const d = c.standardDoctors || 10
  return [
    { key: 'lab_lifetime_3y', label: `חבילת השקה — ₪${n(c.lifetimePrice)} חד-פעמי (${y} שנים)`, price: c.lifetimePrice, badge: '⭐ חובה בפתיחה', monthly: false },
    { key: 'lab_starter',     label: `אחרי ${y} שנים — ₪${n(c.starterPrice)}/חודש (עד ${s} רופאים)`, price: c.starterPrice, badge: '', monthly: true },
    { key: 'lab_standard',    label: `אחרי ${y} שנים — ₪${n(c.standardPrice)}/חודש (עד ${d} רופאים)`, price: c.standardPrice, badge: '', monthly: true },
    { key: 'lab_pro',         label: `אחרי ${y} שנים — ₪${n(c.proPrice)}/חודש (ללא הגבלת רופאים)`, price: c.proPrice, badge: '', monthly: true },
  ]
}

const PLANS = plansFrom(FALLBACK_PRICES)

function useLivePlans() {
  const [plans, setPlans] = useState(PLANS)
  useEffect(() => {
    getPricing().then(c => setPlans(plansFrom(c))).catch(() => {})
  }, [])
  return plans
}

const ROLE_LABELS: Record<string, string> = {
  lab_manager: 'מנהל מעבדה', technician: 'טכנאי', courier: 'שליח', doctor: 'רופא', super_admin: 'אדמין',
}
const ROLE_COLORS: Record<string, string> = {
  lab_manager: 'bg-purple-900/40 text-purple-300',
  technician:  'bg-blue-900/40 text-blue-300',
  courier:     'bg-yellow-900/40 text-yellow-300',
  doctor:      'bg-emerald-900/40 text-emerald-300',
  super_admin: 'bg-red-900/40 text-red-300',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function planBadge(plan: string) {
  const found = PLANS.find(p => p.key === plan)
  return found?.label.split(' — ')[0] ?? plan
}

function subStatus(sub: AdminLabEntry['subscription']) {
  if (!sub?.validUntil) return { label: 'אין מנוי', color: 'text-gray-500', date: '' }
  const until = new Date(sub.validUntil)
  const date  = until.toLocaleDateString('he-IL')
  const days  = Math.ceil((until.getTime() - Date.now()) / 86400000)
  if (sub.status === 'expired' || days < 0)
    return { label: `הסתיים ב-${date}`, color: 'text-orange-300', date }
  if (days < 60)
    return { label: `${days} ימים נותרו · עד ${date}`, color: 'text-yellow-400', date }
  return { label: `${days} ימים נותרו · עד ${date}`, color: 'text-emerald-400', date }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminLabs() {
  const [labs, setLabs]           = useState<AdminLabEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [phase, setPhase]         = useState<'all' | 'lifetime' | 'monthly'>('all')
  const [selectedId, setSelected] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminLabs().then(setLabs).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = labs.filter(l => {
    const q = !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase())
    const p = phase === 'all' || l.billingPhase === phase
    return q && p
  })
  const lifetimeN = labs.filter(l => l.billingPhase === 'lifetime').length
  const monthlyN  = labs.filter(l => l.billingPhase === 'monthly').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🏭 מעבדות</h1>
          <p className="text-gray-400 text-sm">{labs.length} מעבדות רשומות</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          ＋ מעבדה חדשה
        </button>
      </div>

      {/* Classify: still inside 3 years vs paying monthly */}
      <div className="flex gap-2 flex-wrap">
        {([
          ['all', `הכל (${labs.length})`],
          ['lifetime', `בתוך 3 שנים (${lifetimeN})`],
          ['monthly', `חודשי אחרי 3 שנים (${monthlyN})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPhase(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              phase === key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* Search */}
      <input
        className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 w-full max-w-sm"
        placeholder="🔍 חיפוש מעבדה..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Lab grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl h-40 animate-pulse border border-gray-800" />
            ))
          : filtered.map(lab => (
              <LabCard
                key={lab._id}
                lab={lab}
                onSelect={() => setSelected(lab._id)}
                onDelete={() => { load() }}
              />
            ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedId && (
          <LabDetailModal
            labId={selectedId}
            onClose={() => { setSelected(null); load() }}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateLabModal
            onClose={() => setShowCreate(false)}
            onCreate={() => { setShowCreate(false); load() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Lab Card ─────────────────────────────────────────────────────────────────
function LabCard({ lab, onSelect, onDelete }: { lab: AdminLabEntry; onSelect: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const status = subStatus(lab.subscription)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`למחוק את מעבדה "${lab.name}"?\n\nכל הנתונים ימחקו לצמיתות!`)) return
    if (!confirm(`אישור נוסף: האם אתה בטוח לחלוטין?\n"${lab.name}"`)) return
    setDeleting(true)
    try {
      await deleteAdminLab(lab._id)
      onDelete()
    } catch (err: unknown) {
      alert('שגיאת מחיקה: ' + (err instanceof Error ? err.message : 'שגיאה'))
      setDeleting(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: lab.isActive ? 1 : 0.6, y: 0 }}
      className={`bg-gray-900 rounded-2xl border cursor-pointer hover:border-blue-600 transition-all ${
        lab.isActive ? 'border-gray-800' : 'border-red-900/50'
      }`}
      onClick={onSelect}
    >
      {/* Top */}
      <div className="p-4 flex items-start gap-3">
        {/* Logo / initials */}
        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg text-white overflow-hidden"
          style={{ background: lab.logoUrl ? 'transparent' : '#1e3a8a' }}>
          {lab.logoUrl
            ? <img src={lab.logoUrl} className="w-full h-full object-contain bg-white" alt={lab.name} />
            : initials(lab.name)
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-white truncate">{lab.name}</h3>
            <div className="flex gap-1 flex-shrink-0">
              {lab.billingPhase === 'monthly' && (
                <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded-full">חודשי</span>
              )}
              {lab.billingPhase === 'lifetime' && (
                <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded-full">3 שנים</span>
              )}
              {!lab.isActive && <span className="text-xs bg-red-900/50 text-red-400 px-1.5 rounded-full">מושבת</span>}
            </div>
          </div>
          {lab.email && <p className="text-xs text-gray-400 truncate" dir="ltr">{lab.email}</p>}
          {lab.phone && <p className="text-xs text-gray-500">{lab.phone}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 flex gap-4 border-t border-gray-800 pt-3">
        <Stat value={lab.doctorCount}     label="רופאים" color="text-emerald-400" />
        <Stat value={lab.technicianCount} label="טכנאים" color="text-blue-400" />
        <Stat value={lab.openOrders}      label="פתוחות" color="text-yellow-400" />
      </div>

      {/* Subscription status + actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div>
          {lab.subscription && (
            <p className="text-[10px] text-gray-500">{planBadge(lab.subscription.plan)}</p>
          )}
          <p className={`text-xs font-medium ${status.color}`}>{status.label}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={e => { e.stopPropagation(); onSelect() }}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-colors"
            title="עריכה"
          >✏️</button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/50 text-red-400 text-xs transition-colors disabled:opacity-40"
            title="מחיקה"
          >{deleting ? '⏳' : '🗑️'}</button>
        </div>
      </div>
    </motion.div>
  )
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  )
}

// ─── Lab Detail Modal ─────────────────────────────────────────────────────────
function LabDetailModal({ labId, onClose }: { labId: string; onClose: () => void }) {
  const [lab, setLab]       = useState<AdminLabDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<'info' | 'team' | 'billing'>('info')
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [name, setName]       = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone]     = useState('')
  const [email, setEmail]     = useState('')
  const [isActive, setIsActive] = useState(true)

  const logoRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const reload = () => {
    setLoading(true)
    getAdminLab(labId).then(d => {
      setLab(d)
      setName(d.name)
      setAddress(d.address ?? '')
      setPhone(d.phone ?? '')
      setEmail(d.email ?? '')
      setIsActive(d.isActive)
    }).finally(() => setLoading(false))
  }

  useEffect(reload, [labId])

  const save = async () => {
    setSaving(true)
    try {
      await updateAdminLab(labId, { name, address, phone, email, isActive })
      reload()
    } finally { setSaving(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadLabLogo(labId, file)
      reload()
    } catch { alert('שגיאת העלאת לוגו') }
    finally { setUploading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-bold text-white text-lg">{lab?.name ?? '...'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { key: 'info',    label: '📋 פרטים' },
            { key: 'team',    label: '👥 צוות' },
            { key: 'billing', label: '💳 תשלומים' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : !lab ? (
            <p className="text-red-400">שגיאה בטעינת נתונים</p>
          ) : tab === 'info' ? (
            <InfoTab
              lab={lab}
              name={name} setName={setName}
              address={address} setAddress={setAddress}
              phone={phone} setPhone={setPhone}
              email={email} setEmail={setEmail}
              isActive={isActive} setIsActive={setIsActive}
              saving={saving} onSave={save}
              uploading={uploading}
              logoRef={logoRef}
              onLogoClick={() => logoRef.current?.click()}
              onLogoChange={handleLogoUpload}
            />
          ) : tab === 'team' ? (
            <TeamTab lab={lab} onReload={reload} />
          ) : (
            <BillingTab lab={lab} onReload={reload} />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────
function InfoTab({
  lab, name, setName, address, setAddress, phone, setPhone, email, setEmail,
  isActive, setIsActive, saving, onSave, uploading, logoRef, onLogoClick, onLogoChange,
}: {
  lab: AdminLabDetail
  name: string; setName: (v: string) => void
  address: string; setAddress: (v: string) => void
  phone: string; setPhone: (v: string) => void
  email: string; setEmail: (v: string) => void
  isActive: boolean; setIsActive: (v: boolean) => void
  saving: boolean; onSave: () => void
  uploading: boolean
  logoRef: React.RefObject<HTMLInputElement>
  onLogoClick: () => void
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-5">
      {/* Logo upload */}
      <div className="flex items-center gap-4">
        <div
          onClick={onLogoClick}
          className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-600 hover:border-blue-500 cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
        >
          {lab.logoUrl
            ? <img src={lab.logoUrl} className="w-full h-full object-contain bg-white" alt="logo" />
            : <span className="text-3xl">{uploading ? '⏳' : '📷'}</span>
          }
        </div>
        <div>
          <p className="text-sm font-medium text-white mb-1">לוגו מעבדה</p>
          <button onClick={onLogoClick} disabled={uploading}
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
            {uploading ? 'מעלה...' : lab.logoUrl ? 'החלף לוגו' : 'העלה לוגו'}
          </button>
          <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, SVG · מקסימום 5MB</p>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
      </div>

      {/* Form fields */}
      <div className="grid gap-4">
        <Field label="שם מעבדה *" value={name} onChange={setName} />
        <Field label="כתובת" value={address} onChange={setAddress} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="טלפון" value={phone} onChange={setPhone} dir="ltr" />
          <Field label="אימייל" value={email} onChange={setEmail} dir="ltr" type="email" />
        </div>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => setIsActive(!isActive)}
          className={`w-10 h-6 rounded-full transition-colors relative ${isActive ? 'bg-emerald-500' : 'bg-gray-700'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
        </div>
        <span className="text-sm text-gray-300">מעבדה פעילה</span>
      </label>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 bg-gray-800/50 rounded-xl p-4">
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-400">{lab.doctorCount ?? 0}</p>
          <p className="text-xs text-gray-500">רופאים</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-400">{lab.technicianCount ?? 0}</p>
          <p className="text-xs text-gray-500">טכנאים</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-yellow-400">{lab.totalOrders ?? 0}</p>
          <p className="text-xs text-gray-500">עבודות סה"כ</p>
        </div>
      </div>

      <div className="flex gap-2">
        <p className="text-xs text-gray-500">נוצר: {new Date(lab.createdAt).toLocaleDateString('he-IL')}</p>
      </div>

      <button
        onClick={onSave} disabled={saving}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        {saving ? 'שומר...' : 'שמור שינויים'}
      </button>
    </div>
  )
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab({ lab, onReload }: { lab: AdminLabDetail; onReload: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState<AddTeamMemberPayload>({ name: '', email: '', password: '', role: 'technician', phone: '' })
  const [adding, setAdding]   = useState(false)
  const [err, setErr]         = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setAdding(true)
    try {
      await addLabTeamMember(lab._id, form)
      setForm({ name: '', email: '', password: '', role: 'technician', phone: '' })
      setShowAdd(false)
      onReload()
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'שגיאה')
    } finally { setAdding(false) }
  }

  const handleRemove = async (user: User) => {
    if (!confirm(`להסיר את ${user.name} מהמעבדה?`)) return
    await removeLabTeamMember(lab._id, user._id)
    onReload()
  }

  return (
    <div className="space-y-4">
      {/* Add member button */}
      <button
        onClick={() => setShowAdd(v => !v)}
        className="w-full py-2 border border-dashed border-gray-600 hover:border-blue-500 text-gray-400 hover:text-blue-400 rounded-xl text-sm transition-colors"
      >
        {showAdd ? '✕ ביטול' : '＋ הוסף איש צוות'}
      </button>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="bg-gray-800 rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="שם" value={form.name ?? ''} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Field label="אימייל *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} dir="ltr" type="email" />
              <Field label="סיסמה (חדש בלבד)" value={form.password ?? ''} onChange={v => setForm(f => ({ ...f, password: v }))} dir="ltr" type="password" />
              <Field label="טלפון" value={form.phone ?? ''} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">תפקיד</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="lab_manager">מנהל מעבדה</option>
                <option value="technician">טכנאי</option>
                <option value="courier">שליח</option>
                <option value="doctor">רופא</option>
              </select>
            </div>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button type="submit" disabled={adding}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
              {adding ? 'מוסיף...' : 'הוסף'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Team list */}
      {lab.team.length === 0 ? (
        <p className="text-center text-gray-500 py-8">אין אנשי צוות</p>
      ) : (
        <div className="space-y-2">
          {lab.team.map((u: User) => (
            <div key={u._id} className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {initials(u.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate" dir="ltr">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-gray-700 text-gray-400'}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                {!u.isActive && <span className="text-[10px] text-red-400">מושבת</span>}
                <button
                  onClick={() => handleRemove(u)}
                  className="p-1 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400 text-xs transition-colors"
                  title="הסר מהמעבדה"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────
function BillingTab({ lab, onReload }: { lab: AdminLabDetail; onReload: () => void }) {
  const plans = useLivePlans()
  const [showAdd, setShowAdd] = useState(false)
  const [plan, setPlan]       = useState('lab_lifetime_3y')
  const [price, setPrice]     = useState(plans[0].price)
  const [adding, setAdding]   = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await addLabSubscription(lab._id, { plan, price })
      setShowAdd(false)
      onReload()
    } finally { setAdding(false) }
  }

  return (
    <div className="space-y-4">
      {/* Add payment button */}
      <button
        onClick={() => setShowAdd(v => !v)}
        className="w-full py-2 border border-dashed border-gray-600 hover:border-emerald-500 text-gray-400 hover:text-emerald-400 rounded-xl text-sm transition-colors"
      >
        {showAdd ? '✕ ביטול' : '＋ הוסף תשלום / חידוש'}
      </button>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="bg-gray-800 rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div>
              <label className="block text-xs text-gray-400 mb-1">תוכנית</label>
              <select
                value={plan}
                onChange={e => {
                  const p = e.target.value
                  setPlan(p)
                  const found = plans.find(x => x.key === p)
                  if (found) setPrice(found.price)
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                {plans.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <Field label="סכום ₪ (ללא מע״מ)" value={String(price)} onChange={v => setPrice(Number(v))} dir="ltr" type="number" />
            <button type="submit" disabled={adding}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
              {adding ? 'מוסיף...' : 'רשום תשלום'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Subscription history */}
      {lab.subscriptions.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-3xl">💳</p>
          <p className="text-gray-500 text-sm">אין היסטוריית תשלומים</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">היסטוריית תשלומים</p>
          {lab.subscriptions.map(sub => {
            const until = new Date(sub.validUntil)
            const isPast = until < new Date()
            return (
              <div key={sub._id} className={`rounded-xl border p-4 space-y-2 ${isPast ? 'border-gray-800 bg-gray-800/30' : 'border-emerald-800/40 bg-emerald-900/10'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{plans.find(p => p.key === sub.plan)?.label.split(' — ')[0] ?? sub.plan}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{plans.find(p => p.key === sub.plan)?.monthly ? 'חיוב חודשי — אחרי 3 שנים' : 'תשלום חד-פעמי ל-3 שנים'}</p>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${isPast ? 'text-gray-500' : 'text-emerald-400'}`}>
                      ₪{sub.price.toLocaleString('he-IL')}
                    </p>
                    <p className="text-[10px] text-gray-500">+ מע"מ</p>
                  </div>
                </div>
                <div className="flex gap-6 text-xs text-gray-500">
                  <span>📅 תשלום: {new Date(sub.createdAt).toLocaleDateString('he-IL')}</span>
                  <span className={isPast ? 'text-red-400' : 'text-emerald-400'}>
                    {isPast ? '⚠️ פג:' : '✅ תקף עד:'} {until.toLocaleDateString('he-IL')}
                  </span>
                </div>
              </div>
            )
          })}
          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-800 text-sm">
            <span className="text-gray-400">סה"כ שולם</span>
            <span className="font-bold text-white">
              ₪{lab.subscriptions.reduce((s, x) => s + x.price, 0).toLocaleString('he-IL')} + מע"מ
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create Lab Modal ─────────────────────────────────────────────────────────
function CreateLabModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const plans = useLivePlans()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<CreateLabPayload>({
    name: '', address: '', phone: '', email: '',
    managerName: '', managerEmail: '', managerPassword: '',
    plan: 'lab_lifetime_3y', price: 19000,
  })
  useEffect(() => {
    const launch = plans.find(p => p.key === 'lab_lifetime_3y')
    if (launch) setForm(f => ({ ...f, price: launch.price }))
  }, [plans])
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  const set = <K extends keyof CreateLabPayload>(k: K, v: CreateLabPayload[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    setErr('')
    setLoading(true)
    try {
      await createAdminLab(form)
      onCreate()
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : 'שגיאה ביצירה')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-bold text-white">🏭 מעבדה חדשה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}>{step > s ? '✓' : s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-emerald-600' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>
        <div className="flex px-6 pt-1 pb-4 gap-2">
          {['פרטי מעבדה', 'פרטי מנהל', 'תוכנית מנוי'].map((l, i) => (
            <p key={i} className="flex-1 text-[10px] text-gray-500 text-center">{l}</p>
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 space-y-4">
          {step === 1 && (
            <>
              <Field label="שם מעבדה *" value={form.name} onChange={v => set('name', v)} placeholder="לדוג׳: סמייל פרו מעבדות שיניים" />
              <Field label="כתובת" value={form.address ?? ''} onChange={v => set('address', v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="טלפון" value={form.phone ?? ''} onChange={v => set('phone', v)} dir="ltr" />
                <Field label="אימייל מעבדה" value={form.email ?? ''} onChange={v => set('email', v)} dir="ltr" type="email" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs text-gray-400 bg-gray-800/50 rounded-xl px-3 py-2">
                💡 המנהל יקבל גישה מלאה לניהול העבודות, הצוות ולוח הבקרה של המעבדה
              </p>
              <Field label="שם מנהל" value={form.managerName ?? ''} onChange={v => set('managerName', v)} />
              <Field label="אימייל מנהל *" value={form.managerEmail} onChange={v => set('managerEmail', v)} dir="ltr" type="email" />
              <Field label="סיסמה ראשונית *" value={form.managerPassword} onChange={v => set('managerPassword', v)} dir="ltr" type="password" placeholder="לפחות 6 תווים" />
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs text-gray-400 bg-blue-900/20 border border-blue-900/30 rounded-xl px-3 py-2">
                💡 הסכומים והשנים נלקחים מהמחירון הנוכחי. מנוי שנשמר נשאר עם הסכום והתקופה שנרשמו לו, גם אם המחירון ישתנה אחר כך.
              </p>

              <div className="space-y-2">
                {plans.map(p => (
                  <label key={p.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.plan === p.key
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input type="radio" name="plan" value={p.key} checked={form.plan === p.key}
                      onChange={() => { set('plan', p.key); set('price', p.price) }}
                      className="accent-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{p.label}</p>
                      {p.badge && <span className="text-xs text-yellow-400">{p.badge}</span>}
                    </div>
                    {!p.monthly && <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">חד-פעמי</span>}
                  </label>
                ))}
              </div>

              <div className="bg-gray-800/60 rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-400 text-sm">לחיוב</span>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">₪{(form.price ?? 0).toLocaleString('he-IL')}</p>
                  <p className="text-[10px] text-gray-500">
                    {plans.find(p => p.key === form.plan)?.monthly ? 'לחודש + מע"מ' : 'חד-פעמי + מע"מ (3 שנים)'}
                  </p>
                </div>
              </div>
            </>
          )}

          {err && <p className="text-red-400 text-sm bg-red-900/20 rounded-xl px-3 py-2">{err}</p>}

          {/* Navigation buttons */}
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as typeof step)}
                className="flex-1 py-2.5 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm transition-colors">
                ← אחורה
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !form.name) { setErr('שם מעבדה חובה'); return }
                  if (step === 2 && (!form.managerEmail || !form.managerPassword)) { setErr('אימייל וסיסמה חובה'); return }
                  setErr('')
                  setStep(s => (s + 1) as typeof step)
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                הבא →
              </button>
            ) : (
              <button
                onClick={handleCreate} disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? '⏳ יוצר...' : '✅ צור מעבדה'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Shared Field component ───────────────────────────────────────────────────
function Field({
  label, value, onChange, dir = 'rtl', type = 'text', placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  dir?: 'ltr' | 'rtl'
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type} value={value} dir={dir}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  )
}
