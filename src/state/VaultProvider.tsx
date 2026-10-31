import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { buildOverview } from '@/lib/selectors'
import type { Overview } from '@/lib/selectors'
import type { FlowPhase, FlowResult, VaultState } from '@/lib/types'
import { vaultClient } from '@/services'
import type { VaultClient } from '@/services'

interface VaultContextValue {
  state: VaultState
  overview: Overview
  client: VaultClient
}

const subscribe = (listener: () => void) => vaultClient.subscribe(listener)
const getSnapshot = () => vaultClient.getState()

const VaultContext = createContext<VaultContextValue | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const overview = useMemo(() => buildOverview(state), [state])
  const value = useMemo(() => ({ state, overview, client: vaultClient }), [state, overview])
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault(): VaultContextValue {
  const value = useContext(VaultContext)
  if (!value) throw new Error('useVault must be used inside VaultProvider')
  return value
}

export type FlowUiPhase = 'idle' | FlowPhase

/**
 * Runs one money flow at a time. A second call while a flow is active is ignored,
 * so a slow or unknown submission can never produce a duplicate payment.
 */
export function useFlow() {
  const [phase, setPhase] = useState<FlowUiPhase>('idle')
  const [result, setResult] = useState<FlowResult | null>(null)
  const active = useRef(false)

  const run = useCallback(async (start: (onPhase: (next: FlowPhase) => void) => Promise<FlowResult>) => {
    if (active.current) return null
    active.current = true
    setResult(null)
    try {
      const outcome = await start((next) => setPhase(next))
      setResult(outcome)
      return outcome
    } finally {
      active.current = false
      setPhase('idle')
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setPhase('idle')
  }, [])

  return { phase, result, run, reset, busy: phase !== 'idle' }
}
