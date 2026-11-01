import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, usePageTitle } from '@/components/layout/PageParts'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <EmptyState
      icon={<Compass className="h-6 w-6" />}
      title="We could not find that page"
      action={
        <>
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link to="/impact" className="btn btn-secondary">
            View approved causes
          </Link>
        </>
      }
    >
      The page may have moved, or the address may be mistyped.
    </EmptyState>
  )
}
