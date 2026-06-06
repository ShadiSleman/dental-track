import { useRef, useEffect } from 'react'
import SignaturePadLib from 'signature_pad'

interface Props {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export default function SignaturePad({ onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    padRef.current = new SignaturePadLib(canvasRef.current, {
      backgroundColor: 'rgb(255,255,255)',
    })
    const resize = () => {
      const canvas = canvasRef.current!
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')!.scale(ratio, ratio)
      padRef.current!.clear()
    }
    window.addEventListener('resize', resize)
    resize()
    return () => window.removeEventListener('resize', resize)
  }, [])

  const handleSave = () => {
    if (!padRef.current || padRef.current.isEmpty()) return
    onSave(padRef.current.toDataURL())
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-gray-800">חתימה דיגיטלית</h3>
      <canvas
        ref={canvasRef}
        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg"
        style={{ touchAction: 'none' }}
      />
      <div className="flex gap-2 justify-end">
        <button onClick={() => padRef.current?.clear()} className="btn-secondary text-sm">
          נקה
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">
          ביטול
        </button>
        <button onClick={handleSave} className="btn-primary text-sm">
          שמור חתימה
        </button>
      </div>
    </div>
  )
}
