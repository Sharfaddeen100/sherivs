
You've packed ~15 distinct fixes/features into one message. I'll group them into shippable batches so we can land them cleanly (and so you can approve/reject slices instead of one giant commit). Each batch below is roughly 1 build turn.

## Batch 1 — Public site polish
- Center-align Contact section content (address block was left-drifting on mobile).
- Staff/Faculty section: seed at least 5 staff cards with role + years of experience; make the section pull from a new `school_staff_public` view so admin edits reflect on the site.
- Add photo upload for staff (Supabase Storage bucket `staff-photos`, public read).
- Add **Google Map embed** to Contact section (uses the existing `google_maps_embed_url` field on `schools` — admin pastes an embed URL under Settings → Location, site renders the iframe).
- New **Gallery** public page + route (`/gallery`) with 5 category sections (Campus, Classrooms, Labs, Sports, Events). Admin uploads images from a new CMS "Gallery" tab.

## Batch 2 — Admin UX consistency
- School Settings tabs: convert to same mobile-dropdown pattern used in CMS (no more overlap).
- Sweep secondary/outline button variants → unify to the primary teal color across the app (kills the odd blue/purple button appearing in random sections).
- Fix horizontal scroll on: Admissions table, Locked Accounts table, Digital Twin recent calls. All get the same `overflow-x-auto` + `min-w-[720px]` wrapper pattern.
- Expenses header: rework grid so "Expenses" title, "Track every naira…" subtitle, "Export CSV" and "Add expense" buttons sit on a proper responsive row (no vertical text, no overlap).

## Batch 3 — Enterprise-grade Students & Staff
- Rename **Teachers** page → **Staff**. Extends the users table with: salary, role, qualifications, years_experience, address, email, phone, full_name, employment_type, hire_date, emergency_contact, bank_details (encrypted), NIN/SSN, next_of_kin.
- Extend **Students** with: full_name, class, admission_no, address, parent_phone, parent_email, disabilities, medical_condition, genotype, blood_group, allergies, date_enrolled, guardian_name, guardian_relationship, guardian_phone, guardian_address, previous_school, religion, nationality, state_of_origin.
- New multi-step forms (Personal → Academic/Employment → Contact → Medical/Guardian → Documents).
- Detail drawer showing all fields with edit-in-place.

**Premium student fields I'd recommend to push Vibeora to the next level:**
1. **Biometric ID hash** (fingerprint template hash for gate/attendance kiosks)
2. **Learning profile** — dominant learning style, IEP flag, gifted-program flag
3. **Behavioral score timeline** (auto-fed by teacher remarks)
4. **Home environment snapshot** — guardians' occupation, siblings in school, primary language at home (drives targeted comms)
5. **Digital consent ledger** — photo release, data processing, transport consent, each with timestamp + guardian signature URL
6. **Health passport** — immunization schedule, last dental/eye exam, chronic-care plan
7. **Financial risk flag** — auto-computed from fees payment history for early bursary intervention
8. **Alumni pipeline fields** — post-graduation destination, contactable-after-graduation opt-in

## Batch 4 — Tier unlock + auto-refresh + intelligence deep links
- Force every existing tier's feature set into `enterprise` (so enterprise = superset). Keep `enterprise` tier gated for itself only.
- Teacher check-in QR: replace 30s manual regen with a `setInterval` that silently rotates the token every 30s while the page is mounted (admin taps generate once, it auto-rolls forever).
- Payment providers in API Keys: single `<Select>` dropdown (Paystack, Stripe, Flutterwave, Paddle). Choosing a provider swaps in the correct key/secret fields below.
- Intelligence Center cards: each card becomes a `<Link>` to a concrete target route + filter. Examples:
  - "At-risk students" → `/admin/students?risk=high`
  - "Burnout detection" → `/admin/staff?burnout=true`
  - "Attendance dips" → `/admin/attendance?trend=declining`
  Cards that have no meaningful drilldown yet get a "View details" sheet with the top offending rows.

## Technical notes
- Schema changes go through one migration per batch with GRANTs + RLS.
- Photo uploads: new public storage buckets `staff-photos`, `gallery`. Signed URL for private student docs stays in existing `student-documents` bucket.
- Google Map: iframe uses the value in `schools.google_maps_embed_url`; sanitize `src` to `https://www.google.com/maps/embed?…` only.
- Button color unification: extend `Button` variants to remove `outline`/`secondary` variance where it renders blue — remap those sites to the `default` (primary) variant. No token color changes.

## Suggested order
1. Batch 1 (public site is what users see first)
2. Batch 3 (biggest data change — do before wiring intelligence deep links)
3. Batch 4
4. Batch 2 (polish sweep to catch anything the batches above introduced)

Reply with **"go batch 1"** (or list the batches you want, in order) and I'll implement. If you want me to just power through all four back-to-back, say **"do all batches"** — heads up it will burn a lot of credits in one go.
