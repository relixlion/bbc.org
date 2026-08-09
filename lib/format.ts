// Pure utility functions — no 'use client' — safe to import anywhere
export function formatNaira(n: number): string {
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function maskPhone(phone: string): string {
  return phone.slice(0, 4) + '*****' + phone.slice(-3)
}
