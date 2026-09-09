-- =============================================================================
-- Scholar (runtime:scholar) workforce-catalog EXTENSION — full African
-- school ecosystem (religious/TVET/entrepreneurship/multi-campus/shifts/boarding)
-- =============================================================================
-- Author: CoreGrid Autonomous Engineering Loop (2026-09-07)
-- Status: APPLIED + VERIFIED 2026-09-07 on project nwrflbpbhyiqdptmlccm.
--
-- Extends the R-001 staff reality beyond the general school staff (45 kinds)
-- with the roles the complex African school ecosystem needs: religious and
-- madrassa instruction, vocational/TVET and entrepreneurship instructors,
-- multi-campus and shift coordination, ministry liaison, boarding management
-- and care specialists — total 71 kinds after this install. Advisory data
-- only; Phase 08 remains the only authorization authority.
-- =============================================================================

INSERT INTO public.cg_workforce_kind
  (runtime_ref, kind_code, title, aliases, family, employment_class,
   is_teaching, is_leadership, authority_group, description, status)
VALUES
  -- Religious / traditional instruction
  ('runtime:scholar', 'religious_education_teacher',
   'Religious Education Teacher',
   ARRAY['RE Teacher','RME Teacher','Christian Religious Studies Teacher'],
   'teaching', 'teaching', true, false, 'teaching_staff',
   'Teaches religious and moral education across the school programme.', 'active'),
  ('runtime:scholar', 'madrassa_instructor',
   'Arabic and Islamic Studies Instructor',
   ARRAY['Madrassa Teacher','Islamic Studies Teacher','Ustadh'],
   'teaching', 'teaching', true, false, 'teaching_staff',
   'Delivers Arabic and Islamic studies for schools offering that stream.', 'active'),
  -- Vocational / TVET / entrepreneurship
  ('runtime:scholar', 'vocational_skills_coordinator',
   'Vocational Skills Coordinator',
   ARRAY['TVET Coordinator','Skills Development Officer'],
   'learning_support', 'support', false, true, 'teaching_leadership',
   'Coordinates the vocational and technical skills programme.', 'active'),
  ('runtime:scholar', 'tailoring_instructor',
   'Tailoring and Fashion Instructor',
   ARRAY['Fashion and Design Teacher','Clothing and Textiles Teacher'],
   'learning_support', 'support', false, false, 'learning_support',
   'Instructs tailoring, fashion and clothing and textiles practicals.', 'active'),
  ('runtime:scholar', 'carpentry_instructor',
   'Carpentry and Joinery Instructor',
   ARRAY['Woodwork Teacher','Craft Instructor'],
   'learning_support', 'support', false, false, 'learning_support',
   'Instructs carpentry, joinery and woodwork practicals.', 'active'),
  ('runtime:scholar', 'electrical_instructor',
   'Electrical Installation Instructor',
   ARRAY['Electrical Wiring Teacher','Electronics Instructor'],
   'learning_support', 'support', false, false, 'learning_support',
   'Instructs electrical installation and basic electronics.', 'active'),
  ('runtime:scholar', 'construction_instructor',
   'Building and Construction Instructor',
   ARRAY['Masonry Teacher','Construction Crafts Instructor'],
   'learning_support', 'support', false, false, 'learning_support',
   'Instructs building construction and masonry crafts.', 'active'),
  ('runtime:scholar', 'hospitality_instructor',
   'Food and Hospitality Instructor',
   ARRAY['Catering Instructor','Food and Nutrition Teacher'],
   'learning_support', 'support', false, false, 'learning_support',
   'Instructs food preparation, nutrition and hospitality skills.', 'active'),
  ('runtime:scholar', 'entrepreneurship_coordinator',
   'Entrepreneurship Coordinator',
   ARRAY['Enterprise Club Patron','Business Innovation Teacher'],
   'learning_support', 'support', false, false, 'learning_support',
   'Leads entrepreneurship education and student enterprise clubs.', 'active'),
  ('runtime:scholar', 'business_studies_instructor',
   'Business Studies Instructor',
   ARRAY['Commerce Teacher','Accounts Teacher','Business Teacher'],
   'learning_support', 'support', false, false, 'learning_support',
   'Teaches commerce, business studies and enterprise subjects.', 'active'),
  ('runtime:scholar', 'computer_studies_instructor',
   'Computer Studies Instructor',
   ARRAY['ICT Teacher','Coding Teacher','Computing Teacher'],
   'learning_support', 'support', false, false, 'learning_support',
   'Teaches computer studies, coding and digital literacy.', 'active');

INSERT INTO public.cg_workforce_kind
  (runtime_ref, kind_code, title, aliases, family, employment_class,
   is_teaching, is_leadership, authority_group, description, status)
