# COREGRID — PHASE 04 RUNTIME BUILD MAP (Scholar Educational Reality Engine)

Status: PLAN ARTIFACT (authoritative execution map) — living document
Authority: architecture/phase-04-education-reality-engine.md (2,150 lines; 199 numbered contracts)
Version: 2026-09-04
Scope: Every Phase-04 contract item → concrete artifact (module/migration/test/functions),
each layered on CoreGrid platform (P33 kernel + P02/P03 L2 registries) — never standalone
Scholar, never hard-coded institution logic, never a duplicate engine.

---

## 0. Refined Directive (upgraded user prompt)

> Build the complete **CoreGrid Scholar Educational Reality Runtime**: an AI-native,
> configuration-driven, relationship-driven educational operating runtime able to model the
> diversity of African education (formal/informal/traditional/religious/vocational/technical/
> agricultural/apprenticeship/…).
>
> 1. **Platform-first**: every artifact consumes CoreGrid primitives — kernel
>    (`cg_entity/cg_relationship/cg_event/cg_observation`, `kernel/*`) and L2
>    (`cg_tenant`, `cg_identity`) — Scholar is the first runtime ON CoreGrid; nothing is an
>    independent subsystem.
> 2. **Configuration over code**: institution structures are data, never code branches.
> 3. **Africa-first / zero hard-coding**: no hidden Western defaults; no per-institution source.
> 4. **No duplication**: identity→P02, tenancy→P03, auth/trust→P08/P09, data→P14,
>    schedule-optimization→P12, twin→P16, hardware→P15, analytics→P18, automation→P17,
>    UI→P24. Phase 04 owns authoritative educational semantics + events only.
> 5. **Upgrade, don't rewrite**: existing education-*/academic-*/runtime modules and legacy
>    tables are upgraded into this platform frame — never discarded blindly.
> 6. **Ordered execution**: dependency order below; verify each cluster (typecheck + unit +
>    SQL-coherence + live DB) before the next. Nothing COMPLETE until consumed (§98).

---

## 1. Current inventory (2026-09-04)

Modules (UPGRADE): education-{core,curriculum,institution,governance,assessment,facilities},
academic-{core,mastery,pathways,risk}, scheduling-{core,constraints,availability,validator},
attendance-identity, runtime/scholar{,-events,-reality}. Tests: education/academic/scheduling/
runtime suites. Legacy DB: students, classes, grades, attendance(+_logs), academic_programs,
timetables(+_slots), lesson_plans, school_* tables. Platform live: kernel cg_* (validated),
L2 cg_tenant/cg_identity (validated), P08 gates, register-runtime + kernel-reality + L2 fns.
Gap: ~199 contract sections vs ~40 covered — this map closes each.

## 2. Conventions

- `frontend/src/lib/scholar/<module>.ts` → NEW P04 runtime typed models (pure + unit-tested).
- `frontend/src/lib/education-*.ts`, `runtime/*` → EXISTING modules (upgrade in place).
- `database/supabase/migrations/20260904*_scholar_*.sql` → domain schema; tenant-scoped;
  cross-layer refs to cg_tenant/cg_identity/cg_entity ids.
- Server functions → gated (P08) where a live surface exists.
- Row legend: [UPGRADE] reframe existing · [NEW] build · [BOUNDARY] consume other phase
  contract (no build) · [TEST] property/simulation suite.

---

