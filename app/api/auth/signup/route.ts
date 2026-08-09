import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { setSession, generateReferralCode } from '@/lib/auth'
import { creditWallet } from '@/lib/wallet'

export async function POST(req: NextRequest) {
  try {
    const { phone, password, referral_code } = await req.json()

    // Validate Nigerian phone number
    if (!/^(070|080|081|090|091)\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 11-digit Nigerian phone number' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if phone exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 })
    }

    // Resolve referrer
    let referrerId: string | null = null
    if (referral_code) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referral_code.toUpperCase())
        .single()
      referrerId = referrer?.id ?? null
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Generate unique referral code
    let code = generateReferralCode()
    let codeExists = true
    while (codeExists) {
      const { data } = await supabaseAdmin.from('users').select('id').eq('referral_code', code).single()
      if (!data) codeExists = false
      else code = generateReferralCode()
    }

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        phone,
        password_hash,
        referral_code: code,
        referred_by: referrerId,
        wallet_balance: 0,
        total_invested: 0,
        tier: 'bronze',
      })
      .select()
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Credit ₦1,000 signup bonus
    await creditWallet(user.id, 1000, 'signup_bonus', 'Welcome bonus — ₦1,000 on signup')

    // Update wallet balance in response
    await supabaseAdmin
      .from('users')
      .update({ wallet_balance: 1000 })
      .eq('id', user.id)

    // Set session
    await setSession({
      id: user.id,
      phone: user.phone,
      tier: 'bronze',
      is_admin: false,
      wallet_balance: 1000,
    })

    return NextResponse.json({ success: true, user: { id: user.id, phone: user.phone } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
