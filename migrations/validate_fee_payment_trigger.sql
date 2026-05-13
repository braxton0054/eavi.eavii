-- Backend guard: prevents fee payments when course has no fees configured
CREATE OR REPLACE FUNCTION validate_fee_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_course_type_id UUID;
  v_payment_mode TEXT;
  v_expected_fee NUMERIC;
BEGIN
  SELECT a.course_type_id INTO v_course_type_id
  FROM public.applications a WHERE a.id = NEW.application_id;
  IF v_course_type_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  SELECT m.payment_mode INTO v_payment_mode
  FROM public.modules m WHERE m.id = NEW.module_id;

  IF v_payment_mode = 'per_module' THEN
    SELECT COALESCE(m.fee, 0) + COALESCE(m.exam_fee, 0)
    INTO v_expected_fee FROM public.modules m WHERE m.id = NEW.module_id;
  ELSIF v_payment_mode = 'per_semester' AND NEW.semester_id IS NOT NULL THEN
    SELECT COALESCE(s.fee, 0) + COALESCE(s.practical_fee, 0)
    INTO v_expected_fee FROM public.semesters s WHERE s.id = NEW.semester_id;
  ELSE
    v_expected_fee := 0;
  END IF;

  IF v_expected_fee <= 0 THEN
    RAISE EXCEPTION 'Cannot record payment: No fees configured for this course. Set module/semester fees in course setup first.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_fee_payment ON fee_payments;
CREATE TRIGGER trg_validate_fee_payment
  BEFORE INSERT ON fee_payments
  FOR EACH ROW EXECUTE FUNCTION validate_fee_payment();
