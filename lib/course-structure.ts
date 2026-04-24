export const COURSE_LEVELS = ['diploma', 'certificate', 'artisan', 'level6', 'level5', 'level4'] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]
export type StudyMode = 'semester' | 'module' | 'short-course'

export interface NormalizedPeriod {
  durationMonths: number
  fee: number
  internalExams: number
  units: string[]
}

export interface NormalizedCourseType {
  enabled: boolean
  minKcseGrade: string
  studyMode: StudyMode
  durationMonths: number
  periods: NormalizedPeriod[]
  shortCourseFee: number
  shortCourseHasExams: boolean
  shortCourseUnits: string[]
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeUnits = (units: unknown) => {
  if (!Array.isArray(units)) return []

  const normalized = units
    .map((unit) => {
      if (typeof unit === 'string') return unit.trim()
      if (unit && typeof unit === 'object' && 'name' in unit) {
        return String((unit as { name?: unknown }).name ?? '').trim()
      }
      return ''
    })
    .filter((unit) => unit.length > 0)

  return [...new Set(normalized)]
}

const normalizePeriods = (periods: unknown) => {
  if (!Array.isArray(periods)) return []

  return periods.map((period) => {
    const safePeriod = period && typeof period === 'object' ? period as Record<string, unknown> : {}
    return {
      durationMonths: toNumber(safePeriod.durationMonths ?? safePeriod.duration),
      fee: toNumber(safePeriod.fee),
      internalExams: toNumber(safePeriod.internalExams ?? safePeriod.internalExamCount),
      units: normalizeUnits(safePeriod.units)
    }
  })
}

export const normalizeCourseType = (rawType: unknown): NormalizedCourseType | null => {
  if (!rawType || typeof rawType !== 'object') return null

  const raw = rawType as Record<string, unknown>
  const enabled = Boolean(raw.enabled)
  const minKcseGrade = String(raw.minKcseGrade ?? raw.min_kcse_grade ?? '').trim()

  // New structure with modules and semesters
  if (typeof raw.studyMode === 'string') {
    const studyMode = raw.studyMode === 'module' ? 'module' : raw.studyMode === 'short-course' ? 'short-course' : 'semester'
    const shortCourseUnits = normalizeUnits(raw.shortCourseUnits ?? raw.units)
    const durationMonths = toNumber(raw.durationMonths ?? raw.duration)

    // Handle modules with semesters structure
    if (Array.isArray(raw.modules) && raw.modules.length > 0) {
      const periods = raw.modules.flatMap((module: any) => {
        if (!module || typeof module !== 'object') return []
        const semesters = module.semesters || []
        return semesters.map((semester: any) => {
          const safeSemester = semester && typeof semester === 'object' ? semester as Record<string, unknown> : {}
          // Extract units from semester.units (from database)
          const semesterUnits = normalizeUnits(safeSemester.units)
          return {
            durationMonths: toNumber(safeSemester.duration_months ?? safeSemester.durationMonths),
            fee: toNumber(safeSemester.fee),
            internalExams: toNumber(safeSemester.internal_exams ?? safeSemester.internalExams),
            units: semesterUnits
          }
        })
      })

      return {
        enabled,
        minKcseGrade,
        studyMode,
        durationMonths,
        periods,
        shortCourseFee: toNumber(raw.shortCourseFee),
        shortCourseHasExams: Boolean(raw.shortCourseHasExams ?? true),
        shortCourseUnits
      }
    }

    // Fallback to direct periods
    const periods = normalizePeriods(raw.periods)

    return {
      enabled,
      minKcseGrade,
      studyMode,
      durationMonths,
      periods,
      shortCourseFee: toNumber(raw.shortCourseFee),
      shortCourseHasExams: Boolean(raw.shortCourseHasExams ?? true),
      shortCourseUnits
    }
  }

  // Legacy structure fallback
  const feeStructureType = String(raw.feeStructureType ?? 'semester')

  if (feeStructureType === 'short-course') {
    return {
      enabled,
      minKcseGrade,
      studyMode: 'short-course',
      durationMonths: toNumber(raw.duration),
      periods: [],
      shortCourseFee: toNumber(raw.shortCourseFee),
      shortCourseHasExams: true,
      shortCourseUnits: normalizeUnits(raw.units)
    }
  }

  if (feeStructureType === 'monthly') {
    const months = toNumber(raw.months)
    const monthlyFee = toNumber(raw.monthlyFee)
    return {
      enabled,
      minKcseGrade,
      studyMode: 'module',
      durationMonths: toNumber(raw.duration),
      periods: Array.from({ length: months }, () => ({
        durationMonths: 1,
        fee: monthlyFee,
        internalExams: 1,
        units: []
      })),
      shortCourseFee: 0,
      shortCourseHasExams: true,
      shortCourseUnits: []
    }
  }

  const semesterData = normalizePeriods(raw.semesterData)
  if (semesterData.length > 0) {
    return {
      enabled,
      minKcseGrade,
      studyMode: 'semester',
      durationMonths: toNumber(raw.duration),
      periods: semesterData,
      shortCourseFee: 0,
      shortCourseHasExams: true,
      shortCourseUnits: []
    }
  }

  if (Array.isArray(raw.moduleData)) {
    const rawModuleData = raw.moduleData as unknown[]
    const hasNestedSemesters = rawModuleData.some((module) => module && typeof module === 'object' && Array.isArray((module as { semesters?: unknown[] }).semesters))

    if (hasNestedSemesters) {
      const flattened = rawModuleData.flatMap((module) => {
        if (!module || typeof module !== 'object' || !Array.isArray((module as { semesters?: unknown[] }).semesters)) return []
        return normalizePeriods((module as { semesters?: unknown[] }).semesters)
      })

      return {
        enabled,
        minKcseGrade,
        studyMode: 'semester',
        durationMonths: toNumber(raw.duration),
        periods: flattened,
        shortCourseFee: 0,
        shortCourseHasExams: true,
        shortCourseUnits: []
      }
    }

    return {
      enabled,
      minKcseGrade,
      studyMode: 'module',
      durationMonths: toNumber(raw.duration),
      periods: normalizePeriods(raw.moduleData),
      shortCourseFee: 0,
      shortCourseHasExams: true,
      shortCourseUnits: []
    }
  }

  return {
    enabled,
    minKcseGrade,
    studyMode: 'semester',
    durationMonths: toNumber(raw.duration),
    periods: [],
    shortCourseFee: 0,
    shortCourseHasExams: true,
    shortCourseUnits: []
  }
}

export const getCourseTypeConfig = (courseTypes: unknown, level: string) => {
  if (!courseTypes) return null

  let rawType: unknown = null

  // Support object map: { diploma: {...}, certificate: {...} }
  if (!Array.isArray(courseTypes) && typeof courseTypes === 'object') {
    rawType = (courseTypes as Record<string, unknown>)[level]
  }

  // Support array form: [{ level: 'Diploma', ... }, { level: 'Certificate', ... }]
  if (Array.isArray(courseTypes)) {
    rawType = (courseTypes as unknown[]).find((ct) => {
      if (!ct || typeof ct !== 'object') return false
      const obj = ct as Record<string, unknown>
      const lvl = String(obj.level ?? obj.name ?? '').toLowerCase()
      return lvl === String(level).toLowerCase()
    })
  }

  if (!rawType) return null

  const normalized = normalizeCourseType(rawType)
  if (!normalized || !normalized.enabled) return null
  return normalized
}

export const getPeriodLabel = (studyMode: StudyMode) => {
  if (studyMode === 'module') return 'Module'
  if (studyMode === 'short-course') return 'Course'
  return 'Semester'
}

export const getUnitsForPeriod = (courseType: NormalizedCourseType, periodNumber: number) => {
  if (courseType.studyMode === 'short-course') {
    return courseType.shortCourseUnits
  }

  const period = courseType.periods[Math.max(periodNumber - 1, 0)]
  return period?.units ?? []
}

export const getAllUnits = (courseType: NormalizedCourseType) => {
  if (courseType.studyMode === 'short-course') {
    return courseType.shortCourseUnits
  }

  return [...new Set(courseType.periods.flatMap((period) => period.units))]
}

// Calculate accelerated curriculum for bridge students
export const getAcceleratedCurriculum = (
  courseType: NormalizedCourseType,
  accelerationFactor: number,
  currentPeriod: number
): {
  periods: NormalizedPeriod[]
  catchUpUnits: string[]
  syncPeriod: number
} => {
  if (courseType.studyMode === 'short-course') {
    return {
      periods: courseType.periods,
      catchUpUnits: courseType.shortCourseUnits,
      syncPeriod: 1
    }
  }

  const periods = courseType.periods
  const currentPeriodIndex = Math.max(currentPeriod - 1, 0)
  
  // Calculate how many periods the main group has completed
  const mainGroupProgress = currentPeriodIndex
  
  // Bridge students need to complete the same content in less time
  // Divide the content into "catch-up" and "normal" phases
  
  const catchUpPeriods = Math.ceil(mainGroupProgress / accelerationFactor)
  const syncPeriod = catchUpPeriods + 1
  
  // Combine units from the periods that need to be covered
  const catchUpUnits = periods
    .slice(0, catchUpPeriods)
    .flatMap((period) => period.units)
  
  // Return accelerated periods with compressed units
  const acceleratedPeriods = periods.map((period, index) => {
    if (index < catchUpPeriods) {
      // Catch-up phase: compress multiple periods into fewer
      const unitsPerPeriod = Math.ceil(catchUpUnits.length / catchUpPeriods)
      const startIdx = index * unitsPerPeriod
      const endIdx = Math.min(startIdx + unitsPerPeriod, catchUpUnits.length)
      
      return {
        ...period,
        units: catchUpUnits.slice(startIdx, endIdx),
        durationMonths: Math.ceil(period.durationMonths / accelerationFactor)
      }
    }
    
    // Normal phase: same as main group
    return period
  })
  
  return {
    periods: acceleratedPeriods,
    catchUpUnits: [...new Set(catchUpUnits)],
    syncPeriod
  }
}
