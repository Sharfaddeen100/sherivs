-- =============================================================================
-- SHERIVS-004: in-school write restrictions (RESTRICTIVE policies).
-- Verified ONLY on a local disposable loopback Supabase stack. Not applied remotely.
-- Before: ~40 tables had FOR ALL policies of the form school_id = get_my_school_id(),
-- so ANY member of a school (parent, student, alumni, driver) could insert/update/
-- delete e.g. attendance, clinic visits, discipline, payroll, website content, and
-- parent_student_map (linking themselves to any child, then reading that child).
-- After: the existing permissive policies still decide WHICH school; these
-- RESTRICTIVE policies additionally require a writer role per table family:
--   admin  : admin/principal            (website, HR, health, discipline, hostel, library, billing)
--   fin    : admin/principal/bursar     (expenses, budgets)
--   link   : admin/principal/registrar  (parent_student_map)
--   staff  : admin/principal/bursar/hq/teacher (attendance, lessons, timetables, calendar, news)
-- Reads are unchanged. Service-role server functions are unaffected.
-- Rollback: database/supabase/rollbacks/20261020000100_sherivs_004_in_school_write_roles.sql
-- =============================================================================
BEGIN;

-- academic_programs (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.academic_programs;
CREATE POLICY sv4_insert_role ON public.academic_programs AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.academic_programs;
CREATE POLICY sv4_update_role ON public.academic_programs AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.academic_programs;
CREATE POLICY sv4_delete_role ON public.academic_programs AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- blog_posts (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.blog_posts;
CREATE POLICY sv4_insert_role ON public.blog_posts AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.blog_posts;
CREATE POLICY sv4_update_role ON public.blog_posts AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.blog_posts;
CREATE POLICY sv4_delete_role ON public.blog_posts AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- faqs (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.faqs;
CREATE POLICY sv4_insert_role ON public.faqs AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.faqs;
CREATE POLICY sv4_update_role ON public.faqs AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.faqs;
CREATE POLICY sv4_delete_role ON public.faqs AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- testimonials (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.testimonials;
CREATE POLICY sv4_insert_role ON public.testimonials AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.testimonials;
CREATE POLICY sv4_update_role ON public.testimonials AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.testimonials;
CREATE POLICY sv4_delete_role ON public.testimonials AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- why_us_items (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.why_us_items;
CREATE POLICY sv4_insert_role ON public.why_us_items AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.why_us_items;
CREATE POLICY sv4_update_role ON public.why_us_items AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.why_us_items;
CREATE POLICY sv4_delete_role ON public.why_us_items AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_facilities (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_facilities;
CREATE POLICY sv4_insert_role ON public.school_facilities AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_facilities;
CREATE POLICY sv4_update_role ON public.school_facilities AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_facilities;
CREATE POLICY sv4_delete_role ON public.school_facilities AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_meals (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_meals;
CREATE POLICY sv4_insert_role ON public.school_meals AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_meals;
CREATE POLICY sv4_update_role ON public.school_meals AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_meals;
CREATE POLICY sv4_delete_role ON public.school_meals AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_sports (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_sports;
CREATE POLICY sv4_insert_role ON public.school_sports AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_sports;
CREATE POLICY sv4_update_role ON public.school_sports AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_sports;
CREATE POLICY sv4_delete_role ON public.school_sports AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_staff_types (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_staff_types;
CREATE POLICY sv4_insert_role ON public.school_staff_types AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_staff_types;
CREATE POLICY sv4_update_role ON public.school_staff_types AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_staff_types;
CREATE POLICY sv4_delete_role ON public.school_staff_types AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_transport (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_transport;
CREATE POLICY sv4_insert_role ON public.school_transport AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_transport;
CREATE POLICY sv4_update_role ON public.school_transport AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_transport;
CREATE POLICY sv4_delete_role ON public.school_transport AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_geofence (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_geofence;
CREATE POLICY sv4_insert_role ON public.school_geofence AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_geofence;
CREATE POLICY sv4_update_role ON public.school_geofence AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_geofence;
CREATE POLICY sv4_delete_role ON public.school_geofence AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- clinic_visits (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.clinic_visits;
CREATE POLICY sv4_insert_role ON public.clinic_visits AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.clinic_visits;
CREATE POLICY sv4_update_role ON public.clinic_visits AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.clinic_visits;
CREATE POLICY sv4_delete_role ON public.clinic_visits AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- discipline_records (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.discipline_records;
CREATE POLICY sv4_insert_role ON public.discipline_records AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.discipline_records;
CREATE POLICY sv4_update_role ON public.discipline_records AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.discipline_records;
CREATE POLICY sv4_delete_role ON public.discipline_records AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- hostel_allocations (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.hostel_allocations;
CREATE POLICY sv4_insert_role ON public.hostel_allocations AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.hostel_allocations;
CREATE POLICY sv4_update_role ON public.hostel_allocations AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.hostel_allocations;
CREATE POLICY sv4_delete_role ON public.hostel_allocations AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- hostel_attendance (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.hostel_attendance;
CREATE POLICY sv4_insert_role ON public.hostel_attendance AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.hostel_attendance;
CREATE POLICY sv4_update_role ON public.hostel_attendance AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.hostel_attendance;
CREATE POLICY sv4_delete_role ON public.hostel_attendance AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- hostel_rooms (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.hostel_rooms;
CREATE POLICY sv4_insert_role ON public.hostel_rooms AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.hostel_rooms;
CREATE POLICY sv4_update_role ON public.hostel_rooms AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.hostel_rooms;
CREATE POLICY sv4_delete_role ON public.hostel_rooms AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- library_books (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.library_books;
CREATE POLICY sv4_insert_role ON public.library_books AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.library_books;
CREATE POLICY sv4_update_role ON public.library_books AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.library_books;
CREATE POLICY sv4_delete_role ON public.library_books AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- library_borrowings (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.library_borrowings;
CREATE POLICY sv4_insert_role ON public.library_borrowings AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.library_borrowings;
CREATE POLICY sv4_update_role ON public.library_borrowings AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.library_borrowings;
CREATE POLICY sv4_delete_role ON public.library_borrowings AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- staff_payroll (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.staff_payroll;
CREATE POLICY sv4_insert_role ON public.staff_payroll AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.staff_payroll;
CREATE POLICY sv4_update_role ON public.staff_payroll AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.staff_payroll;
CREATE POLICY sv4_delete_role ON public.staff_payroll AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- staff_leave (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.staff_leave;
CREATE POLICY sv4_insert_role ON public.staff_leave AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.staff_leave;
CREATE POLICY sv4_update_role ON public.staff_leave AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.staff_leave;
CREATE POLICY sv4_delete_role ON public.staff_leave AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_ad_campaigns (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_ad_campaigns;
CREATE POLICY sv4_insert_role ON public.school_ad_campaigns AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_ad_campaigns;
CREATE POLICY sv4_update_role ON public.school_ad_campaigns AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_ad_campaigns;
CREATE POLICY sv4_delete_role ON public.school_ad_campaigns AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- fraud_attempts (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.fraud_attempts;
CREATE POLICY sv4_insert_role ON public.fraud_attempts AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.fraud_attempts;
CREATE POLICY sv4_update_role ON public.fraud_attempts AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.fraud_attempts;
CREATE POLICY sv4_delete_role ON public.fraud_attempts AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- subscriptions (admin)
DROP POLICY IF EXISTS sv4_insert_role ON public.subscriptions;
CREATE POLICY sv4_insert_role ON public.subscriptions AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_update_role ON public.subscriptions;
CREATE POLICY sv4_update_role ON public.subscriptions AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));
DROP POLICY IF EXISTS sv4_delete_role ON public.subscriptions;
CREATE POLICY sv4_delete_role ON public.subscriptions AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal'));

-- school_expenses (fin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_expenses;
CREATE POLICY sv4_insert_role ON public.school_expenses AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_expenses;
CREATE POLICY sv4_update_role ON public.school_expenses AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_expenses;
CREATE POLICY sv4_delete_role ON public.school_expenses AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar'));

-- school_expense_budgets (fin)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_expense_budgets;
CREATE POLICY sv4_insert_role ON public.school_expense_budgets AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_expense_budgets;
CREATE POLICY sv4_update_role ON public.school_expense_budgets AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_expense_budgets;
CREATE POLICY sv4_delete_role ON public.school_expense_budgets AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar'));

-- parent_student_map (link)
DROP POLICY IF EXISTS sv4_insert_role ON public.parent_student_map;
CREATE POLICY sv4_insert_role ON public.parent_student_map AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal') OR public.can_manage_admissions());
DROP POLICY IF EXISTS sv4_update_role ON public.parent_student_map;
CREATE POLICY sv4_update_role ON public.parent_student_map AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal') OR public.can_manage_admissions()) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal') OR public.can_manage_admissions());
DROP POLICY IF EXISTS sv4_delete_role ON public.parent_student_map;
CREATE POLICY sv4_delete_role ON public.parent_student_map AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal') OR public.can_manage_admissions());

-- attendance (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.attendance;
CREATE POLICY sv4_insert_role ON public.attendance AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.attendance;
CREATE POLICY sv4_update_role ON public.attendance AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.attendance;
CREATE POLICY sv4_delete_role ON public.attendance AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- attendance_logs (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.attendance_logs;
CREATE POLICY sv4_insert_role ON public.attendance_logs AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.attendance_logs;
CREATE POLICY sv4_update_role ON public.attendance_logs AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.attendance_logs;
CREATE POLICY sv4_delete_role ON public.attendance_logs AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- attendance_verification_log (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.attendance_verification_log;
CREATE POLICY sv4_insert_role ON public.attendance_verification_log AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.attendance_verification_log;
CREATE POLICY sv4_update_role ON public.attendance_verification_log AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.attendance_verification_log;
CREATE POLICY sv4_delete_role ON public.attendance_verification_log AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- teacher_biometrics (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.teacher_biometrics;
CREATE POLICY sv4_insert_role ON public.teacher_biometrics AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.teacher_biometrics;
CREATE POLICY sv4_update_role ON public.teacher_biometrics AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.teacher_biometrics;
CREATE POLICY sv4_delete_role ON public.teacher_biometrics AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- lesson_plans (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.lesson_plans;
CREATE POLICY sv4_insert_role ON public.lesson_plans AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.lesson_plans;
CREATE POLICY sv4_update_role ON public.lesson_plans AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.lesson_plans;
CREATE POLICY sv4_delete_role ON public.lesson_plans AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- classes (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.classes;
CREATE POLICY sv4_insert_role ON public.classes AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.classes;
CREATE POLICY sv4_update_role ON public.classes AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.classes;
CREATE POLICY sv4_delete_role ON public.classes AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- timetables (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.timetables;
CREATE POLICY sv4_insert_role ON public.timetables AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.timetables;
CREATE POLICY sv4_update_role ON public.timetables AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.timetables;
CREATE POLICY sv4_delete_role ON public.timetables AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- timetable_slots (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.timetable_slots;
CREATE POLICY sv4_insert_role ON public.timetable_slots AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.timetable_slots;
CREATE POLICY sv4_update_role ON public.timetable_slots AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.timetable_slots;
CREATE POLICY sv4_delete_role ON public.timetable_slots AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- school_calendar (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.school_calendar;
CREATE POLICY sv4_insert_role ON public.school_calendar AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.school_calendar;
CREATE POLICY sv4_update_role ON public.school_calendar AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.school_calendar;
CREATE POLICY sv4_delete_role ON public.school_calendar AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- events (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.events;
CREATE POLICY sv4_insert_role ON public.events AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.events;
CREATE POLICY sv4_update_role ON public.events AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.events;
CREATE POLICY sv4_delete_role ON public.events AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

-- news (staff)
DROP POLICY IF EXISTS sv4_insert_role ON public.news;
CREATE POLICY sv4_insert_role ON public.news AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_update_role ON public.news;
CREATE POLICY sv4_update_role ON public.news AS RESTRICTIVE FOR UPDATE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher')) WITH CHECK (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));
DROP POLICY IF EXISTS sv4_delete_role ON public.news;
CREATE POLICY sv4_delete_role ON public.news AS RESTRICTIVE FOR DELETE TO public USING (public.is_super_admin() OR public.my_active_role() IN ('admin','principal','bursar','hq','teacher'));

COMMIT;