VALUES
  -- Multi-campus / shifts / premises
  ('runtime:scholar', 'campus_director',
   'Campus and Branch Director',
   ARRAY['Campus Principal','Branch Head'],
   'leadership', 'teaching', true, true, 'org_admin',
   'Leads a campus or branch of a multi-campus institution.', 'active'),
  ('runtime:scholar', 'campus_deputy',
   'Deputy Campus Director',
   ARRAY['Campus Deputy Head','Branch Deputy Head'],
   'leadership', 'teaching', true, true, 'org_admin',
   'Supports the campus director and runs the campus in their absence.', 'active'),
  ('runtime:scholar', 'shift_coordinator',
   'Shift Coordinator',
   ARRAY['Session Coordinator','Double-Shift Liaison'],
   'leadership', 'teaching', true, true, 'teaching_leadership',
   'Coordinates morning and afternoon shift schooling timetables.', 'active'),
  ('runtime:scholar', 'premises_officer',
   'Premises and Branch Officer',
   ARRAY['Site Officer','Off-Campus Premises Officer'],
   'facilities', 'non_teaching', false, false, 'facilities',
   'Oversees premises and off-campus sites across the estate.', 'active'),
  ('runtime:scholar', 'education_ministry_liaison',
   'Education Ministry Liaison',
   ARRAY['Federal and State Liaison Officer','Grants and Compliance Officer'],
   'administration', 'non_teaching', false, false, 'extended_services',
   'Liaises with education ministries, inspectorates and grant bodies.', 'active'),
  -- Boarding / extended-day / care
  ('runtime:scholar', 'hostel_manager',
   'Hostel and Boarding Manager',
   ARRAY['Dormitory Manager','Boarding House Manager'],
   'learner_welfare', 'support', false, false, 'learner_welfare',
   'Runs hostel operations across dormitories and boarding blocks.', 'active'),
  ('runtime:scholar', 'study_supervisor',
   'Evening Study Supervisor',
   ARRAY['Prep Supervisor','Night Study Supervisor'],
   'learner_welfare', 'support', false, false, 'learner_welfare',
   'Supervises evening and prep study sessions for boarding learners.', 'active'),
  ('runtime:scholar', 'weekend_activities_coordinator',
   'Weekend Activities Coordinator',
   ARRAY['Saturday Programme Coordinator','Boarding Weekend Organiser'],
   'learner_welfare', 'support', false, false, 'learner_welfare',
   'Plans weekend and holiday activities for boarding learners.', 'active'),
  ('runtime:scholar', 'school_psychologist',
   'School Psychologist',
   ARRAY['Educational Psychologist','Child Psychologist'],
   'learner_welfare', 'support', false, false, 'learner_welfare',
   'Provides psychological assessment and support for learners.', 'active'),
  ('runtime:scholar', 'first_aid_officer',
   'First Aid and Safety Officer',
   ARRAY['First Aider','Campus Safety Officer'],
   'health', 'support', false, false, 'learner_welfare',
   'Runs first aid points, drills and campus safety readiness.', 'active'),
  ('runtime:scholar', 'library_assistant',
   'Library Assistant',
   ARRAY['Junior Librarian','Reading Room Assistant'],
   'learning_support', 'support', false, false, 'learning_support',
   'Supports the librarian with cataloguing, shelving and reading rooms.', 'active');

INSERT INTO public.cg_workforce_kind
  (runtime_ref, kind_code, title, aliases, family, employment_class,
   is_teaching, is_leadership, authority_group, description, status)
VALUES
  -- Programme level coordination
  ('runtime:scholar', 'early_years_coordinator',
   'Early Years Coordinator',
   ARRAY['Pre-Primary Head','Nursery Coordinator','Kindergarten Head'],
   'leadership', 'teaching', true, true, 'teaching_leadership',
   'Leads the pre-primary and early years programme.', 'active'),
  ('runtime:scholar', 'middle_school_coordinator',
   'Lower Secondary Coordinator',
   ARRAY['Junior School Head','Middle School Head'],
   'leadership', 'teaching', true, true, 'teaching_leadership',
   'Coordinates the lower secondary programme across classes.', 'active'),
  ('runtime:scholar', 'upper_school_coordinator',
   'Upper Secondary Coordinator',
   ARRAY['Senior School Head','High School Head'],
   'leadership', 'teaching', true, true, 'teaching_leadership',
   'Coordinates the upper secondary programme and examinations track.', 'active'),
  ('runtime:scholar', 'careers_guidance_officer',
   'Careers and University Liaison Officer',
   ARRAY['Career Counsellor','Tertiary Pathways Officer'],
   'learner_welfare', 'support', false, false, 'learner_welfare',
   'Guides learners on careers, university and tertiary pathways.', 'active');


