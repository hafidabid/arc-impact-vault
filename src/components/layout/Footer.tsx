import { Link } from 'react-router-dom'
import { COPY, RISK_POINTS } from '@/data/copy'

export function DisclosureFooter({ full = false }: { full?: boolean }) {
  return (
    <footer className="border-t border-ink/10 bg-sage/15">
      <div className="mx-auto max-w-content px-4 py-8 md:px-6 lg:px-8">
        <h2 className="t-label text-forest">Risks and disclosures</h2>
        {full ? (
          <ul className="t-small mt-3 grid max-w-reading list-disc gap-2 pl-5 text-ink/90">
            {RISK_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : (
          <p className="t-small prose-reading mt-2 text-ink/90">{COPY.riskLine}</p>
        )}
        <p className="t-small mt-4 text-ink/75">
          <Link to="/account#disclosures" className="font-medium text-forest underline underline-offset-4">
            Read all disclosures
          </Link>
        </p>
      </div>
    </footer>
  )
}
