import { useEffect, useState } from 'react'
import { getAllOrders, updateStage, saveSignature } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import SignaturePad from '../components/SignaturePad'
import type { WorkOrder } from '../types'

export default function CourierView() {
  const { orders, setOrders, upsertOrder, loading, setLoading } = useOrdersStore()
  const [sigOrder, setSigOrder] = useState<WorkOrder | null>(null)

  useEffect(() => {
    setLoading(true)
    getAllOrders({ stage: 'ready_to_ship,with_courier' })
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [setOrders, setLoading])

  const pickups  = orders.filter((o: WorkOrder) => o.currentStage === 'ready_to_ship')
  const enroute  = orders.filter((o: WorkOrder) => o.currentStage === 'with_courier')

  const handlePickup = async (o: WorkOrder) => {
    const updated = await updateStage(o._id, 'with_courier', 'נאסף על ידי שליח')
    upsertOrder(updated)
  }

  const handleDelivered = (o: WorkOrder) => setSigOrder(o)

  const handleSignSave = async (dataUrl: string) => {
    if (!sigOrder) return
    await saveSignature(sigOrder._id, dataUrl)
    const updated = await updateStage(sigOrder._id, 'delivered', 'נמסר למרפאה')
    upsertOrder(updated)
    setSigOrder(null)
  }

  if (sigOrder) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">אישור מסירה — #{sigOrder.orderNumber}</h2>
        <p className="text-sm text-gray-600 mb-4">
          מסירה ל: {sigOrder.clinic?.name}
        </p>
        <SignaturePad onSave={handleSignSave} onCancel={() => setSigOrder(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      <h2 className="text-xl font-bold text-gray-900">משלוחים</h2>

      {/* Pickups */}
      <section>
        <h3 className="font-semibold text-gray-700 mb-2">📦 לאיסוף ({pickups.length})</h3>
        {pickups.length === 0 ? (
          <p className="text-sm text-gray-400 px-2">אין איסופים ממתינים</p>
        ) : (
          <div className="space-y-3">
            {pickups.map((o: WorkOrder) => (
              <div key={o._id} className="card border-r-4 border-r-teal-400">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-gray-400">#{o.orderNumber}</span>
                    <h4 className="font-semibold">{o.patientCode}</h4>
                    <p className="text-sm text-gray-500">{o.lab?.name}</p>
                    {o.lab?.address && (
                      <p className="text-xs text-gray-400 mt-1">📍 {o.lab.address}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => handlePickup(o)} className="btn-primary w-full text-sm">
                  ✅ סמן כנאסף
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* En route */}
      <section>
        <h3 className="font-semibold text-gray-700 mb-2">🚚 בדרך ({enroute.length})</h3>
        {enroute.length === 0 ? (
          <p className="text-sm text-gray-400 px-2">אין משלוחים בדרך</p>
        ) : (
          <div className="space-y-3">
            {enroute.map((o: WorkOrder) => (
              <div key={o._id} className="card border-r-4 border-r-pink-400">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-gray-400">#{o.orderNumber}</span>
                    <h4 className="font-semibold">{o.patientCode}</h4>
                    <p className="text-sm text-gray-500">{o.clinic?.name}</p>
                    {o.clinic?.address && (
                      <p className="text-xs text-gray-400 mt-1">📍 {o.clinic.address}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelivered(o)} className="btn-primary w-full text-sm">
                  📝 מסירה וחתימה
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
