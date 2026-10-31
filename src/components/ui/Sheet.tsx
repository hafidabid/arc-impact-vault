import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

/** Modal dialog built on the native element: focus trap, Escape to close, focus return. */
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className="p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="t-section">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="t-small mt-1 text-ink/80">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="btn btn-quiet h-11 w-11 shrink-0 px-0" aria-label="Close" onClick={onClose}>
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        {open ? children : null}
      </div>
    </dialog>
  )
}
