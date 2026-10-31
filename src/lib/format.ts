const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

const dayOnly = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "31 Oct 2026, 09:00 UTC". The timezone is always stated. */
export const fmtDateTime = (iso: string): string => `${dateTime.format(new Date(iso))} UTC`
export const fmtDay = (iso: string): string => dayOnly.format(new Date(iso))
export const dayKey = (iso: string): string => iso.slice(0, 10)
