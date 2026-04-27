BEGIN;

UPDATE units
SET semester_index = 1
WHERE course_id LIKE 'KNEC-%';

CREATE OR REPLACE VIEW v_units_by_module_semester AS
SELECT
  u.course_id,
  u.unit_code,
  u.name,
  u.module_index,
  CASE
    WHEN u.course_id LIKE 'KNEC-%' THEN s.semester_index
    ELSE u.semester_index
  END AS semester_index,
  u.created_at,
  u.updated_at,
  -- generate a stable pseudo-id for KNEC expanded rows so UI keys work
  CASE
    WHEN u.course_id LIKE 'KNEC-%' THEN (u.course_id || '-' || u.unit_code || '-' || u.module_index || '-' || s.semester_index)
    ELSE (u.course_id || '-' || u.unit_code)
  END AS id
FROM units u
LEFT JOIN LATERAL (
  SELECT generate_series(1, 3) AS semester_index
) s ON u.course_id LIKE 'KNEC-%'
WHERE (u.course_id LIKE 'KNEC-%' AND u.semester_index = 1)
   OR (u.course_id NOT LIKE 'KNEC-%');

CREATE OR REPLACE FUNCTION knec_units_force_semester_one()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.course_id LIKE 'KNEC-%' THEN
    NEW.semester_index = 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_units_knec_force_semester_one ON units;

CREATE TRIGGER trg_units_knec_force_semester_one
BEFORE INSERT OR UPDATE ON units
FOR EACH ROW
EXECUTE FUNCTION knec_units_force_semester_one();

COMMIT;
