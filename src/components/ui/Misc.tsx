import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('skeleton h-5 w-full', className)} />
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-quiet min-w-[44px] px-3"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        })
      }}
    >
      {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
      <span className="t-small font-medium">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

export function SectionHeading({
  title,
  description,
  action,
  id,
}: {
  title: string
  description?: string
  action?: ReactNode
  id?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 id={id} className="t-section">
          {title}
        </h2>
        {description ? <p className="prose-reading t-small mt-1 text-ink/80">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Definition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="t-small text-ink/80">{term}</dt>
      <dd className="num min-w-0 break-words text-[15px] font-medium text-ink sm:text-right">{children}</dd>
    </div>
  )
}
