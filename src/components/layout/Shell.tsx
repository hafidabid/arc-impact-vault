import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useVault } from '@/state/VaultProvider'
import { ConnectButton } from './ConnectButton'
import { DemoBanner } from './DemoBanner'
import { DisclosureFooter } from './Footer'
import { Logo } from './Logo'
import { BottomNav, SideNav } from './Navigation'

const WALLET_ROUTES = ['/dashboard', '/deposit', '/activity', '/withdraw', '/account']

function useShellMode(): 'app' | 'public' {
  const { pathname } = useLocation()
  const { overview } = useVault()
  if (pathname === '/' || pathname.startsWith('/onboarding')) return 'public'
  if (WALLET_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return 'app'
  return overview.connected ? 'app' : 'public'
}

/** Moves focus to the page region after navigation (not on first load) and resets scroll. */
function useRouteFocus(mainRef: React.RefObject<HTMLElement>) {
  const { pathname, hash } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (first.current) {
      first.current = false
      target?.scrollIntoView()
      return
    }
    if (target) {
      target.scrollIntoView()
      return
    }
    window.scrollTo({ top: 0 })
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname, hash, mainRef])
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-4 py-2 md:px-6 lg:px-8">
        <Logo compact className="sm:hidden" />
        <Logo className="hidden sm:inline-flex" />
        <nav aria-label="Public" className="flex items-center gap-1 sm:gap-2">
          <Link to="/onboarding" className="btn btn-ghost hidden text-[15px] font-medium sm:inline-flex">
            How it works
          </Link>
          <Link to="/impact" className="btn btn-ghost text-[15px] font-medium">
            Explore
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  )
}

function AppTopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-4 py-2 md:justify-end md:px-6 lg:px-8">
        <Logo compact className="md:hidden" />
        <ConnectButton size="compact" />
      </div>
    </header>
  )
}

export function Shell() {
  const mode = useShellMode()
  const mainRef = useRef<HTMLElement>(null)
  useRouteFocus(mainRef)
  const { pathname } = useLocation()
  const isApp = mode === 'app'

  return (
    <div className="min-h-dvh bg-ivory">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-forest px-4 py-3 font-semibold text-ivory focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <DemoBanner />
      <div className="flex">
        {isApp ? <SideNav /> : null}
        <div className="flex min-h-[calc(100dvh-44px)] min-w-0 flex-1 flex-col">
          {isApp ? <AppTopBar /> : <PublicHeader />}
          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className="mx-auto w-full max-w-content flex-1 px-4 pb-12 pt-6 outline-none md:px-6 md:pt-8 lg:px-8"
          >
            <Outlet />
          </main>
          <div className={isApp ? 'pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0' : undefined}>
            <DisclosureFooter full={pathname === '/' || pathname === '/impact'} />
          </div>
        </div>
      </div>
      {isApp ? <BottomNav /> : null}
    </div>
  )
}
