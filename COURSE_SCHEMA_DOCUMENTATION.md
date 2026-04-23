# Course Schema Documentation

## Updated Course Structure (November 2024)

### Database Changes
- **Course ID**: Changed from UUID to TEXT format for readability
- **ID Format**: `CRS{6-digit-timestamp}{3-digit-random}` (e.g., `CRS123456789`)
- **Primary Key**: Text-based course identifier

### New JSONB Structure for `course_types`

The `course_types` field in the courses table now uses a unified JSONB structure to support all course levels and study modes.

```typescript
course_types: {
  diploma?: {
    periods: Array<{
      durationMonths: number;
      fee: number;
      internalExams: number;
      units: string[];  // Unit names
    }>;
    studyMode: "semester" | "module";
  };
  certificate?: {
    periods: Array<{
      durationMonths: number;
      fee: number;
      internalExams: number;
      units: string[];
    }>;
    studyMode: "semester" | "module";
  };
  artisan?: {
    periods: Array<{
      durationMonths: number;
      fee: number;
      internalExams: number;
      units: string[];
    }>;
    studyMode: "semester" | "module";
  };
  shortCourse?: {
    durationMonths: number;
    units: string[];  // Unit names
    shortCourseUnits: string[];  // Short course specific units
    shortCourseFee: number;
    studyMode: "short-course";
  };
}
```

### Example Course JSON

```json
{
  "diploma": {
    "periods": [
      {
        "durationMonths": 4,
        "fee": 50000,
        "internalExams": 2,
        "units": ["Unit 101", "Unit 102", "Unit 103"]
      },
      {
        "durationMonths": 4,
        "fee": 50000,
        "internalExams": 2,
        "units": ["Unit 201", "Unit 202", "Unit 203"]
      }
    ],
    "studyMode": "semester"
  },
  "certificate": {
    "periods": [
      {
        "durationMonths": 3,
        "fee": 35000,
        "internalExams": 1,
        "units": ["Unit 101", "Unit 102"]
      }
    ],
    "studyMode": "module"
  }
}
```

### Migration Path

For existing courses in the database:

1. **Backup existing data** before migration
2. **Map old structure to new structure**:
   - Old `feeStructureType` → Map to course type (diploma/certificate/artisan)
   - Old `semesterData`/`moduleData` → Convert to `periods` array
   - Old nested modules → Flatten into periods array

3. **Data Consistency Checks**:
   - All TEXT course IDs must be unique
   - Each period must have required fields (durationMonths, fee, units, internalExams)
   - studyMode must be one of: "semester", "module", "short-course"

### Backward Compatibility

⚠️ **Breaking Change**: The course ID is now TEXT (not UUID). Applications that reference course IDs must use the new TEXT format.

- Old queries using `id::uuid` will fail
- Use `id::text` or just `id` for comparisons
- Foreign key constraints updated for TEXT compatibility

### Database Indexes

Performance indexes added for:
- `idx_courses_department` - Department filtering
- `idx_courses_name` - Course name search
- `idx_courses_id` - Primary key lookups (implicit)

### Related Tables

The following tables reference courses:
- **applications**: `course` field (TEXT - course name, not ID)
- **lecturer_assignments**: `course` field (TEXT - course name, not ID)
- **exam_marks**: `course` field (TEXT - course name, not ID)

Note: These still use course name (TEXT) rather than course ID to maintain compatibility with existing data entry systems.

### Query Examples

#### Find courses by department
```sql
SELECT id, name FROM courses WHERE department = 'Engineering';
```

#### Find courses with diploma program
```sql
SELECT id, name FROM courses WHERE course_types->>'diploma' IS NOT NULL;
```

#### Get all periods for a diploma course
```sql
SELECT jsonb_array_elements(course_types->'diploma'->'periods') as period
FROM courses WHERE id = 'CRS123456789';
```

#### Find semester mode courses
```sql
SELECT id, name FROM courses 
WHERE course_types->'diploma'->>'studyMode' = 'semester'
   OR course_types->'certificate'->>'studyMode' = 'semester';
```

### Next Steps

1. Execute migration SQL script on Supabase
2. Update sample data in `insert-sample-courses.sql`
3. Test course creation through admin interface
4. Verify course ID generation in `app/admin/courses/page.tsx`
