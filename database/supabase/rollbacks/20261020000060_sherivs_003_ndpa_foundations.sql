-- Rollback for 20261020000060 (SHERIVS-003). Local disposable stack only.
-- DESTROYS consent, DSR and incident records; export them first if they matter.
BEGIN;
DROP FUNCTION IF EXISTS public.retention_dry_run();
DROP TABLE IF EXISTS public.security_incidents;
DROP TABLE IF EXISTS public.data_subject_request_events;
DROP TABLE IF EXISTS public.data_subject_requests;
DROP TABLE IF EXISTS public.consent_events;
DROP TABLE IF EXISTS public.consent_records;
DROP FUNCTION IF EXISTS public.security_incidents_set_due();
DROP FUNCTION IF EXISTS public.dsr_guard();
DROP FUNCTION IF EXISTS public.consent_records_guard();
DROP FUNCTION IF EXISTS public.ndpa_forbid_mutation();
DROP FUNCTION IF EXISTS public.is_guardian_of_student(uuid, uuid);
COMMIT;
