// Maps to public.fee_payments table
export type FeePayment = {
  id?:             string
  application_id:  string
  semester_id:     string | null
  module_id:       string | null
  payment_type:    'tuition' | 'practical' | 'exam' | 'extra'
  amount:          number
  payment_method:  'mpesa' | 'bank' | 'cash' | 'card'
  transaction_id:  string | null
  payment_date:    string
  status:          'completed' | 'pending' | 'failed'
  receipt_number:  string | null
  notes:           string | null
  created_at?:     string
  updated_at?:     string
}

export type SemesterOption = {
  id:             string
  module_id:      string
  semester_index: number
  module_index:   number
  module_label:   string
  fee:            number
  practical_fee:  number
  paid:           number
}

export type StudentProfile = {
  id:               string
  admission_number: string
  full_name:        string
  course_name:      string
  course_level:     string
  campus:           string
  intake:           string
  current_module:   number
  current_semester: number
  total_balance:    number
  financial_hold:   boolean
}

export type PaymentHistoryItem = {
  receipt_number:  string
  payment_date:    string
  amount:          number
  payment_method:  string
  transaction_id:  string
  payment_type:    string
}
