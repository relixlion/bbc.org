import { NextRequest, NextResponse } from 'next/server'
import { accrueAllDailyRewards, accrueMaturedFixedRewards } from '@/lib/rewards'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const daily = await accrueAllDailyRewards()
  const fixed = await accrueMaturedFixedRewards()
  return NextResponse.json({ daily, fixed })
}
