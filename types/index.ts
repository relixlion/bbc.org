export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type PlanCategory = 'bigbrother' | 'football' | 'forest'
export type PlanType = 'daily' | 'fixed'
export type RewardType = 'daily' | 'fixed' | 'referral' | 'checkin' | 'salary' | 'admin_gift'
export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected'
export type Direction = 'credit' | 'debit'

export interface User {
  id: string
  phone: string
  referral_code: string
  referred_by: string | null
  wallet_balance: number
  total_invested: number
  tier: Tier
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  is_admin: boolean
  created_at: string
}

export interface Plan {
  id: string
  name: string
  category: PlanCategory
  plan_type: PlanType
  price: number
  daily_return: number | null
  fixed_return_percent: number | null
  duration_days: number
  is_active: boolean
  created_at: string
}

export interface UserPlan {
  id: string
  user_id: string
  plan_id: string
  amount_paid: number
  wallet_used: number
  paystack_used: number
  paystack_ref: string | null
  start_date: string
  end_date: string
  last_reward_date: string | null
  status: 'active' | 'matured' | 'completed'
  created_at: string
  plan?: Plan
}

export interface Reward {
  id: string
  user_id: string
  type: RewardType
  amount: number
  label: string | null
  status: 'pending' | 'claimed'
  task_required: boolean
  task_completed: boolean
  source_plan_id: string | null
  created_at: string
  claimed_at: string | null
}

export interface Task {
  id: string
  type: 'daily_reward' | 'weekly_salary' | 'checkin'
  title: string
  link: string | null
  is_active: boolean
  updated_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  bank_name: string
  account_number: string
  account_name: string
  status: WithdrawalStatus
  admin_note: string | null
  requested_at: string
  processed_at: string | null
  user?: Pick<User, 'phone' | 'tier'>
}

export interface CommunityPost {
  id: string
  user_id: string
  image_url: string | null
  amount_shown: number | null
  status: 'visible' | 'hidden'
  created_at: string
  user?: Pick<User, 'phone'>
}

export interface Transaction {
  id: string
  user_id: string
  type: string
  amount: number
  direction: Direction
  reference: string | null
  note: string | null
  created_at: string
}

export interface WithdrawalTier {
  name: Tier
  label: string
  min_invested: number
  threshold: number
  days: string[]
}

export interface AdminSettings {
  checkin_amount: number
  referral_rates: { l1: number; l2: number; l3: number }
  withdrawal_tiers: WithdrawalTier[]
  weekly_salary: Record<Tier, number>
}

export interface SessionUser {
  id: string
  phone: string
  tier: Tier
  is_admin: boolean
  wallet_balance: number
}
