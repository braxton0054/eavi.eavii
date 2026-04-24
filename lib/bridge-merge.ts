import { createClient } from '@/lib/client';

export interface BridgeMergeResult {
  success: boolean;
  message: string;
  mergedCount: number;
  failedCount: number;
}

export interface HolidayPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_instructional_for_bridge: boolean;
}

/**
 * Calculate catch-up hours needed based on holiday periods
 */
export const calculateCatchUpHours = async (
  bridgeGroupId: string
): Promise<number> => {
  const supabase = createClient();
  
  try {
    // Get bridge group details
    const { data: bridgeGroup } = await supabase
      .from('bridge_groups')
      .select('*')
      .eq('id', bridgeGroupId)
      .single();

    if (!bridgeGroup) return 0;

    // Get holiday periods for the academic calendar
    const { data: holidays } = await supabase
      .from('holiday_periods')
      .select('*')
      .eq('academic_calendar_id', bridgeGroup.academic_calendar_id)
      .eq('campus', bridgeGroup.campus);

    if (!holidays || holidays.length === 0) return 0;

    // Calculate total holiday hours available for catch-up
    let totalHours = 0;
    const bridgeStartDate = new Date(bridgeGroup.start_date);
    const syncTargetDate = new Date(bridgeGroup.sync_target_date);

    for (const holiday of holidays) {
      const holidayStart = new Date(holiday.start_date);
      const holidayEnd = new Date(holiday.end_date);

      // Only count holidays within the bridge period
      if (holidayStart >= bridgeStartDate && holidayEnd <= syncTargetDate) {
        const days = Math.floor((holidayEnd.getTime() - holidayStart.getTime()) / (1000 * 60 * 60 * 24));
        // Assume 8 instructional hours per day
        totalHours += days * 8;
      }
    }

    return totalHours;
  } catch (error) {
    console.error('Error calculating catch-up hours:', error);
    return 0;
  }
};

/**
 * Apply holiday bypass for bridge students
 * Marks holidays as instructional days for bridge groups
 */
export const applyHolidayBypass = async (
  bridgeGroupId: string
): Promise<{ success: boolean; message: string }> => {
  const supabase = createClient();
  
  try {
    // Get bridge group details
    const { data: bridgeGroup } = await supabase
      .from('bridge_groups')
      .select('*')
      .eq('id', bridgeGroupId)
      .single();

    if (!bridgeGroup) {
      return { success: false, message: 'Bridge group not found' };
    }

    if (!bridgeGroup.holiday_bypass_enabled) {
      return { success: false, message: 'Holiday bypass is disabled for this group' };
    }

    // Get holiday periods
    const { data: holidays } = await supabase
      .from('holiday_periods')
      .select('*')
      .eq('academic_calendar_id', bridgeGroup.academic_calendar_id)
      .eq('campus', bridgeGroup.campus);

    if (!holidays || holidays.length === 0) {
      return { success: false, message: 'No holiday periods found' };
    }

    // Mark holidays as instructional for bridge
    const bridgeStartDate = new Date(bridgeGroup.start_date);
    const syncTargetDate = new Date(bridgeGroup.sync_target_date);

    let updatedCount = 0;
    for (const holiday of holidays) {
      const holidayStart = new Date(holiday.start_date);
      const holidayEnd = new Date(holiday.end_date);

      // Only mark holidays within the bridge period
      if (holidayStart >= bridgeStartDate && holidayEnd <= syncTargetDate) {
        const { error } = await supabase
          .from('holiday_periods')
          .update({ is_instructional_for_bridge: true })
          .eq('id', holiday.id);

        if (!error) updatedCount++;
      }
    }

    // Calculate and update catch-up hours needed
    const catchUpHours = await calculateCatchUpHours(bridgeGroupId);
    await supabase
      .from('bridge_groups')
      .update({ catch_up_hours_needed: catchUpHours })
      .eq('id', bridgeGroupId);

    return {
      success: true,
      message: `Holiday bypass applied. ${updatedCount} holidays marked as instructional. ${catchUpHours} catch-up hours available.`
    };
  } catch (error) {
    console.error('Error applying holiday bypass:', error);
    return { success: false, message: 'Error applying holiday bypass' };
  }
};

/**
 * Schedule bridge exams asynchronously
 */
