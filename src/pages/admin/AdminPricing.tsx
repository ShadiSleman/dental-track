import { useEffect, useState } from 'react'
import { getPricing, updatePricing, type PriceCatalog } from '../../api/admin'

const EMPTY: PriceCatalog = {
  lifetimePrice: 19000, starterPrice: 290, standardPrice: 590, proPrice: 990,
  termYears: 3, starterDoctors: 3, standardDoctors: 10,
}

function Num({ value, onChange, width = 'w-16' }: { value: number; onChange: (n: number) => void; width?: string }) {
  return (
    <input
      type="number"
      min={1}
      dir="ltr"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className={`${width} bg-gray-800 border border-blue-600 rounded-lg px-2 py-1 text-white text-center text-sm focus:outline-none focus:border-blue-400`}
    />
  )
}

export default function AdminPricing() {
  const [form, setForm] = useState<PriceCatalog>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPricing()
      .then(row => setForm({ ...EMPTY, ...row }))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof PriceCatalog>(key: K, value: number) => {
    setSaved(false)
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const next = await updatePricing(form)
      setForm({ ...EMPTY, ...next })
      setSaved(true)
    } catch {
      setError('שמירה נכשלה')
    } finally { setSaving(false) }
  }

  const vat = (n: number) => Math.round((Number(n) || 0) * 1.18).toLocaleString('he-IL')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">🏷️ מחירון</h1>
        <p className="text-gray-400 text-sm mt-1">
          אפשר לשנות גם את הסכום וגם את המספרים שבתוך המשפט — כמה שנים, ועד כמה רופאים.
          מספר השנים אחד: הוא מופיע גם בפתיחה וגם ב"אחרי X שנים".
          השינוי חל על מעבדה חדשה בלבד. מנוי שכבר נשמר לא משתנה.
        </p>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-900 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-3">
          <Row
            price={form.lifetimePrice}
            onPrice={v => set('lifetimePrice', v)}
            vatLabel={vat(form.lifetimePrice)}
            once
          >
            <span>פתיחת מעבדה — חד-פעמי ל-</span>
            <Num value={form.termYears} onChange={v => set('termYears', v)} />
            <span>שנים</span>
          </Row>

          <Row price={form.starterPrice} onPrice={v => set('starterPrice', v)} vatLabel={vat(form.starterPrice)}>
            <span>אחרי</span>
            <Num value={form.termYears} onChange={v => set('termYears', v)} />
            <span>שנים — עד</span>
            <Num value={form.starterDoctors} onChange={v => set('starterDoctors', v)} />
            <span>רופאים</span>
          </Row>

          <Row price={form.standardPrice} onPrice={v => set('standardPrice', v)} vatLabel={vat(form.standardPrice)}>
            <span>אחרי</span>
            <Num value={form.termYears} onChange={v => set('termYears', v)} />
            <span>שנים — עד</span>
            <Num value={form.standardDoctors} onChange={v => set('standardDoctors', v)} />
            <span>רופאים</span>
          </Row>

          <Row price={form.proPrice} onPrice={v => set('proPrice', v)} vatLabel={vat(form.proPrice)}>
            <span>אחרי</span>
            <Num value={form.termYears} onChange={v => set('termYears', v)} />
            <span>שנים — ללא הגבלת רופאים</span>
          </Row>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl font-semibold text-sm"
          >
            {saving ? 'שומר...' : 'שמור מחירון'}
          </button>
          {saved && <p className="text-emerald-400 text-sm text-center">נשמר. מנויים קיימים לא השתנו.</p>}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      )}
    </div>
  )
}

function Row({
  children, price, onPrice, vatLabel, once,
}: {
  children: React.ReactNode
  price: number
  onPrice: (n: number) => void
  vatLabel: string
  once?: boolean
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
        {children}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">₪</span>
        <input
          type="number"
          min={0}
          dir="ltr"
          value={price}
          onChange={e => onPrice(Number(e.target.value))}
          className="w-36 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-gray-500">{once ? 'חד-פעמי' : 'לחודש'} · כולל מע״מ ₪{vatLabel}</span>
      </div>
    </div>
  )
}
