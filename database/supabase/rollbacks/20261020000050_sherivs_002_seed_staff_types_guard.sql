-- Rollback for 20261020000050: restore the unguarded body by re-running the
-- original definition from 20260626150625 and its grants. Local disposable stack only.
-- (Intentionally re-opens the cross-tenant write; use only to undo a local test.)
BEGIN;
CREATE OR REPLACE FUNCTION public.seed_default_staff_types(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seeds text[][] := ARRAY[
    -- category, staff_type
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
  FOR i IN 1..array_length(seeds, 1) LOOP
    INSERT INTO public.school_staff_types
      (school_id, staff_type_category, staff_type, order_index)
    VALUES (_school_id, seeds[i][1], seeds[i][2], i)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_default_staff_types(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.seed_default_staff_types(uuid) TO PUBLIC;
COMMIT;
