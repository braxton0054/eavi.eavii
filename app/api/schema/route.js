import { getSupabaseSchema } from '@/lib/supabase-schema'
import { NextResponse } from 'next/server'

export async function GET() {
  const schema = await getSupabaseSchema()
  return NextResponse.json(schema)
}
