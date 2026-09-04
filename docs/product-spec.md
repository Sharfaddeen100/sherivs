# CoreGrid Scholar - archived product specification

> This document is the archived product specification carried over from the
> "Remix of School OS" project during the CoreGrid Scholar migration. It is
> preserved verbatim as the source of truth for the School OS-era product
> requirements (multi-tenancy, schema, empty-state rules). Product decisions
> going forward are governed by `CONSTITUTION.md` and `DECISIONS.md` (root).

The original spec opened with: "Build a complete multi-tenant School
Management SaaS called 'Universal School OS' from scratch."


CRITICAL RULE THAT OVERRIDES EVERYTHING ELSE:

There is zero mock data anywhere in this entire application.

There are zero hardcoded school names anywhere.

There are zero hardcoded student names anywhere.

There are zero hardcoded teacher names anywhere.

There are zero hardcoded testimonials anywhere.

There are zero hardcoded statistics anywhere.

There are zero hardcoded colors anywhere except the system defaults

stored in the database.

There are zero defaultProps with fake data anywhere.

There are zero fallback arrays with demo content anywhere.

Every single piece of content in every single component comes

from Supabase and only from Supabase.

If Supabase returns zero rows the component shows an empty state.

The empty state is a styled placeholder with the section heading

and a message telling the admin how to add content.

The empty state is never fake content pretending to be real.

This rule applies to every component in every portal without

exception. If a developer instinct says "let me add some sample

data so it looks good" that instinct must be ignored.

The application must look and work correctly with zero data

and with real data and with partial data.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECH STACK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



React with TypeScript

Vite

Supabase for database, auth, storage, and realtime

Tailwind CSS

shadcn/ui components

React Router v6

Recharts for charts

Lucide React for icons

Paystack inline for payments

qrcode package for QR generation

date-fns for dates



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MULTI-TENANCY ARCHITECTURE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Each school is a completely isolated tenant.

Each school has a unique id in the schools table.

Every other table has a school_id column.

Every Supabase query in every component must filter by

school_id from the current school context.

Supabase RLS policies enforce this at the database level

so even if application code has a bug the database

will never return data from the wrong school.



After a user logs in read their role from public.users.

Store the user profile and school data in React context.

Every component reads school from useSchool hook.

React Router redirects based on role:

  super_admin goes to /super-admin/dashboard

  hq goes to /hq/dashboard

  admin or principal goes to /admin/dashboard

  teacher goes to /teacher/dashboard

  bursar goes to /bursar/dashboard

  parent goes to /parent/dashboard

  student goes to /student/dashboard



The school context object contains:

  id, name, slug, primary_color, secondary_color,

  logo_url, subscription_tier, subscription_status,

  active_features, all section toggle booleans,

  and all other schools table columns.



Every accent color in every component comes from

school.primary_color and school.secondary_color.

The only hardcoded colors are neutral grays and the

deep navy backgrounds that are structural not branded.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE SCHEMA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



Create all these tables in Supabase with RLS enabled.



schools table columns:

  id uuid primary key default gen_random_uuid()

  name text not null

  slug text unique not null

  domain text unique

  address text

  phone text

  email text

  logo_url text

  about text

  motto text

  founded_year integer

  school_vision text

  school_mission text

  admission_requirements text

  website_url text

  facebook_url text

  twitter_url text

  instagram_url text

  office_hours text

  primary_color text default '#0d9488'

  secondary_color text default '#f59e0b'

  subscription_tier text default 'trial'

    check value in trial starter growth professional enterprise

  subscription_status text default 'active'

    check value in active suspended expired cancelled

  subscription_expires_at timestamptz

  monthly_fee numeric

  paystack_public_key text

  paystack_secret_key text

  active_features jsonb default empty object

  section_hero_enabled boolean default true

  section_about_enabled boolean default true

  section_programs_enabled boolean default true

  section_facilities_enabled boolean default true

  section_faculty_enabled boolean default true

  section_news_enabled boolean default true

  section_testimonials_enabled boolean default true

  section_faqs_enabled boolean default true

  section_contact_enabled boolean default true

  section_why_us_enabled boolean default true

  section_blog_enabled boolean default false

  section_admissions_enabled boolean default true

  section_rules_enabled boolean default true

  section_privacy_enabled boolean default true

  hero_headline text

  hero_subheadline text

  hero_cta_text text default 'Apply for Admission'

  privacy_policy text

  school_rules text

  terms_conditions text

  max_students integer default 100

  max_teachers integer default 10

  is_active boolean default true

  onboarding_completed boolean default false

  created_at timestamptz default now()

  updated_at timestamptz default now()



