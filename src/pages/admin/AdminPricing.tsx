import { useEffect, useState } from 'react'
import { getPricing, updatePricing, type PriceCatalog } from '../../api/admin'

const FIELDS: { key: keyof PriceCatalog; title: string; hint: string }[] = [
  { key: 'lifetimePrice', title: 'פתיחת מעבדה — חד-פעמי ל-3 שנים', hint: 'כל מעבדה חדשה משלמת את זה פעם אחת. לא כולל מע״מ.' },
  { key: 'starterPrice',  title: 'אחרי 3 שנים — עד 3 רופאים',        hint: 'חיוב חודשי. לא כולל מע״מ.' },
  { key: 'standardPrice', title: 'אחרי 3 שנים — עד 10 רופאים',       hint: 'חיוב חודשי. לא כולל מע״מ.' },
  { key: 'proPrice',      title: 'אחרי 3 שנים — ללא הגבלת רופאים',   hint: 'חיוב חודשי. לא כולל מע״מ.' },
]

export default function AdminPricing() {
  const [form, setForm]     = useState<PriceCatalog>({ lifetimePrice: 19000, starterPrice: 290, standardPrice: 590, proPrice: 990 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    getPricing().then(setForm).finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const next = await updatePricing(form)
      setForm(next)
      setSaved(true)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">🏷️ מחירון</h1>
        <p className="text-gray-400 text-sm mt-1">
          המחירים כאן חלים רק על מעבדה חדשה או על חידוש שתרשום מעכשיו.
          מנוי שכבר נשמר נשאר עם הסכום שנרשם עליו.
        </p>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-900 rounded-2xl animate-pulse" />
      ) : (
        <form onSubmit={save} className="space-y-4">
          {FIELDS.map(f => (
            <label key={f.key} className="block bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <span className="block text-sm font-semibold text-white">{f.title}</span>
              <span className="block text-xs text-gray-500 mt-0.5 mb-2">{f.hint}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">₪</span>
                <input
                  type="number"
                  min={0}
                  dir="ltr"
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm"
                />
                <span className="text-xs text-gray-500 w-28 text-left">
                  כולל מע״מ ₪{Math.round(Number(form[f.key]) * 1.18).toLocaleString('he-IL')}
                </span>
              </div>
            </label>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl font-semibold text-sm"
          >
            {saving ? 'שומר...' : 'שמור מחירון'}
          </button>
          {saved && <p className="text-emerald-400 text-sm text-center">המחירון עודכן. מנויים קיימים לא השתנו.</p>}
        </form>
      )}
    </div>
  )
}
