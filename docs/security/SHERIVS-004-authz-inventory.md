# SHERIVS-004 AuthZ Inventory (V1 scope)

Method: pattern scan of every `createServerFn` (43 files, ~97 fns) + manual read of high-risk files. All fns except those noted use `requireSupabaseAuth`. school_id is derived from the session/actor, never the client. Verdicts: OK = verified by reading; OK* = gate present, verified by pattern scan only (not line-by-line); FIXED = changed in this pass.

| fn | file (frontend/src/lib/...) | auth | scope check | verdict | fix |
|----|------|------|-------------|---------|-----|
| loadPlatformAuditTrail, loadKernelEventOutboxState | command-centre.functions.ts | middleware | requirePlatformSuperAdmin | OK* | - |
| grantConsent, withdrawConsent, submitDataSubjectRequest, transitionDataSubjectRequest, executeExport, executeErasure | compliance/consent.functions.ts, dsr.functions.ts | middleware | `loadActor` (actor school/role) | OK* | - |
| uploadStudentMedia | compliance/student-media.functions.ts | middleware | staff + school match, zod enum type, size, consent | OK | - |
| recordFoundationLoop | foundation-loop.functions.ts | middleware | requireSchoolAdminScope | OK* | - |
| registerIdentity, listIdentities | identity-registry.functions.ts | middleware | requireSchoolAdminScope | OK* | - |
| writeEntity, writeRelationship, writeObservation, recordEvent | kernel-reality.functions.ts | middleware | requireSchoolAdminScope | OK* | - |
| provisionOrganization | onboarding/provision-organization.functions.ts | middleware | requirePlatformSuperAdmin | OK* | - |
| getMyProfile, updateMyProfile, setDigitalTwinOptOut | profile.functions.ts | middleware | self (`userId`), zod whitelist | OK | - |
| dispatchPushToUsers | push.functions.ts | middleware | was: any member; now requireStaffContext("teaching_staff") | FIXED | + test |
| sendTestPush | push.functions.ts | middleware | self only | OK | - |
| registerDomainRuntime, transitionRuntimeStatus | register-runtime.functions.ts | middleware | requirePlatformSuperAdmin | OK* | - |
| generateTeacherCheckQr | runtime/scholar/attendance.functions.ts | middleware | requireSchoolAdminScope | OK* | - |
| teacherCheckWithQr, markClassAttendance | attendance.functions.ts | middleware | requireStaffContext | OK* | - |
| getMyBus, updateBusLocation, setMyBusStatus, getMyDriverBus, pushDriverLocation, setDriverBusStatus, notifyBusArrival | bus-tracking / driver-portal.functions.ts | middleware | driver identity + own bus/school (read) | OK | - |
| provisionDemoEnterprise | demo-provision.functions.ts | none (env gate `ALLOW_DEMO_PROVISIONING`) | n/a | ACCEPTED (Medium) | existing tests; keep off in prod |
| saveTwinConfig | digital-twin.functions.ts | middleware | requireSchoolAdminScope | OK | - |
| placeTwinCall | digital-twin.functions.ts | middleware | requireSchoolAdminScope; TwiML/phone | FIXED | escapeXmlText + phone regex |
| getExpenseInsights, draftLessonPlan | expense-insights / lesson-plan-ai | middleware | requireStaffContext | OK* | - |
| upsertSchoolMeals, upsertSchoolTransport | facilities.functions.ts | middleware | school from actor, admin check via `resolveRoleGate`/RLS | OK (read) | - |
| broadcastMessage | messages-broadcast.functions.ts | middleware | requireStaffContext, recipients limited to caller school | OK | - |
| sendNotificationDigests; notifyGradesPublished, notifyFeesDue, pushNotification, notifyCalendarEvent, unlockFaceAccount | notification-digest / notifications-fanout | middleware | requireSchoolAdminScope | OK | - |
| getOrganizationProfile, saveOrganizationProfile | org-profile.functions.ts | middleware | requireSchoolAdminScope | OK* | - |
| initFeePayment | paystack.functions.ts | middleware | was: any school member could pay any fee; now `canInitiateFeePayment`; amount computed server-side from fee row | FIXED | + test |
| verifyFeePayment | paystack.functions.ts | middleware | RLS visibility by reference, then `settlePaystackCharge` | FIXED | amount/currency/reference checks |
| loadAuditOverview, loadPayrollOverview, loadFinancialReportsOverview, loadExtracurricularOverview | portal-overview.functions.ts | middleware | requireSchoolAdminScope | OK* | - |
| checkPlatformBootstrap | provisioning.functions.ts | middleware | none (reveals super-admin existence) | LOW, accepted | - |
| claimFirstSuperAdmin | provisioning.functions.ts | middleware | one-time bootstrap guard | OK (read) | - |
| updateSchoolPlan, resetSchoolAdminPassword | provisioning.functions.ts | middleware | inline super-admin check (read) | OK | - |
| getMyFeatureAccess, getMyRealityRoles, getMyPrimaryWorkforcePosition | scholar-*.functions.ts | middleware | self | OK | - |
| previewTenantExperience | scholar-feature-access | middleware | requireSchoolAdminScope | OK* | - |
| scholarFoundationLoop | scholar-foundation-loop | middleware | actor-derived | OK* | - |
| publishInstitutionOperatingModel, get/list InstitutionOperatingModel* | scholar-institution-config | middleware | requireSchoolAdminScope | OK* | - |
| assignRealityRole, endRealityRoleAssignment, listTenantRoleAssignments, listTenantRoleGrants, grantRealityCapability, revokeRealityCapability | scholar-role-assignments | middleware | requireSchoolAdminScope | OK* | - |
| updateSchoolSettings | school-settings.functions.ts | middleware | requireSchoolAdminScope, zod whitelist | FIXED | http(s)-only URLs, safe map embed |
| createStaffAccount | staff-accounts.functions.ts | middleware | resolveRoleGate; cross-tenant takeover of existing auth user | FIXED (Critical) | refuse super_admins / other-school users; crypto passwords |
| resetStaffPassword | staff-accounts.functions.ts | middleware | resolveRoleGate + same-school | OK | - |
| updateStaffPrivilege | staff-privilege.functions.ts | middleware | requireSchoolAdminScope, zod whitelist | OK | - |
| inviteTeacher, setTeacherActive | teachers.functions.ts | middleware | requireSchoolAdminScope | FIXED (temp password via crypto) | - |
| generateTimetableDraft, saveTimetable | timetable.functions.ts | middleware | requireSchoolAdminScope | OK* | - |
| listWorkforcePositions, assignWorkforcePosition, endWorkforcePosition | workforce-positions | middleware | requireSchoolAdminScope | OK | - |
| registerTenant, listTenants | tenant-registry.functions.ts | middleware | requirePlatformSuperAdmin | OK* | - |
| launchWorkerMission | workforce/worker-launch.functions.ts | middleware | `requirePlatformSuperAdmin` inside worker-launch-runtime.server | OK* | - |

## Server routes

| route | auth | verdict | fix |
|-------|------|---------|-----|
| `POST /api/public/webhooks/paystack` | HMAC-SHA512 signature over raw body, key from env (unchanged) | FIXED | fail closed 503, constant-time compare, body cap, IP rate limit, amount/currency/reference checks, idempotent settlement |
| `POST /api/public/audit.password-reset` | none (pre-auth by design) | PARTIAL | IP rate limit 30/min; client-supplied user_id/email still unauthenticated (Medium) |
| sitemap, manifest, health (GET) | public | OK | - |

No Resend/Twilio/Vapi inbound webhook routes exist in the repo.