export const scheduleBridgeExams = async (
  bridgeGroupId: string,
  mainGroupExams: any[]
): Promise<{ success: boolean; message: string }> => {
  const supabase = createClient();
  
  try {
    // Get bridge group details
    const { data: bridgeGroup } = await supabase
      .from('bridge_groups')
      .select('*')
      .eq('id', bridgeGroupId)
      .single();

    if (!bridgeGroup) {
      return { success: false, message: 'Bridge group not found' };
    }

    const bridgeStartDate = new Date(bridgeGroup.start_date);
    const scheduledCount = [];

    // For each main group exam, schedule a delayed version for bridge group
    for (const exam of mainGroupExams) {
      const mainExamDate = new Date(exam.scheduled_date);
      const daysDiff = Math.floor((mainExamDate.getTime() - bridgeStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Schedule bridge exam after they complete the compressed module
      // Add lag based on acceleration factor
      const lagDays = Math.ceil(daysDiff / bridgeGroup.acceleration_factor);
      const bridgeExamDate = new Date(bridgeStartDate.getTime() + (lagDays * 24 * 60 * 60 * 1000));

      const { data: newExam } = await supabase
        .from('bridge_exam_schedules')
        .insert([{
          bridge_group_id: bridgeGroupId,
          exam_name: exam.name,
          exam_type: exam.type,
          scheduled_date: bridgeExamDate.toISOString().split('T')[0],
          main_group_exam_date: exam.scheduled_date,
          units: exam.units || [],
          status: 'scheduled'
        }])
        .select()
        .single();

      if (newExam) scheduledCount.push(newExam);
    }

    return {
      success: true,
      message: `Scheduled ${scheduledCount.length} bridge exams.`
    };
  } catch (error) {
    console.error('Error scheduling bridge exams:', error);
    return { success: false, message: 'Error scheduling bridge exams' };
  }
};

/**
 * Check if bridge students are ready to merge with main intake
 * and execute the merge if they meet the milestone criteria
 */
export const checkAndMergeBridgeStudents = async (
  bridgeGroupId: string
): Promise<BridgeMergeResult> => {
  const supabase = createClient();
  
  try {
    // Get bridge group details
    const { data: bridgeGroup, error: bridgeError } = await supabase
      .from('bridge_groups')
      .select('*')
      .eq('id', bridgeGroupId)
      .single();

    if (bridgeError || !bridgeGroup) {
      return {
        success: false,
        message: 'Bridge group not found',
        mergedCount: 0,
        failedCount: 0
      };
    }

    // Check if sync target date has been reached
    const currentDate = new Date();
    const syncTargetDate = new Date(bridgeGroup.sync_target_date);
    
    if (currentDate < syncTargetDate) {
      return {
        success: false,
        message: 'Sync target date not yet reached',
        mergedCount: 0,
        failedCount: 0
      };
    }

    // Get all students in this bridge group
    const { data: bridgeStudents, error: studentsError } = await supabase
      .from('applications')
      .select('*')
      .eq('bridge_group_id', bridgeGroupId)
      .eq('stream_type', 'bridge');

    if (studentsError || !bridgeStudents) {
      return {
        success: false,
        message: 'No bridge students found',
        mergedCount: 0,
        failedCount: 0
      };
    }

    // Check if students have completed the milestone (passed assessments)
    // For now, we'll check if they've reached the milestone semester/module
    const readyToMerge = bridgeStudents.filter((student: any) => {
      return (
        student.current_module >= bridgeGroup.milestone_module &&
        student.current_semester >= bridgeGroup.milestone_semester
      );
    });

    if (readyToMerge.length === 0) {
      return {
        success: false,
        message: 'No students have reached the milestone yet',
        mergedCount: 0,
        failedCount: 0
      };
    }

    // Execute merge for ready students
    let mergedCount = 0;
    let failedCount = 0;

    for (const student of readyToMerge) {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          stream_type: 'main',
          bridge_group_id: null,
          bridge_start_date: null,
          sync_target_date: null,
          acceleration_factor: 1.0
        })
        .eq('id', student.id);

      if (updateError) {
        failedCount++;
        console.error(`Failed to merge student ${student.id}:`, updateError);
      } else {
        mergedCount++;
      }
    }

    // If all students merged, mark bridge group as merged
    if (mergedCount === bridgeStudents.length) {
      await supabase
        .from('bridge_groups')
        .update({
          status: 'merged',
          merged_date: currentDate.toISOString().split('T')[0]
        })
        .eq('id', bridgeGroupId);
    }

    return {
      success: true,
      message: `Successfully merged ${mergedCount} students. ${failedCount} failed.`,
      mergedCount,
      failedCount
    };
  } catch (error) {
    console.error('Error in bridge merge:', error);
    return {
      success: false,
      message: 'Error during merge process',
      mergedCount: 0,
      failedCount: 0
    };
  }
};

/**
 * Get time remaining until sync for a bridge student
 */
export const getTimeToSync = (syncTargetDate: string): {
  days: number;
  hours: number;
  isOverdue: boolean;
} => {
  const now = new Date();
  const target = new Date(syncTargetDate);
  const diff = target.getTime() - now.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return {
    days,
    hours,
    isOverdue: diff < 0
  };
};

/**
 * Get all active bridge groups for a campus
 */
export const getActiveBridgeGroups = async (campus: string) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('bridge_groups')
    .select(`
      *,
      applications (
        id,
        full_name,
        admission_number,
        current_module,
        current_semester
      )
    `)
    .eq('campus', campus)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching bridge groups:', error);
    return [];
  }

  return data || [];
};

/**
 * Get holiday periods for a campus
 */
export const getHolidayPeriods = async (campus: string, academicCalendarId?: string) => {
  const supabase = createClient();
  
  let query = supabase
    .from('holiday_periods')
    .select('*')
    .eq('campus', campus);

  if (academicCalendarId) {
    query = query.eq('academic_calendar_id', academicCalendarId);
  }

  const { data, error } = await query.order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching holiday periods:', error);
    return [];
  }

  return data || [];
};
