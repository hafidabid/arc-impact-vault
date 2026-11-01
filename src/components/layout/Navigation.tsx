import { ArrowDownToLine, ArrowUpFromLine, HeartHandshake, Home, ListChecks, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { CHAIN } from '@/chain/config'
import { shortAddress } from '@/chain/derive'
import { useSession } from '@/chain/hooks'
import { cx } from '@/lib/cx'
import { Logo } from './Logo'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const PRIMARY: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/impact', label: 'Impact', icon: HeartHandshake },
  { to: '/activity', label: 'Activity', icon: ListChecks },
  { to: '/account', label: 'Account', icon: UserRound },
]

const ACTIONS: NavItem[] = [
  { to: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { to: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
]

/** Below 768px: bottom navigation with safe-area padding. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/15 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {PRIMARY.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'relative flex min-h-[60px] flex-col items-center justify-center gap-1 px-2 text-[12px] font-medium transition duration-150',
                  isActive ? 'text-forest' : 'text-ink/75 hover:text-forest',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cx('absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-forest transition duration-150', isActive ? 'opacity-100' : 'opacity-0')}
                  />
                  <item.icon aria-hidden className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 1.8} />
                  <span className={isActive ? 'font-semibold' : undefined}>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SideLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cx(
          'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-control px-1 text-[12px] font-medium transition duration-150 lg:min-h-[44px] lg:flex-row lg:justify-start lg:gap-3 lg:px-3.5 lg:text-[15px]',
          isActive ? 'bg-forest text-ivory' : 'text-ink hover:bg-sage/25',
        )
      }
    >
      <item.icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={2} />
      <span>{item.label}</span>
    </NavLink>
  )
}

/** 768-1023px: compact rail. 1024px and above: labeled sidebar with a wallet and network summary. */
export function SideNav() {
  const session = useSession()
  const connected = session.isConnected
  return (
    <aside className="sticky top-0 hidden h-dvh w-[84px] shrink-0 flex-col border-r border-ink/10 bg-ivory px-2 py-4 md:flex lg:w-[264px] lg:px-4">
      <div className="mb-4 flex justify-center lg:justify-start lg:px-1">
        <Logo compact className="lg:hidden" />
        <Logo className="hidden lg:inline-flex" />
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        <ul className="flex flex-col gap-1">
          {PRIMARY.map((item) => (
            <li key={item.to}>
              <SideLink item={item} />
            </li>
          ))}
        </ul>
        <p className="t-small mt-5 hidden px-3.5 font-medium text-ink/75 lg:block">Actions</p>
        <hr className="mx-3 my-3 border-ink/10 lg:hidden" />
        <ul className="flex flex-col gap-1">
          {ACTIONS.map((item) => (
            <li key={item.to}>
              <SideLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="hidden rounded-card border border-ink/15 bg-sage/15 p-3.5 lg:block">
        <p className="t-small font-medium text-ink/80">Wallet</p>
        <p className="mt-0.5 flex items-center gap-2 text-[15px] font-semibold">
          <span aria-hidden className={cx('h-2 w-2 rounded-full', connected ? (session.wrongNetwork ? 'bg-[#8a2f1d]' : 'bg-forest') : 'bg-ink/40')} />
          <span className="num">{connected && session.address ? shortAddress(session.address) : 'Not connected'}</span>
        </p>
        <p className="t-small mt-2 font-medium text-ink/80">Network</p>
        <p className="text-[15px]">{connected && session.wrongNetwork ? 'Wrong network' : CHAIN.name}</p>
      </div>
    </aside>
  )
}
