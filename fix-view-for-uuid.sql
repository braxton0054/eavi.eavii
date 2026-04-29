-- Fix the view to work with UUID course_ids by joining to courses table
BEGIN;

DROP VIEW IF EXISTS v_units_by_module_semester;

CREATE OR REPLACE VIEW v_units_by_module_semester AS
SELECT
  u.course_id,
  u.unit_code,
  u.name,
  u.module_index,
  CASE
    WHEN c.exam_body = 'KNEC' THEN s.semester_index
    ELSE u.semester_index
  END AS semester_index,
  u.created_at,
  u.updated_at,
  u.unit_type,
  -- generate a stable pseudo-id for KNEC expanded rows so UI keys work
  CASE
    WHEN c.exam_body = 'KNEC' THEN (u.course_id::text || '-' || u.unit_code || '-' || u.module_index || '-' || s.semester_index)
    ELSE (u.course_id::text || '-' || u.unit_code)
  END AS id
FROM units u
JOIN courses c ON u.course_id = c.id
LEFT JOIN LATERAL (
  SELECT generate_series(1, 3) AS semester_index
) s ON c.exam_body = 'KNEC'
WHERE (c.exam_body = 'KNEC' AND u.semester_index = 1)
   OR (c.exam_body != 'KNEC');

COMMIT;
