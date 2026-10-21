-- =============================================================================
-- SHERIVS-002: authorize public.seed_default_staff_types(_school_id).
-- Verified ONLY on a local disposable loopback Supabase stack.
--
-- Before: SECURITY DEFINER with no caller check, EXECUTE granted to anon and
-- authenticated, so anyone, anonymous included, could write the 38 default
-- school_staff_types rows into ANY school. A school-A teacher wrote 38 rows
-- into school B in a local probe.
-- After: only service_role, a super admin, or an active admin/principal of
-- that same school may call it. anon EXECUTE is revoked. The function body is
-- otherwise unchanged (20260626150625).
-- =============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.seed_default_staff_types(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  seeds text[][] := ARRAY[
    ['Teaching','Head Teacher'], ['Teaching','Class Teacher'],
    ['Teaching','Subject Teacher'], ['Teaching','Special Needs Teacher'],
    ['Teaching','Music Teacher'], ['Teaching','Physical Education Teacher'],
    ['Teaching','Library Teacher'], ['Teaching','ICT Teacher'],
    ['Teaching','Counselor'],
    ['Administrative','School Secretary'], ['Administrative','Administrative Officer'],
    ['Administrative','Admissions Officer'], ['Administrative','Examinations Officer'],
    ['Administrative','Records Officer'],
    ['Support','School Driver'], ['Support','School Bus Conductor'],
    ['Support','Cook'], ['Support','Kitchen Assistant'], ['Support','Cleaner'],
    ['Support','Janitor'], ['Support','Groundskeeper'], ['Support','Security Guard'],
    ['Support','Gate Man'], ['Support','Nurse'], ['Support','School Doctor'],
    ['Support','Laboratory Technician'], ['Support','IT Support'], ['Support','Librarian'],
    ['Care','Nanny'], ['Care','Daycare Attendant'], ['Care','School Nurse'],
    ['Management','Principal'], ['Management','Vice Principal'],
    ['Management','Bursar'], ['Management','Accountant'],
    ['Management','Public Relations Officer'], ['Management','School Chaplain'],
    ['Management','Head of Department']
  ];
  i int;
BEGIN
  IF NOT (
       current_user = 'service_role'
    OR public.is_super_admin()
    OR (public.is_school_admin() AND _school_id = public.get_my_school_id())
  ) THEN
    RAISE EXCEPTION 'Forbidden: not authorized to seed staff types for this school'
      USING ERRCODE = '42501';
  END IF;

  FOR i IN 1..array_length(seeds, 1) LOOP
    INSERT INTO public.school_staff_types
      (school_id, staff_type_category, staff_type, order_index)
    VALUES (_school_id, seeds[i][1], seeds[i][2], i)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.seed_default_staff_types(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_default_staff_types(uuid) TO authenticated, service_role;

COMMIT;
