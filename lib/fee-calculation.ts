import { createClient } from '@/lib/client';

export interface FeeStructure {
  tuition_fee: number;
  practical_fee: number;
  exam_fee: number;
  registration_fee: number;
  library_fee: number;
  lab_fee: number;
}

export interface FeeCalculationResult {
  total_fees: number;
  tuition_fee: number;
  practical_fee: number;
  exam_fee: number;
  registration_fee: number;
  library_fee: number;
  lab_fee: number;
  late_fee: number;
  holiday_class_fee: number;
  discount: number;
  breakdown: {
    [key: string]: number;
  };
}

export interface StudentInfo {
  course_type_id: string;
  exam_body: string;
  current_semester: number;
  current_module: number;
  campus: string;
  stream_type: 'main' | 'bridge';
  bridge_start_date?: string;
  application_date: string;
}

/**
 * Calculate fees for a standard student
 */
export const calculateStandardFees = async (
  student: StudentInfo,
  academicYear: string
): Promise<FeeCalculationResult> => {
  const supabase = createClient();

  const { data: feeStructure } = await supabase
    .from('fee_structure')
    .select('*')
    .eq('course_type_id', student.course_type_id)
    .eq('exam_body', student.exam_body)
    .eq('semester', student.current_semester)
    .eq('module', student.current_module)
    .eq('campus', student.campus)
    .eq('academic_year', academicYear)
    .single();

  if (!feeStructure) {
    return {
      total_fees: 0,
      tuition_fee: 0,
      practical_fee: 0,
      exam_fee: 0,
      registration_fee: 0,
      library_fee: 0,
      lab_fee: 0,
      late_fee: 0,
      holiday_class_fee: 0,
      discount: 0,
      breakdown: {}
    };
  }

  const total = feeStructure.tuition_fee + feeStructure.practical_fee + 
              feeStructure.exam_fee + feeStructure.registration_fee + 
              feeStructure.library_fee + feeStructure.lab_fee;

  return {
    total_fees: total,
    tuition_fee: feeStructure.tuition_fee,
    practical_fee: feeStructure.practical_fee,
    exam_fee: feeStructure.exam_fee,
    registration_fee: feeStructure.registration_fee,
    library_fee: feeStructure.library_fee,
    lab_fee: feeStructure.lab_fee,
    late_fee: 0,
    holiday_class_fee: 0,
    discount: 0,
    breakdown: {
      tuition: feeStructure.tuition_fee,
      practical: feeStructure.practical_fee,
      exam: feeStructure.exam_fee,
      registration: feeStructure.registration_fee,
      library: feeStructure.library_fee,
      lab: feeStructure.lab_fee
    }
  };
};

/**
 * Calculate pro-rated fees for bridge students
 */
