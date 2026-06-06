import { STAGES, type Stage, type StageHistoryEntry } from '../types'

interface Props {
  currentStage: Stage
  history: StageHistoryEntry[]
}

export default function ProgressTimeline({ currentStage, history }: Props) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage)

  const getHistoryEntry = (stage: Stage) =>
    history.find((h) => h.stage === stage)

  return (
    <div className="space-y-1">
      {STAGES.map((stage, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        const entry = getHistoryEntry(stage.key)

        return (
          <div key={stage.key} className="flex items-start gap-3">
            {/* Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                    : 'bg-white border-gray-200 text-gray-300'
                }`}
              >
                {done ? '✓' : idx + 1}
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`w-0.5 h-6 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className="pb-2 flex-1">
              <p
                className={`text-sm font-medium ${
                  active ? 'text-primary-700' : done ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {stage.label}
              </p>
              {entry && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(entry.at).toLocaleString('he-IL')} · {entry.by.name}
                  {entry.note && <span className="mr-1 text-gray-500"> — {entry.note}</span>}
                </p>
              )}
              {entry?.images && entry.images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {entry.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="stage"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
