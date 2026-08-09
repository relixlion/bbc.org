import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=100', {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    next: { revalidate: 3600 },
  })
  const data = await res.json()
  return NextResponse.json(data.data ?? [])
}
