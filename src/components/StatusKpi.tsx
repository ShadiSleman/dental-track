import type { ReactNode } from 'react'

type Tone = 'navy' | 'blue' | 'amber' | 'red'

const tones: Record<Tone, { box: string; num: string; on: string }> = {
  navy:  { box: 'bg-[#e7eef8] text-[#1a3a6b]', num: 'text-[#1a3a6b]', on: 'ring-2 ring-[#1a3a6b] bg-[#f3f6fb]' },
  blue:  { box: 'bg-sky-50 text-sky-700',      num: 'text-sky-800',    on: 'ring-2 ring-sky-500 bg-sky-50' },
  amber: { box: 'bg-amber-50 text-amber-700',  num: 'text-amber-800',  on: 'ring-2 ring-amber-400 bg-amber-50' },
  red:   { box: 'bg-rose-50 text-rose-700',    num: 'text-rose-700',   on: 'ring-2 ring-rose-400 bg-rose-50' },
}

export function StatusKpi({
  count, label, icon, tone, active, onClick,
}: {
  count: number
  label: string
  icon: ReactNode
  tone: Tone
  active?: boolean
  onClick: () => void
}) {
  const toneClass = tones[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-right shadow-sm transition ${
        active ? toneClass.on : 'hover:border-gray-300'
      }`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClass.box}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block text-[1.85rem] font-bold leading-none ${active ? 'text-[#1a3a6b]' : toneClass.num}`}>
          {count}
        </span>
        <span className="mt-1 block text-[15px] font-semibold text-gray-800">{label}</span>
      </span>
    </button>
  )
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export function IconNew() {
  return (
    <Svg>
      <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z" />
      <path d="M4 8l8 6 8-6" />
      <path d="M8 4h8" />
    </Svg>
  )
}

export function IconOpen() {
  return (
    <Svg>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6H10l2 2h6.5A1.5 1.5 0 0 1 20 9.5V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V7.5z" />
    </Svg>
  )
}

export function IconPending() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </Svg>
  )
}

export function IconLate() {
  return (
    <Svg>
      <path d="M12 4l8 14H4L12 4z" />
      <path d="M12 10v3.5" />
      <path d="M12 16.5h.01" />
    </Svg>
  )
}

export function IconActive() {
  return (
    <Svg>
      <path d="M8 5.5c-2.2 2-2.8 4.2-2.2 7.2.5 2.6 1.2 4.6 2.2 6.3 1.2 0 1.6-2.4 2.6-4.6.4 2.4.8 4.6 2 4.6.8 0 1.4-1.6 2-4.2 1.2 2.2 1.6 4.2 2.8 4.2 1-.2 1.7-3.6 2.2-6.3.6-3 .1-5.2-2.2-7.2-1.2 1.6-2.2 2.2-3.6 2.2S9.2 7.1 8 5.5z" />
    </Svg>
  )
}
