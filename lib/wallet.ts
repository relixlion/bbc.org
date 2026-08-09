import { supabaseAdmin } from './supabase'
import { Tier, WithdrawalTier } from '@/types'

export async function getSettings() {
  const { data } = await supabaseAdmin
    .from('admin_settings')
    .select('key, value')
  const map: Record<string, unknown> = {}
  data?.forEach((r) => { map[r.key] = r.value })
  return map
}

export function computeTier(totalInvested: number, tiers: WithdrawalTier[]): Tier {
  const sorted = [...tiers].sort((a, b) => b.min_invested - a.min_invested)
  for (const t of sorted) {
    if (totalInvested >= t.min_invested) return t.name
  }
  return 'bronze'
}

export async function creditWallet(
  userId: string,
  amount: number,
  type: string,
  note: string,
  reference?: string
) {
  // Credit wallet
  await supabaseAdmin.rpc('increment_wallet', { uid: userId, amt: amount })

  // Log transaction
  await supabaseAdmin.from('transactions').insert({
    user_id: userId,
    type,
    amount,
    direction: 'credit',
    note,
    reference: reference ?? null,
  })
}

export async function debitWallet(
  userId: string,
  amount: number,
  type: string,
  note: string,
  reference?: string
) {
  await supabaseAdmin.rpc('decrement_wallet', { uid: userId, amt: amount })
  await supabaseAdmin.from('transactions').insert({
    user_id: userId,
    type,
    amount,
    direction: 'debit',
    note,
    reference: reference ?? null,
  })
}

export function isWithdrawalDayAllowed(tier: WithdrawalTier): boolean {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return tier.days.includes(today)
}

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function maskPhone(phone: string): string {
  return phone.slice(0, 4) + '*'.repeat(5) + phone.slice(-3)
}
