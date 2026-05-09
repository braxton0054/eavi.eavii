'use server'
import { createClient as createSupabaseClient } from '@/lib/server'
import { FeePayment, StudentProfile, SemesterOption, PaymentHistoryItem } from './types'

export async function getStudentProfile(admissionNumber: string): Promise<StudentProfile | null> {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
    .from('applications')
    .select('id, full_name, phone, email, course_id, admission_number, campus, current_module, current_semester, total_balance, status, enrollment_type')
    .eq('admission_number', admissionNumber)
    .single()

  if (error) return null
  return {
    ...data,
    course_name: data.course_id, // Will be resolved client-side
  } as unknown as StudentProfile
}

export async function getSemestersForStudent(applicationId: string): Promise<SemesterOption[]> {
  const supabase = await createSupabaseClient()
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('course_type_id')
    .eq('id', applicationId)
    .single()

  if (appErr || !app) return []

  const courseTypeId = (app as any).course_type_id

  const { data: sems } = await supabase
    .from('semesters')
    .select('id,module_id,semester_index,fee,practical_fee,modules(module_index,label)')
    .eq('modules.course_type_id', courseTypeId)

  if (!sems) return []

  const results: SemesterOption[] = []
  for (const s of sems as any[]) {
    const { data: payments } = await supabase
      .from('fee_payments')
      .select('amount,status')
      .eq('application_id', applicationId)
      .eq('semester_id', s.id)

    let paid = 0
    if (payments) {
      for (const p of payments) {
        if (p.status === 'completed' && typeof p.amount === 'number') paid += p.amount
      }
    }

    results.push({
      id: s.id,
      module_id: s.module_id,
      semester_index: s.semester_index,
      module_index: s.modules?.module_index ?? 0,
      module_label: s.modules?.label ?? 'Module',
      fee: Number(s.fee ?? 0),
      practical_fee: Number(s.practical_fee ?? 0),
      paid,
    })
  }

  results.sort((a,b) => a.module_index - b.module_index || a.semester_index - b.semester_index)
  return results
}

export async function getRecentPayments(admissionNumber: string): Promise<PaymentHistoryItem[]> {
  const supabase = await createSupabaseClient()
  // First get the application_id from admission number
  const { data: app } = await supabase
    .from('applications')
    .select('id')
    .eq('admission_number', admissionNumber)
    .single()

  if (!app) return []

  const { data } = await supabase
    .from('fee_payments')
    .select('id, amount, payment_method, transaction_id, payment_date, status, receipt_number')
    .eq('application_id', (app as any).id)
    .order('payment_date', { ascending: false })
    .limit(5)

  return ((data as any[]) ?? []).map(p => ({
    ...p,
    admission_number: admissionNumber,
  }))
}

export async function recordPayment(payment: Omit<FeePayment, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
    .from('fee_payments')
    .insert([payment])

  if (error) return { success: false, error: error.message }
  return { success: true }
}
