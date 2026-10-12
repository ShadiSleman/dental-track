import { useEffect, useState } from 'react'
import { getPricing, updatePricing, type PriceCatalog } from '../../api/admin'

const FIELDS: { key: keyof PriceCatalog; title: string; hint: string }[] = [
  { key: 'lifetimePrice', title: 'פתיחת מעבדה — חד-פעמי ל-3 שנים', hint: 'כל מעבדה חדשה משלמת את זה פעם אחת. לא כולל מע״מ.' },
  { key: 'starterPrice',  title: 'אחרי 3 שנים — עד 3 רופאים',        hint: 'חיוב חודשי. לא כולל מע״מ.' },
  { key: 'standardPrice', title: 'אחרי 3 שנים — עד 10 רופאים',       hint: 'חיוב חודשי. לא כולל מע״מ.' },
  { key: 'proPrice',      title: 'אחרי 3 שנים — ללא הגבלת רופאים',   hint: 'חיוב חודשי. לא כולל מע״מ.' },
]

/** Four catalog prices. Each field saves on its own so the number is editable in place. */
export function PriceFields() {
  const [form, setForm] = useState<PriceCatalog>({ lifetimePrice: 19000, starterPrice: 290, standardPrice: 590, proPrice: 990 })
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  useEffect(() => {
    getPricing().then(setForm).finally(() => setLoading(false))
  }, [])

  const saveField = async (key: keyof PriceCatalog) => {
    setSavingKey(key)
    setSavedKey(null)
    try {
      const next = await updatePricing(form)
      setForm(next)
      setSavedKey(key)
    } finally { setSavingKey(null) }
  }

  if (loading) return <div className="h-24 bg-gray-900 rounded-2xl animate-pulse" />

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {FIELDS.map(f => (
        <div key={f.key} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-sm font-semibold text-white">{f.title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 mb-2">{f.hint} שינוי כאן לא משנה מנויים שכבר נשמרו.</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">₪</span>
            <input
              type="number"
              min={0}
              dir="ltr"
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => saveField(f.key)}
              disabled={savingKey === f.key}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-xs font-semibold"
            >
              {savingKey === f.key ? '...' : savedKey === f.key ? 'נשמר' : 'שמור'}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">
            כולל מע״מ ₪{Math.round(Number(form[f.key] || 0) * 1.18).toLocaleString('he-IL')}
          </p>
        </div>
      ))}
    </div>
  )
}

export default function AdminPricing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🏷️ מחירון</h1>
        <p className="text-gray-400 text-sm mt-1">
          המחירים כאן חלים רק על מעבדה חדשה או על חידוש שתרשום מעכשיו.
          מנוי שכבר נשמר נשאר עם הסכום שנרשם עליו.
        </p>
      </div>

      <PriceFields />
    </div>
  )
}
