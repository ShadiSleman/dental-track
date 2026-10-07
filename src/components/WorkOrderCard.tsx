import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { WorkOrder } from '../types'
import { STAGES } from '../types'

interface Props {
  order: WorkOrder
}

export default function WorkOrderCard({ order }: Props) {
  const navigate = useNavigate()
  const stageInfo = STAGES.find((s) => s.key === order.currentStage)
  const stageIdx = STAGES.findIndex((s) => s.key === order.currentStage)
  const progress = Math.round(((stageIdx + 1) / STAGES.length) * 100)

  const daysLeft = order.dueDate
    ? Math.ceil((new Date(order.dueDate).getTime() - Date.now()) / 86400000)
    : null

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/orders/${order._id}`)}
      className={`card cursor-pointer hover:shadow-md transition-shadow border-r-4 ${
        order.isDelayed
          ? 'border-r-red-400'
          : order.requiresDoctorApproval
          ? 'border-r-yellow-400'
          : order.currentStage === 'delivered'
          ? 'border-r-green-400'
          : 'border-r-primary-400'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-xs text-gray-400">#{order.orderNumber}</span>
          <h3 className="font-semibold text-gray-900">{order.patientCode}</h3>
          {order.gender && (
            <p className="text-xs text-gray-400">{order.gender}{order.birthDate ? ` · ${new Date(order.birthDate).toLocaleDateString('he-IL')}` : ''}</p>
          )}
        </div>
        <div className="text-left">
          {order.isDelayed && (
            <span className="badge bg-red-100 text-red-700">מאחר</span>
          )}
          {order.requiresDoctorApproval && !order.isDelayed && (
            <span className="badge bg-yellow-100 text-yellow-700">ממתין לאישורך</span>
          )}
          {!order.isDelayed && !order.requiresDoctorApproval && stageInfo && (
            <span className={`badge text-white ${stageInfo.color}`}>{stageInfo.label}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div
          className="bg-primary-500 h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>{order.lab?.name}</span>
        {daysLeft !== null && (
          <span className={daysLeft < 0 ? 'text-red-500 font-medium' : daysLeft <= 2 ? 'text-orange-500' : ''}>
            {daysLeft < 0
              ? `פג תוקף לפני ${Math.abs(daysLeft)} ימים`
              : daysLeft === 0
              ? 'אספקה היום'
              : `${daysLeft} ימים לאספקה`}
          </span>
        )}
      </div>
    </motion.div>
  )
}
