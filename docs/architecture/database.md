# Database Architecture

> Status: Canonical. Verified from `database/supabase/migrations` (29
> migrations) and the generated types.

## Stack

- Postgres hosted on Supabase (project `srhmfaoyhpvhdfxmagho`).
- Schema defined by 29 applied migrations; immutable history.
- Client: `@supabase/supabase-js` with generated types in
  `frontend/src/integrations/supabase/types.ts`.

## Schema shape

- `schools` - tenant root with branding, subscription, section toggles.
- `users` - all roles in one table (`role` enum) with `school_id`.
- Domain tables: `students`, `classes`, `grades`, `attendance`,
  `attendance_logs`, `fees`, `timetables`, `lesson_plans`, `messages`,
  `notifications`, `news`, `events`, `blog_posts`, `testimonials`, `faqs`,
  `school_calendar`, `subscriptions`, `webhook_logs`, `audit_logs`,
  `fraud_attempts`, `qr_tokens`, `teacher_performance_profiles`, etc.
- Every tenant table carries `school_id`.

## RLS model

- RLS enabled on tenant tables.
- Helper functions: `get_my_school_id()`, `is_super_admin()`,
  `get_my_role()`.
- Policies: tenant-scoped access; public read only for published marketing
  content; super-admin bypass.
- Regression gate: `database/queries/rls-isolation-check.sql`.

## Rules

- Applied migrations are never edited or deleted.
- Schema changes are new forward migrations with GRANTs + RLS.
- No SQL from application code outside the database layer.

