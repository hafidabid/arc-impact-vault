import { BookOpenText, Gauge, HeartHandshake, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cx } from '@/lib/cx'
import { ConnectButton } from './ConnectButton'
import { Logo } from './Logo'

const ITEMS = [
  { to: '/admin', label: 'Overview', icon: Gauge, end: true },
  { to: '/admin/ledger', label: 'Ledger', icon: BookOpenText, end: false },
  { to: '/admin/causes', label: 'Causes', icon: HeartHandshake, end: false },
]

/** Separate, labelled workspace. Admin controls never appear among donor actions. */
export function AdminShell() {
  return (
    <div className="min-h-dvh bg-ivory">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-forest px-4 py-3 font-semibold text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-forest text-ivory">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo compact />
            <p className="font-semibold">Admin workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/dashboard" className="btn min-h-[44px] px-3 text-sm text-ivory hover:bg-ivory/10 on-forest">
              <LogOut aria-hidden className="h-4 w-4" />
              Exit to app
            </NavLink>
            <ConnectButton size="compact" />
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto max-w-content px-2 md:px-5 lg:px-7">
          <ul className="flex gap-1 overflow-x-auto">
            {ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cx(
                      'on-forest flex min-h-[44px] items-center gap-2 border-b-[3px] px-3 text-[15px] font-medium transition duration-150',
                      isActive ? 'border-gold text-ivory' : 'border-transparent text-ivory/80 hover:text-ivory',
                    )
                  }
                >
                  <item.icon aria-hidden className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-content px-4 pb-16 pt-6 outline-none md:px-6 md:pt-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
