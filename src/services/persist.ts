import type { VaultState } from '@/lib/types'

const STORAGE_KEY = 'impactvault-demo-state-v1'
const BIG_TAG = '$bigint'

const replacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? { [BIG_TAG]: value.toString() } : value

const reviver = (_key: string, value: unknown) => {
  if (value && typeof value === 'object' && BIG_TAG in value) {
    return BigInt((value as Record<string, string>)[BIG_TAG])
  }
  return value
}

/** Demo state survives a refresh, so pending operations can be recovered by operation ID. */
export function loadState(): VaultState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw, reviver) as VaultState
    if (parsed.version !== 1 || !Array.isArray(parsed.operations)) return null
    if (parsed.session.status === 'connecting') parsed.session.status = 'disconnected'
    return parsed
  } catch {
    return null
  }
}

export function saveState(state: VaultState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state, replacer))
  } catch {
    // Storage can be unavailable (private mode). The demo still works in memory.
  }
}
