-- Fix: match classes by course + campus + intake + module + semester
-- This ensures each intake gets its own class
CREATE OR REPLACE FUNCTION create_student_profile_on_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  v_class_id uuid;
  v_intake_month text;
  v_intake_label text;
BEGIN
  IF NEW.status = 'enrolled' AND (OLD.status IS DISTINCT FROM 'enrolled') THEN
    INSERT INTO public.student_profiles (application_id)
    VALUES (NEW.id)
    ON CONFLICT (application_id) DO NOTHING;

    v_intake_label := COALESCE(NEW.intake, '');
    v_intake_month := COALESCE(
      NEW.intake_month,
      TO_CHAR(NEW.application_date::date, 'FMMonth'),
      TO_CHAR(NOW(), 'FMMonth')
    );

    SELECT c.id INTO v_class_id
    FROM public.classes c
    WHERE c.course_id = NEW.course_id
      AND c.campus = NEW.campus
      AND COALESCE(c.intake, '') = v_intake_label
      AND c.module_index = NEW.current_module
      AND c.semester = NEW.current_semester
      AND c.is_active = true
    LIMIT 1;

    IF v_class_id IS NULL THEN
      INSERT INTO public.classes (class_name, course_id, campus, semester, module_index, intake, intake_month, stream_type, is_active)
      VALUES (
        public.generate_class_name(NEW.course_id, NEW.campus, NEW.current_module, NEW.current_semester, v_intake_month, EXTRACT(YEAR FROM COALESCE(NEW.application_date, NOW()))::integer),
        NEW.course_id, NEW.campus, NEW.current_semester, NEW.current_module,
        NEW.intake, v_intake_month, 'main', true
      )
      RETURNING id INTO v_class_id;
    END IF;

    IF NEW.class_id IS NULL AND v_class_id IS NOT NULL THEN
      UPDATE public.applications SET class_id = v_class_id WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
