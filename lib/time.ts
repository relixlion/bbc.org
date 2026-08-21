/**
 * Get current time in Nigerian timezone (Africa/Lagos, UTC+1, no DST)
 * Use this everywhere business logic depends on day/time.
 */
export function nowNigeria(): Date {
  // Offset Nigeria time: UTC+1
  const utc = Date.now()
  const nigeriaOffset = 60 * 60 * 1000 // +1 hour in ms
  return new Date(utc + nigeriaOffset)
}

export function todayNigeria(): string {
  return nowNigeria().toISOString().split('T')[0]
}

export function isSundayNigeria(): boolean {
  return nowNigeria().getUTCDay() === 0
}

export function endOfDayNigeria(): Date {
  const now = nowNigeria()
  // Set to 23:59:59.999 Nigeria time, then convert back to UTC
  const end = new Date(now)
  end.setUTCHours(22, 59, 59, 999) // 23:59:59 Nigeria = 22:59:59 UTC
  return end
}