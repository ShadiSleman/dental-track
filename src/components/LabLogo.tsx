import React from 'react'

// Deterministic color from lab id/name
function labColor(seed: string): string {
  const palette = [
    '#1a3a6b', // navy (GAZI DENT)
    '#7c3aed', // purple (Smile Pro)
    '#0d9488', // teal (Pearl Tech)
    '#dc2626', // red
    '#d97706', // amber
    '#0284c7', // sky
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  lab: { _id?: string; id?: string; name: string; logoUrl?: string | null }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LabLogo({ lab, size = 'md', className = '' }: Props) {
  const seed = lab._id ?? lab.id ?? lab.name
  const color = labColor(seed)
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }
  const cls = `${sizeMap[size]} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`

  if (lab.logoUrl) {
    return <img src={lab.logoUrl} alt={lab.name} className={`${cls} object-contain bg-white`} />
  }
  return (
    <div className={cls} style={{ backgroundColor: color }}>
      {initials(lab.name)}
    </div>
  )
}
