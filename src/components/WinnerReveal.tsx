import { useEffect, useRef } from 'react'
import type { Entry } from '../types'
import './WinnerReveal.css'

type Props = {
  winner: Entry
  removed: boolean
  onSpinAgain: () => void
  onClose: () => void
}

export function WinnerReveal({ winner, removed, onSpinAgain, onClose }: Props) {
  const primary = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primary.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="reveal" role="dialog" aria-modal="true" aria-labelledby="reveal-name">
      <div className="reveal__scrim" onClick={onClose} />
      <div className="reveal__card" style={{ '--won': winner.color } as React.CSSProperties}>
        <p className="reveal__eyebrow">The wheel stopped on</p>
        <p className="reveal__name" id="reveal-name">
          {winner.label}
        </p>
        {removed && <p className="reveal__note">Taken off the wheel.</p>}
        <div className="reveal__actions">
          <button className="btn btn--brass" type="button" ref={primary} onClick={onSpinAgain}>
            Spin again
          </button>
          <button className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