## 3. Cluster A — School Builder & Dynamic Structure (§2,5,6,78–85,128–129,154–168,171,186)
| # | Contract | Status | Artifact |
|---|---|---|---|
| A1 | Level registry §5 | [NEW] | scholar/education-levels.ts + config schema + coherence test (no fixed hierarchy) |
| A2 | Programme hierarchy §6 | [NEW] | scholar/programme.ts (configurable programme tree + validation) |
| A3 | School builder §79–80 | [NEW] | scholar/school-builder.ts (construction commands, state machine) |
| A4 | Blueprint + versioning §81–82,128–129 | [NEW] | scholar/blueprint.ts (versioned/rollback-safe config snapshots) |
| A5 | Config validation §83 | [NEW] | scholar/config-validator.ts (missing/invalid/impossible checks) |
| A6 | Simulation hooks §84–85,171 | [NEW] | scholar/config-simulator.ts (scenario model; later P37 feed) |
| A7 | Safe defaults / no-assumption §161–162 | [NEW] | scholar/safe-defaults.ts + UnknownState marker |
| A8 | Adaptive config + discovery §159–160 | [NEW] | scholar/config-discovery.ts (progressive activation) |
| A9 | Reality drift/operational reality §163–165 | [NEW] | scholar/reality-validator.ts (via kernel events/observations) |
| A10 | Config governance + explainability §166–168 | [NEW] | scholar/config-governance.ts (preview/authorise/audit/version/override) |

## 4. Cluster B — Participation: Student/Staff/Groups/Guardians (§26–29,52,110–111)
| # | Contract | Status | Artifact |
|---|---|---|---|
| B1 | Student identity + profile §26–27 | [UPGRADE] | scholar/student-context.ts (over cg_identity; typed kernel entity) |
| B2 | Staff context + workload §28–29 | [UPGRADE] | scholar/staff-context.ts, scholar/workload.ts |
| B3 | Student grouping §52 | [NEW] | scholar/student-groups.ts |
| B4 | Guardians/family §110–111 | [UPGRADE] | scholar/guardians.ts (policy-driven; kernel edges) |

## 5. Cluster C — Structure: Programmes/Levels/Streams/Cohorts/Classes (§22–25,28)
| # | Contract | Status | Artifact |
|---|---|---|---|
| C1 | Cohort model §22 | [NEW] | scholar/cohort.ts (intake/cohort/class/stream/group/house/tutorial/practical/exam-group) |
| C2 | Class model §23 | [UPGRADE] | scholar/class.ts (level/programme/period/campus/room/assignments/subjects/timetable/policies) |
| C3 | Streams §24 | [NEW] | scholar/stream.ts (science/arts/commercial/technical/vocational/agricultural/custom) |
| C4 | Class flexibility §25 | [NEW] | scholar/class-flexibility.ts (learner in different groups per activity) |
| C5 | Level/class relationships over kernel | [NEW] | scholar/structure-graph.ts (cg_relationship projections: belongs-to/offers/enrolls/teaches) |