super_admins table columns:

  id uuid primary key references auth.users

  full_name text not null

  email text not null unique

  role text default 'super_admin'

  is_active boolean default true

  created_at timestamptz default now()



users table columns:

  id uuid primary key references auth.users

  school_id uuid not null references schools

  full_name text not null

  email text

  phone text

  role text not null

    check value in admin principal teacher parent student bursar hq

  avatar_url text

  address text

  gender text

  date_of_birth date

  nin text

  emergency_contact text

  emergency_contact_name text

  subject_specialty text

  qualification text

  years_experience integer default 0

  employment_type text default 'full_time'

  salary numeric

  bank_name text

  account_number text

  account_name text

  date_enrolled date

  next_of_kin_name text

  next_of_kin_phone text

  face_biometric jsonb

  face_registered_at timestamptz

  is_active boolean default true

  last_login_at timestamptz

  created_at timestamptz default now()

  updated_at timestamptz default now()



classes table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  name text not null

  grade_level text

  teacher_id uuid references users

  academic_year text

  capacity integer default 40

  room text

  created_at timestamptz default now()



students table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  user_id uuid references users

  admission_number text

  class_id uuid references classes

  date_of_birth date

  gender text

  blood_group text

  genotype text

  home_address text

  state_of_origin text

  lga text

  religion text

  nationality text default 'Nigerian'

  medical_conditions text

  disability_notes text

  parent_name text

  parent_phone text

  parent_email text

  parent_id uuid references users

  previous_school text

  enrollment_date date default current_date

  is_active boolean default true

  created_at timestamptz default now()

  unique constraint on school_id and admission_number



parent_student_map table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  parent_id uuid not null references users

  student_id uuid not null references students

  relationship text default 'Parent'

  is_primary_contact boolean default true

  created_at timestamptz default now()

  unique constraint on parent_id and student_id



grades table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  student_id uuid not null references students

  class_id uuid references classes

  subject text not null

  ca_score numeric default 0

  exam_score numeric default 0

  total_score numeric generated always as ca_score plus exam_score stored

  grade text

  grade_remark text

  term text not null

  academic_year text not null

  teacher_id uuid references users

  is_published boolean default false

  created_at timestamptz default now()

  unique constraint on student_id subject term academic_year



attendance table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  student_id uuid not null references students

  class_id uuid references classes

  date date not null

  status text not null check value in present absent late excused

  marked_by uuid references users

  note text

  created_at timestamptz default now()

  unique constraint on student_id and date



attendance_logs table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  teacher_id uuid not null references users

  type text not null check value in sign_in sign_out

  timestamp timestamptz default now()

  gps_latitude numeric

  gps_longitude numeric

  inside_geofence boolean

  face_match_score numeric

  face_matched boolean default false

  verified boolean default false

  fraud_detected boolean default false

  fraud_flags jsonb default empty object

  qr_token text

  created_at timestamptz default now()



