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

  // New structure
  if (typeof raw.studyMode === 'string') {
    const studyMode = raw.studyMode === 'module' ? 'module' : raw.studyMode === 'short-course' ? 'short-course' : 'semester'
    const periods = normalizePeriods(raw.periods)
    const shortCourseUnits = normalizeUnits(raw.shortCourseUnits ?? raw.units)
    const durationMonths = toNumber(raw.durationMonths ?? raw.duration)

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