## 6. Cluster D — Curriculum Engine (§7–21,178)
| # | Contract | Status | Artifact |
|---|---|---|---|
| D1 | Curriculum core (frameworks/versioning/multi/national) §7–10 | [UPGRADE] | education-curriculum.ts → typed over kernel; add frameworks/versions/authority/source/migration rules |
| D2 | Religious education config §11 | [NEW] | scholar/curriculum-religious.ts (islamic/qur'anic/christian/madrasa/faith; never one default) |
| D3 | Traditional & community education §12 | [NEW] | scholar/curriculum-traditional.ts (indigenous/oral/cultural/local-language/community apprenticeship) |
| D4 | Vocational education §13 | [NEW] | scholar/curriculum-vocational.ts (trades/apprenticeship/workshops/competency/industry/certifications) |
| D5 | Agricultural education §14 | [NEW] | scholar/curriculum-agricultural.ts |
| D6 | Technical education §15 | [NEW] | scholar/curriculum-technical.ts |
| D7 | Entrepreneurship education §16 | [NEW] | scholar/curriculum-entrepreneurship.ts |
| D8 | Language model + multilingual §17–18 | [NEW] | scholar/languages.ts (instructional/administrative/local/examination/communication; per-class) |
| D9 | Subject model (identity/code/curriculum/dept/levels/objectives/competencies/assessment/facilities/equipment/teachers) §19 | [UPGRADE] | scholar/subject.ts |
| D10 | Cross-subject learning §20 | [NEW] | scholar/subject-relationships.ts |
| D11 | Programme definition §21 | [NEW] | scholar/programme-definition.ts (purpose/duration/curriculum/levels/subjects/competencies/assessments/progression/certification) |
| D12 | Curriculum evolution §178 | [NEW] | scholar/curriculum-evolution.ts (new curriculum never destroys history) |

## 7. Cluster E — Time: Calendar/Periods/Hours/Shifts (§30–34)
| # | Contract | Status | Artifact |
|---|---|---|---|
| E1 | Academic periods §30 | [NEW] | scholar/academic-period.ts (annual/semester/term/trimester/quarter/custom; nested) |
| E2 | School calendar §31 | [NEW] | scholar/calendar.ts (instructional days/holidays/exams/events/breaks/training/public holidays/closures) |
| E3 | Flexible school hours §32 | [NEW] | scholar/school-hours.ts (opening/closing/periods/breaks/assembly/lunch/prayer/boarding) |
| E4 | Multi-shift + shift operation §33–34 | [NEW] | scholar/shifts.ts (morning/afternoon/evening/night/rotating/weekend; per-shift staff/students/facilities/schedules/policies) |
| E5 | Calendar/period sanity (conflict-free ranges) | [TEST] | scholar/academic-period.test.ts + calendar.test.ts |

## 8. Cluster F — Timetable & Assignments (§35–37,191)
| # | Contract | Status | Artifact |
|---|---|---|---|
| F1 | Timetable entity model §35–36 | [UPGRADE] | scheduling-core.ts + timetable.functions.ts (inputs: availability/rooms/subjects/groups/shifts/distance/transport/equipment/policies) |
| F2 | Assignment engine §37 | [UPGRADE] | scheduling-validator.ts / new scholar/assignment.ts (teachers/students/classes/rooms/subjects/equipment/supervisors) |
| F3 | Optimization boundary §191 | [BOUNDARY] | P12 consumes constraints; no solver inside P04 |

## 9. Cluster G — Attendance & Learning Activities (§38–39,44–45)
| # | Contract | Status | Artifact |
|---|---|---|---|
| G1 | Attendance model (student/staff/class/event/practical/boarding) §38 | [UPGRADE] | attendance fns + scholar/attendance-model.ts (kernel eventDraft projections) |
| G2 | Attendance events §39 | [UPGRADE] | scholar/attendance-events.ts (present/absent/late/excused/early-departure/remote/field) |
| G3 | Learning activities §44 | [NEW] | scholar/learning-activities.ts (lesson/practical/lab/workshop/field/farm/community/religious/sports/club/exam/project) |
| G4 | Lesson model §45 | [UPGRADE] | scholar/lesson.ts (subject/teacher/class/time/location/objectives/resources/activities/attendance/evidence) |

## 10. Cluster H — Assessment, Grading, Promotion (§40–43)
| # | Contract | Status | Artifact |
|---|---|---|---|
| H1 | Assessment model §40 | [UPGRADE] | education-assessment.ts (assignment/quiz/test/exam/practical/oral/project/presentation/competency) |
| H2 | Grading config §41 | [NEW] | scholar/grading.ts (numerical/percentage/letter/bands/competency/pass-fail/mastery/institution-defined) |
| H3 | Promotion/progression §42–43 | [NEW] | scholar/progression.ts (grades/competencies/attendance/subjects/exams/policy; institution states) |

## 11. Cluster I — Resources, Assignments, Examinations (§45–51,133)
| # | Contract | Status | Artifact |
|---|---|---|---|
| I1 | Lesson resources §46 | [NEW] | scholar/lesson-resources.ts (textbooks/digital/lab/devices/worksheets/videos/simulations/materials) |
| I2 | Assignment model + lifecycle §47–48 | [NEW] | scholar/assignment-lifecycle.ts (individual/group/practical/project/research/field) |
| I3 | Examination engine §49 | [NEW] | scholar/examination.ts (internal/continuous/practical/oral/external/institution-defined) |
| I4 | Exam security §50 | [NEW] | scholar/examination-security.ts (candidate verification/seating/invigilation/rooms/secure papers/incidents) |
| I5 | Practical examinations §51 | [NEW] | scholar/practical-examination.ts (labs/workshops/farms/kitchens/clinics/technical rooms) |
| I6 | Event idempotency §133 | [NEW] | scholar/event-contracts.ts (kernel eventDraft wrappers; dedup) |

## 12. Cluster J — SEN, Counselling, Welfare, Safeguarding (§53–56)
| # | Contract | Status | Artifact |
|---|---|---|---|
| J1 | SEN accommodations §53 | [NEW] | scholar/special-needs.ts (extra time/alternative assessment/accessibility/support staff/assistive tech) |
| J2 | Counselling §54 | [NEW] | scholar/counselling.ts (counsellor/appointment/case/referral/intervention; strict access) |
| J3 | Student welfare §55 | [NEW] | scholar/welfare.ts (cases/referrals/support/emergency contacts/interventions) |
| J4 | Safeguarding §56 | [NEW] | scholar/safeguarding.ts (cases/incidents/escalation/responsible officers/restricted evidence) |

## 13. Cluster K — Boarding, Transport, Facilities, Devices, Environment (§57–76,64–69)
| # | Contract | Status | Artifact |
|---|---|---|---|
| K1 | Boarding §57 | [NEW] | scholar/boarding.ts (dormitories/houses/beds/supervisors/schedules/meals/attendance/incidents) |
| K2 | Transport §58 | [UPGRADE] | bus-tracking/driver-portal → scholar/transport.ts (routes/buses/drivers/stops/assignments/schedules/capacity) |
| K3 | Facilities + capability §59,63 | [UPGRADE] | education-facilities.ts → scholar/facility.ts (types + declared capabilities) |
| K4 | Buildings/blocks/rooms §60–62 | [NEW] | scholar/space.ts (building/block/room/capacity/type/equipment/devices/env) |
| K5 | Resource management §64–65 | [NEW] | scholar/resources.ts (books/devices/furniture/equipment/tools/vehicles/lab assets) |
| K6 | Device context §66–68 | [NEW] | scholar/device-context.ts (identity/owner/location/purpose; P15 boundary) |
| K7 | Environment model §69 | [NEW] | scholar/environment.ts (temp/occupancy/lighting/power/connectivity/air/noise alerts where P15 supports) |
| K8 | Physical↔digital mapping §70 | [NEW] | scholar/physical-digital-map.ts (physical entities carry digital references) |
| K9 | Facility scheduling/conflicts/maintenance §74–76 | [NEW] | scholar/facility-availability.ts (double-booking/capacity/incompatible/maintenance) |

## 14. Cluster L — Graphs, Context, History (§71–73,112–115,119–127)
| # | Contract | Status | Artifact |
|---|---|---|---|
| L1 | Organisational/educational/resource graphs §71–73 | [NEW] | scholar/reality-graph.ts (cg_relationship projections: teaches/attends/belongs-to/…§123) |
| L2 | Communication/notification context §112–113 | [NEW] | scholar/communication-context.ts |
| L3 | Educational workflows §114–115 | [BOUNDARY] | P17 executes; P04 supplies triggers/context |
| L4 | Memory/search context §119–121 | [NEW] | scholar/search-context.ts (AI never bypasses auth) |
| L5 | Knowledge facts §122–123 | [NEW] | scholar/knowledge-facts.ts (structured facts → P33/P36 graph) |
| L6 | Temporal/history/snapshots/time-machine §124–127 | [NEW] | scholar/history.ts (validity periods; historical states; snapshots) |

## 15. Cluster M — Policies, Privacy, Audit (§77,134–141)
| # | Contract | Status | Artifact |
|---|---|---|---|
| M1 | School operating policies §77 | [UPGRADE] | scholar/policies.ts (attendance/grading/promotion/discipline/academic/facility/device/communication) |
| M2 | Tenant isolation + authorization §134–135 | [BOUNDARY] | consume P03/P08/P09 |
| M3 | Privacy/child-data/audit/retention/residency §136–140 | [BOUNDARY]+[NEW] | scholar/privacy.ts (purpose-limits, child-data, retention, residency) |
| M4 | Security consumption §141 | [BOUNDARY] | identity/auth/trust/encryption/audit/policy from dedicated phases |

## 16. Cluster N — Offline, Community, Oversight, Evidence, Portfolios (§86–109,158)
| # | Contract | Status | Artifact |
|---|---|---|---|
| N1 | Offline/local queues/conflict/bandwidth/power §86–90 | [NEW] | scholar/offline.ts (queue/reconcile/low-bandwidth/power modes) |
| N2 | Community/shared facilities/networks §91–93 | [NEW] | scholar/community.ts (sharing without tenant breach) |
| N3 | Oversight/inspection/accreditation/certification §94–97 | [NEW] | scholar/oversight.ts |
| N4 | Student documents §98–99 | [NEW] | scholar/documents.ts |
| N5 | Evidence + learning evidence graph §100–101 | [NEW] | scholar/evidence.ts |
| N6 | Competency + mastery §102–103 | [NEW] | scholar/competency.ts |
| N7 | Student/teacher portfolios §104–105 | [NEW] | scholar/portfolio.ts |
| N8 | Events/clubs/houses/community engagement §106–109 | [NEW] | scholar/co-curricular.ts |
| N9 | School import §158 | [NEW] | scholar/school-import.ts (CSV/SIS/HR/gov/manual → config) |

## 17. Cluster O — Contracts, Tests, Evolution, Boundaries (§130–133,142–153,169–180,184–199)
| # | Contract | Status | Artifact |
|---|---|---|---|
| O1 | API/event contracts §131–132 | [NEW] | scholar/api-contracts.ts + gated server functions per surface |
| O2 | Performance/scale/availability/degraded mode §142–145 | [BOUNDARY] | P05/P14/P21; runtime operates without AI/analytics |
| O3 | AI context + AI safety §116–118,146 | [NEW] | scholar/ai-context.ts + ai-safety.ts |
| O4 | Twin/hardware/analytics/scheduling/learning/UX/automation boundaries §147–153 | [BOUNDARY] | consume P16/P15/P18/P12/P11/P24/P17 only |
| O5 | Simulation suites §171–172 | [TEST] | scholar/simulation-tests (12+ African archetypes) |
| O6 | Property tests §170 | [TEST] | scholar/property-tests |
| O7 | Performance/offline/device tests §173–175 | [TEST] | perf/offline/device suites |
| O8 | Schema/curriculum/structure evolution §176–180 | [NEW] | versioned migrations; never destroy history |
| O9 | Directives + completion test §184–199 | [GOV] | this map is the directive; completion = configure an unfamiliar African institution end-to-end |

## 18. Execution order (dependency-aware)
1. Cluster A (builder/config/blueprint/validation) — consumed by all
2. Cluster E (time: periods/calendar/hours/shifts)
3. Cluster C + B (structure + participation over L2 identity/tenant)
4. Cluster D (curriculum/subjects/languages/specialisations)
5. Cluster H (assessment/grading/progression)
6. Clusters G + I (attendance/lessons/activities/exams)
7. Clusters K + L (space/facilities/transport/boarding + graphs/history)
8. Clusters J + M + N (SEN/welfare/safeguarding, policies/privacy, evidence/community/offline)
9. Cluster O (contracts/tests) runs continuously per cluster
Each cluster: typed module(s) + unit/SQL-coherence tests + schema migration (where stateful) +
live DB validation (dev project) + registry/ledger rows. Nothing independent — every artifact
imports kernel/L2 or existing gated surfaces.

## 19. Definition of Done (per cluster)
Implementation exists · typed over kernel/L2 · tests pass (incl. coherence) · migration applied
+ validated live · P08 gating where server-facing · no duplicate engine · registry + PROGRESS
updated · consumed by ≥1 consumer (§98) before any COMPLETE claim.