lesson_plans table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  teacher_id uuid not null references users

  class_id uuid references classes

  title text not null

  subject text

  topic text

  date_planned date

  duration_minutes integer default 60

  description text

  learning_objectives jsonb default empty array

  materials_needed jsonb default empty array

  activities jsonb default empty array

  assessment_methods jsonb default empty array

  homework_assignment text

  file_urls jsonb default empty array

  status text default 'draft'

    check value in draft submitted approved needs_revision

  review_notes text

  admin_viewed boolean default false

  created_at timestamptz default now()

  updated_at timestamptz default now()



timetables table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  class_id uuid not null references classes

  academic_year text not null

  term text not null

  generated_by text default 'ai'

  is_active boolean default true

  published boolean default false

  created_at timestamptz default now()

  unique constraint on class_id academic_year term



timetable_slots table columns:

  id uuid primary key default gen_random_uuid()

  timetable_id uuid not null references timetables

  school_id uuid not null references schools

  day_of_week text not null

  period_number integer not null

  start_time time not null

  end_time time not null

  subject text not null

  teacher_id uuid references users

  room text

  is_break boolean default false

  break_label text

  created_at timestamptz default now()

  unique constraint on timetable_id day_of_week period_number



school_calendar table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  title text not null

  description text

  start_date date not null

  end_date date

  event_type text default 'general'

  color text default '#0d9488'

  all_day boolean default true

  start_time time

  end_time time

  target_audience text default 'all'

  location text

  created_by uuid references users

  created_at timestamptz default now()



news table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  title text not null

  content text not null

  excerpt text

  author_id uuid references users

  category text default 'general'

  cover_image_url text

  is_published boolean default false

  published_at timestamptz

  target_audience text default 'all'

  is_pinned boolean default false

  view_count integer default 0

  created_at timestamptz default now()

  updated_at timestamptz default now()



events table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  title text not null

  description text

  location text

  event_date date not null

  end_date date

  event_time time

  end_time time

  event_type text default 'general'

  target_audience text default 'all'

  is_published boolean default true

  cover_image_url text

  created_by uuid references users

  created_at timestamptz default now()



teacher_performance_profiles table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  teacher_id uuid not null references users

  attendance_rate numeric default 0

  punctuality_score numeric default 0

  late_count_30d integer default 0

  absent_count_30d integer default 0

  lesson_plans_uploaded integer default 0

  avg_lesson_plan_quality numeric default 0

  curriculum_coverage numeric default 0

  student_avg_improvement numeric default 0

  burnout_risk_score numeric default 0

  burnout_risk_level text default 'none'

  resignation_probability numeric default 0

  promotion_readiness_score numeric default 0

  overall_teacher_health_score numeric default 0

  calculated_at timestamptz default now()

  unique constraint on school_id and teacher_id



fees table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  student_id uuid not null references students

  fee_type text not null

  amount numeric not null

  due_date date

  paid_amount numeric default 0

  status text default 'unpaid' check value in unpaid partial paid

  paystack_reference text

  paystack_access_code text

  paid_at timestamptz

  term text

  academic_year text

  created_at timestamptz default now()



fraud_attempts table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  attempted_by uuid references users

  fraud_type text

  fraud_score numeric

  fraud_flags jsonb default empty object

  captured_face_url text

  face_similarity numeric

  gps_latitude numeric

  gps_longitude numeric

  status text default 'blocked'

  created_at timestamptz default now()



qr_tokens table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  token text unique not null

  type text check value in sign_in sign_out

  expires_at timestamptz not null

  used boolean default false

  created_at timestamptz default now()



notifications table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  user_id uuid not null references users

  title text

  message text not null

  type text default 'system'

  is_read boolean default false

  action_url text

  created_at timestamptz default now()



testimonials table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  name text not null

  role text not null

  content text not null

  avatar_url text

  rating integer default 5

  is_published boolean default true

  order_index integer default 0

  created_at timestamptz default now()



faqs table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  question text not null

  answer text not null

  category text default 'general'

  order_index integer default 0

  is_published boolean default true

  created_at timestamptz default now()



