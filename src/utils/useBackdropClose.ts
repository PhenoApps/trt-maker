import { useRef } from 'react'

// Close a modal on backdrop click, but only when the press also started on the backdrop.
// A plain onClick fires on the backdrop when a text selection inside the dialog ends outside it.
export function useBackdropClose(onClose: () => void) {
  const pressedOnBackdrop = useRef(false)
  return {
    onMouseDown: (e: React.MouseEvent) => {
      pressedOnBackdrop.current = e.target === e.currentTarget
    },
    onClick: (e: React.MouseEvent) => {
      if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose()
      pressedOnBackdrop.current = false
    },
  }
}