export const calculateBridgeFees = async (
  student: StudentInfo,
  academicYear: string
): Promise<FeeCalculationResult> => {
  const supabase = createClient();

  // Get standard fees first
  const standardFees = await calculateStandardFees(student, academicYear);

  if (!student.bridge_start_date) {
    return standardFees;
  }

  // Get academic calendar to determine semester duration
  const { data: calendar } = await supabase
    .from('academic_calendar')
    .select('*')
    .eq('campus', student.campus)
    .order('intake_start_date', { ascending: false })
    .limit(1)
    .single();

  if (!calendar) {
    return standardFees;
  }

  const intakeStartDate = new Date(calendar.intake_start_date);
  const intakeEndDate = new Date(calendar.intake_end_date);
  const bridgeStartDate = new Date(student.bridge_start_date);

  // Calculate total days in semester
  const totalDays = Math.floor((intakeEndDate.getTime() - intakeStartDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate days student will attend
  const daysAttending = Math.floor((intakeEndDate.getTime() - bridgeStartDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate pro-rata ratio
  const proRataRatio = daysAttending / totalDays;

  // Apply pro-rata to tuition and practical fees (not one-time fees)
  const proRatedTuition = Math.round(standardFees.tuition_fee * proRataRatio);
  const proRatedPractical = Math.round(standardFees.practical_fee * proRataRatio);

  // Exam, registration, library, and lab fees are typically not pro-rated
  const total = proRatedTuition + proRatedPractical + 
              standardFees.exam_fee + standardFees.registration_fee + 
              standardFees.library_fee + standardFees.lab_fee;

  return {
    total_fees: total,
    tuition_fee: proRatedTuition,
    practical_fee: proRatedPractical,
    exam_fee: standardFees.exam_fee,
    registration_fee: standardFees.registration_fee,
    library_fee: standardFees.library_fee,
    lab_fee: standardFees.lab_fee,
    late_fee: 0,
    holiday_class_fee: 0,
    discount: 0,
    breakdown: {
      tuition: proRatedTuition,
      practical: proRatedPractical,
      exam: standardFees.exam_fee,
      registration: standardFees.registration_fee,
      library: standardFees.library_fee,
      lab: standardFees.lab_fee,
      pro_rata_ratio: proRataRatio
    }
  };
};

/**
 * Calculate holiday class fees for bridge students
 */
export const calculateHolidayClassFees = async (
  student: StudentInfo,
  academicYear: string
): Promise<number> => {
  const supabase = createClient();

  if (student.stream_type !== 'bridge' || !student.bridge_start_date) {
    return 0;
  }

  // Get bridge group info
  const { data: bridgeGroup } = await supabase
    .from('bridge_groups')
    .select('*')
    .eq('campus', student.campus)
    .eq('status', 'active')
    .single();

  if (!bridgeGroup || !bridgeGroup.holiday_bypass_enabled) {
    return 0;
  }

  // Get holiday periods
  const { data: holidays } = await supabase
    .from('holiday_periods')
    .select('*')
    .eq('academic_calendar_id', bridgeGroup.academic_calendar_id)
    .eq('campus', student.campus)
    .eq('is_instructional_for_bridge', true);

  if (!holidays || holidays.length === 0) {
    return 0;
  }

  // Calculate total holiday hours
  let totalHours = 0;
  for (const holiday of holidays) {
    const start = new Date(holiday.start_date);
    const end = new Date(holiday.end_date);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    totalHours += days * 8; // 8 hours per day
  }

  // Calculate fee based on hours (e.g., KES 500 per hour)
  const hourlyRate = 500;
  return totalHours * hourlyRate;
};

/**
 * Calculate late fees for overdue payments
 */
export const calculateLateFees = async (
  applicationId: string,
  dueDate: string
): Promise<number> => {
  const supabase = createClient();

  const currentDate = new Date();
  const due = new Date(dueDate);

  if (currentDate <= due) {
    return 0;
  }

  // Calculate days overdue
  const daysOverdue = Math.floor((currentDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  // Late fee: 5% of original amount per week overdue, max 25%
  const weeksOverdue = Math.ceil(daysOverdue / 7);
  const lateFeePercentage = Math.min(weeksOverdue * 0.05, 0.25);

  // Get the installment amount
  const { data: installment } = await supabase
    .from('payment_installments')
    .select('amount')
    .eq('application_id', applicationId)
    .eq('due_date', dueDate)
    .single();

  if (!installment) {
    return 0;
  }

  return Math.round(installment.amount * lateFeePercentage);
};

/**
 * Main fee calculation function
 */
export const calculateFees = async (
  student: StudentInfo,
  academicYear: string
): Promise<FeeCalculationResult> => {
  let result: FeeCalculationResult;

  if (student.stream_type === 'bridge') {
    result = await calculateBridgeFees(student, academicYear);
    
    // Add holiday class fees if applicable
    const holidayFees = await calculateHolidayClassFees(student, academicYear);
    result.holiday_class_fee = holidayFees;
    result.total_fees += holidayFees;
  } else {
    result = await calculateStandardFees(student, academicYear);
  }

  return result;
};

/**
 * Create installment plan for a student
 */
export const createInstallmentPlan = async (
  applicationId: string,
  totalAmount: number,
  numberOfInstallments: number,
  startDate: string
): Promise<{ success: boolean; message: string }> => {
  const supabase = createClient();

  const installmentAmount = Math.round(totalAmount / numberOfInstallments);
  const start = new Date(startDate);

  const installments = [];
  for (let i = 0; i < numberOfInstallments; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      application_id: applicationId,
      installment_number: i + 1,
      due_date: dueDate.toISOString().split('T')[0],
      amount: i === numberOfInstallments - 1 ? totalAmount - (installmentAmount * (numberOfInstallments - 1)) : installmentAmount,
      status: 'pending'
    });
  }

  const { error } = await supabase
    .from('payment_installments')
    .insert(installments);

  if (error) {
    return { success: false, message: 'Error creating installment plan' };
  }

  return { success: true, message: `Created ${numberOfInstallments} installment plan` };
};

/**
 * Check for overdue installments and apply late fees
 */
export const checkOverdueInstallments = async (): Promise<{ updated: number }> => {
  const supabase = createClient();

  const currentDate = new Date().toISOString().split('T')[0];

  // Get all pending installments that are overdue
  const { data: overdueInstallments } = await supabase
    .from('payment_installments')
    .select('*')
    .eq('status', 'pending')
    .lt('due_date', currentDate);

  if (!overdueInstallments || overdueInstallments.length === 0) {
    return { updated: 0 };
  }

  let updatedCount = 0;
  for (const installment of overdueInstallments) {
    const lateFee = await calculateLateFees(installment.application_id, installment.due_date);
    
    if (lateFee > 0) {
      const { error } = await supabase
        .from('payment_installments')
        .update({
          status: 'overdue',
          late_fee: lateFee
        })
        .eq('id', installment.id);

      if (!error) {
        updatedCount++;
      }
    }
  }

  return { updated: updatedCount };
};

/**
 * Calculate student's total balance (invoiced fees - total payments)
 */
export const calculateStudentBalance = async (applicationId: string): Promise<{
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  financialHold: boolean;
}> => {
  const supabase = createClient();

  // Get student's current fees
  const { data: student } = await supabase
    .from('applications')
    .select('course_type_id, exam_body, current_semester, current_module, campus, stream_type, bridge_start_date, application_date')
    .eq('id', applicationId)
    .single();

  if (!student) {
    return { totalInvoiced: 0, totalPaid: 0, balance: 0, financialHold: false };
  }

  // Calculate total fees for current semester
  const academicYear = new Date().getFullYear().toString();
  const feeResult = await calculateFees(student, academicYear);
  const totalInvoiced = feeResult.total_fees;

  // Get total payments
  const { data: payments } = await supabase
    .from('fee_payments')
    .select('amount')
    .eq('application_id', applicationId)
    .eq('status', 'completed');

  const totalPaid = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const balance = totalInvoiced - totalPaid;
  const financialHold = balance > 0;

  // Update student's financial hold status
  await supabase
    .from('applications')
    .update({
      total_balance: balance,
      financial_hold: financialHold,
      transcript_unlocked: !financialHold
    })
    .eq('id', applicationId);

  return {
    totalInvoiced,
    totalPaid,
    balance,
    financialHold
  };
};

/**
 * Update financial hold status after payment
 */
export const updateFinancialHoldAfterPayment = async (applicationId: string): Promise<void> => {
  const supabase = createClient();

  const balanceResult = await calculateStudentBalance(applicationId);

  // If balance is now zero or negative, unlock transcript
  if (balanceResult.balance <= 0) {
    await supabase
      .from('applications')
      .update({
        financial_hold: false,
        transcript_unlocked: true,
        last_payment_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', applicationId);
  }
};

/**
 * Check if student has financial hold (transcript locked)
 */
export const checkFinancialHold = async (applicationId: string): Promise<{
  hasHold: boolean;
  balance: number;
}> => {
  const supabase = createClient();

  const { data: student } = await supabase
    .from('applications')
    .select('financial_hold, total_balance')
    .eq('id', applicationId)
    .single();

  if (!student) {
    return { hasHold: false, balance: 0 };
  }

  // Recalculate balance to ensure it's current
  const balanceResult = await calculateStudentBalance(applicationId);

  return {
    hasHold: balanceResult.financialHold,
    balance: balanceResult.balance
  };
};