academic_programs table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  name text not null

  description text

  age_range text

  duration text

  features jsonb default empty array

  subjects jsonb default empty array

  order_index integer default 0

  is_published boolean default true

  created_at timestamptz default now()



school_facilities table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  name text not null

  description text

  icon text default '🏫'

  image_url text

  order_index integer default 0

  is_published boolean default true

  created_at timestamptz default now()



why_us_items table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  title text not null

  description text

  icon text default '✅'

  order_index integer default 0

  is_published boolean default true

  created_at timestamptz default now()



blog_posts table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  title text not null

  slug text not null

  content text not null

  excerpt text

  cover_image_url text

  author_id uuid references users

  category text default 'general'

  is_published boolean default false

  published_at timestamptz

  view_count integer default 0

  created_at timestamptz default now()

  updated_at timestamptz default now()

  unique constraint on school_id and slug



subscriptions table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  plan text not null

  status text default 'active'

  amount_paid numeric default 0

  started_at timestamptz default now()

  expires_at timestamptz

  paystack_reference text

  created_at timestamptz default now()



super_admin_logs table columns:

  id uuid primary key default gen_random_uuid()

  admin_id uuid references super_admins

  action text not null

  target_school_id uuid references schools

  details jsonb

  created_at timestamptz default now()



webhook_logs table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid references schools

  provider text default 'paystack'

  event_type text

  payload jsonb

  processing_status text default 'pending'

  processed_at timestamptz

  error_message text

  created_at timestamptz default now()



messages table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid not null references schools

  sender_id uuid references users

  recipient_id uuid not null references users

  subject text

  body text not null

  is_read boolean default false

  created_at timestamptz default now()



audit_logs table columns:

  id uuid primary key default gen_random_uuid()

  school_id uuid references schools

  user_id uuid references users

  action text not null

  table_name text

  record_id uuid

  old_value jsonb

  new_value jsonb

  ip_address text

  created_at timestamptz default now()



RLS policies required:

  Enable RLS on every table.

  Create helper functions:

    get_my_school_id returns the school_id of the current user

    is_super_admin returns true if current user is in super_admins table

    get_my_role returns the role of the current user

  Schools table: public can read active schools.

    Super admin can do everything.

    Admin can update their own school.

  Users table: users can read their own record.

    All users in same school can see each other.

    Super admin bypasses all.

  Every other table: all operations allowed only when

    school_id matches get_my_school_id() or is_super_admin() is true.

  Public read allowed on:

    testimonials where is_published is true

    faqs where is_published is true

    academic_programs where is_published is true

    school_facilities where is_published is true

    why_us_items where is_published is true

    news where is_published is true

    events where is_published is true

    blog_posts where is_published is true



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMPTY STATE RULES FOR EVERY COMPONENT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━



When Supabase returns zero rows for any section

the component must render the section heading and

design structure with empty placeholder boxes.

The placeholder boxes have dashed borders and

contain text explaining how to add content.



Example for Facilities section with no data:

  Show the section with heading "Our Facilities"

  Show 6 cards with dashed borders

  Each card says "Add your facilities in Admin Settings"

  Do not hide the section

  Do not show fake facility names



Example for Teachers section with no data:

  Show the section with heading "Meet Our Teachers"

  Show 4 circular placeholder avatars with dashed borders

  Below each avatar show "Teacher name will appear here"

  Do not show "John Smith - Mathematics Teacher"



Example for Testimonials with no data:

  Show the section with heading "Parent and Alumni Testimonials"

  Show 3 cards with dashed borders and quote icons

  Each card says "Add testimonials in Admin Settings"

  Do not show "Mrs. Adaeze Okafor says our school is amazing"



Example for Stats in Hero with no data:

  Show stat cards with 0 or dash as the value

  Show the label beneath each stat

  Do not show 1200+ Students if the count is 0



This same rule applies to every single section and

every single component in every single portal.

Real data from Supabase or empty state. Nothing else.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
