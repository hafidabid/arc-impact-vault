const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

const dayOnly = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** "31 Oct 2026, 09:00 UTC". The timezone is always stated. */
export const fmtUnixDateTime = (seconds: number | bigint): string => `${dateTime.format(new Date(Number(seconds) * 1000))} UTC`
export const fmtUnixDay = (seconds: number | bigint): string => dayOnly.format(new Date(Number(seconds) * 1000))

/** "6 days 4 h", "3 h 20 min", "under a minute". */
export function fmtDuration(seconds: bigint): string {
  const total = Number(seconds)
  if (total < 60) return 'under a minute'
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}
