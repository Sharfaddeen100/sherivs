PHASE 25 — INSTITUTIONAL ONBOARDING, ADMINISTRATION & WORKFORCE IDENTITY PLATFORM
File:architecture/phase-25-institutional-onboarding-administration-workforce-identity.md
Status: CoreGrid v2 Scope-Locked Architecture
Phase: 25
Previous Phase: Phase 24 — CoreGrid Experience & Design Intelligence Platform
Next Phase: Phase 26 — CoreGrid AI Intelligence Layer

───

A. IDENTITY
Phase 25 is the Institutional Onboarding, Administration & Workforce Identity Platform.
It is the subsystem responsible for transforming a newly created educational institution from:
an institution record
into:
a securely configured, policy-driven, operational CoreGrid environment.
It governs the institutional lifecycle from initial school creation through:
• institutional onboarding
• institutional profile configuration
• administrator provisioning
• staff account creation
• workforce onboarding
• role assignment
• contextual assignment
• policy assignment
• permission assignment
• workspace provisioning
• invitation management
• onboarding journeys
• staff activation
• attendance identity enrollment
• institutional organizational structure
• campus and premises configuration
• shift configuration
• language configuration
• timezone configuration
• institutional operating policies
• workforce lifecycle management

───

B. CORE PRINCIPLE
CoreGrid must not be built around fixed portals.
It must be built around:
text
IDENTITY
+
ROLE
+
CONTEXT
+
PERMISSIONS
+
POLICIES
+
INSTITUTION
+
LOCATION
+
WORKSPACE
+
DEVICE
+
TIME
+
CURRENT TASK
=
DYNAMIC USER EXPERIENCE

A user does not receive a workspace because their username says "teacher".
A user receives a workspace because the institution has assigned:
• an identity
• one or more roles
• a context
• permissions
• policies
• organizational relationships
• applicable locations
• applicable schedules
• applicable workflows
The workspace is then dynamically composed.

───

C. PRIMARY OBJECTIVES
Phase 25 must allow CoreGrid to support:
• a single-school institution
• a large private school group
• public schools
• government-owned institutions
• universities
• colleges
• vocational institutions
• academies
• boarding schools
• day schools
• mixed institutions
• multi-campus institutions
• multi-premises institutions
• multi-shift institutions
• multilingual institutions
• institutions operating across timezones
• school networks
• school groups
• education districts
• government education organizations
without creating separate architectural systems for each.

───

D. INSTITUTION CREATION MODEL
The CoreGrid platform team creates an institution.
Initial creation produces:
text
Institution
   │
   ├── Institutional Profile
   ├── Tenant
   ├── Institutional Identity
   ├── Default Administrative Policy Set
   ├── Initial Administrator
   └── Initial Administrative Workspace

The initial administrator becomes the institution's primary administrative authority subject to CoreGrid's platform-level controls.

───

E. COREGRID PLATFORM VS INSTITUTION AUTHORITY
There must be a strict distinction between:
CoreGrid Platform Authority
Controls:
• platform security
• platform infrastructure
• platform-wide policies
• legal/platform requirements
• subscription
• platform availability
• platform-level support
• platform-level compliance
Institutional Authority
Controls:
• institutional users
• institutional roles
• institutional permissions
• institutional policies
• institutional workspaces
• organizational structure
• staff assignments
• institutional workflows
• institutional schedules
The school administrator must never be able to override platform-level security controls.

───

F. INSTITUTIONAL PROFILE
Each institution must have a structured profile.
Possible fields include:
• legal name
• display name
• institution type
• ownership type
• registration information
• accreditation information
• country
• region
• state/province
• local government area
• physical locations
• postal information
• contact information
• official email domains
• website
• academic calendar
• operating days
• operating hours
• languages
• currency
• timezone
• institutional policies
• campuses
• premises
• school sections
• departments

───

G. INSTITUTION TYPES
The architecture must support configurable institution types rather than hard-coded assumptions.
Examples:
• nursery
• primary
• secondary
• senior secondary
• sixth-form equivalent
• technical school
• vocational school
• college
• university
• polytechnic
• teacher-training institution
• religious school
• private school
• public school
• community school
• boarding school
• day school
• special-needs institution
• examination centre
• education network

───

H. AFRICAN EDUCATION COMPLEXITY MODEL
The system must explicitly support the operational diversity found across African education systems.
Examples include:
• national curriculum differences
• state/provincial curriculum differences
• regional examination structures
• public/private distinctions
• faith-based governance
• school ownership groups
• government oversight
• school boards
• parent associations
• multiple academic sessions
• boarding structures
• day structures
• house systems
• prefect systems
• department structures
• multiple campuses
• rural/urban deployment differences
• intermittent connectivity
• shared devices
• BYOD
• mobile-first workflows
• multilingual institutions
• local-language support
• varying staff technology literacy
• mixed digital maturity
• paper-to-digital migration
CoreGrid must model these as configuration rather than assumptions.

───

I. SCHOOL GROUPS
A school group may contain:
text
School Group
   │
   ├── Institution A
   ├── Institution B
   ├── Institution C
   └── Institution D

Group-level administration may exist where explicitly authorized.
Group administration must not automatically grant unrestricted access to every institution.

───

J. MULTI-CAMPUS
Institutions may contain:
• campuses
• branches
• satellite locations
• boarding campuses
• examination centres
• administrative offices
• sports facilities
• laboratories
• remote learning centres
Every location should have its own configuration where necessary.

───

K. MULTI-PREMISES
A campus may contain:
• buildings
• blocks
• classrooms
• laboratories
• libraries
• offices
• halls
• dormitories
• sports facilities
• medical facilities
• transport facilities
• security checkpoints

───

L. LOCATION HIERARCHY
text
Institution
  ↓
Campus
  ↓
Premises
  ↓
Building
  ↓
Floor
  ↓
Room
  ↓
Resource

The hierarchy must be configurable.

───

M. MULTI-SHIFT
Support:
• morning
• afternoon
• evening
• night
• weekend
• rotating
• custom institutional shifts
Users may belong to different shifts.
Policies may differ by shift.

───

N. MULTI-TIMEZONE
Institutions may operate across multiple timezones.
Every timestamp must have:
• canonical UTC representation
• display timezone
• user timezone where appropriate
• institution timezone
• location timezone where appropriate

───

O. MULTILINGUAL INSTITUTIONS
Support:
• institutional default language
• user language
• regional language
• instructional language
• administrative language
Language must be configuration-driven.

───

P. ROLE MODEL
Roles are configuration entities.
A role contains:
• identity
• name
• description
• purpose
• capabilities
• permissions
• policies
• organizational scope
• location scope
• time scope
• data scope
• workflow scope

───

Q. ROLE EXAMPLES
The architecture must accommodate roles such as:
Executive
• owner
• proprietor
• board member
• chairman
• executive director
• managing director
• chief executive
• principal
• head teacher
• vice principal
• deputy head
Academic
• teacher
• lecturer
• instructor
• tutor
• teaching assistant
• department head
• subject coordinator
• curriculum coordinator
• academic director
• examination officer
• assessment officer
• librarian
• laboratory supervisor
• research coordinator
Student Services
• counsellor
• welfare officer
• student affairs officer
• safeguarding officer
• special-needs coordinator
• boarding supervisor
• house parent
• dormitory supervisor
Administration
• administrator
• receptionist
• secretary
• registrar
• admissions officer
• records officer
• compliance officer
Human Resources
• HR administrator
• HR manager
• recruitment officer
• payroll officer
• staff welfare officer
• workforce administrator
Finance
• accountant
• bursar
• finance manager
• cashier
• procurement officer
• payroll administrator
Operations
• operations manager
• facilities manager
• transport manager
• maintenance officer
• security officer
• inventory manager
• estate manager
Technology
• IT administrator
• technology coordinator
• support operator
• device administrator
• integration administrator
Communication
• communications officer
• public relations officer
• media officer
Government / Oversight
• inspector
• district officer
• ministry officer
• education authority officer
• regulator
These are examples, not hard-coded roles.

───

R. CUSTOM ROLES
Administrators must be able to create custom roles.
Custom roles must be assembled from authorized capabilities rather than arbitrary code.

───

S. ROLE COMPOSITION
A user may have multiple roles.
Example:
text
User
 ├── Teacher
 ├── Department Head
 └── Examination Officer

The authorization engine determines the effective permissions.

───

T. ROLE HIERARCHY
Support:
text
Base Role
   ↓
Derived Role
   ↓
Custom Role

Inheritance must be explicit.

───

U. ROLE CONFLICTS
The system must detect:
• conflicting permissions
• incompatible duties
• excessive privilege
• separation-of-duty violations

───

V. CONTEXT MODEL
A role alone is insufficient.
Context may include:
• institution
• campus
• department
• class
• subject
• shift
• academic session
• project
• workspace
• assigned students
• assigned resources
• time period
• geographic location

───

W. CONTEXT EXAMPLE
A teacher may have:
text
Role:
Teacher

Institution:
School A

Campus:
Main Campus

Department:
Mathematics

Subjects:
Mathematics

Classes:
SS2A
SS2B

Shift:
Morning

Policies:
Teacher Standard Policy

Permissions:
Assigned Academic Permissions

Their workspace is generated from this context.

───

X. POLICY ENGINE
Policies determine:
• what users may do
• when they may do it
• where they may do it
• which data they may access
• which workflows they may execute
• which actions require approval

───

Y. POLICY TYPES
Support:
• access policies
• data policies
• workflow policies
• communication policies
• attendance policies
• financial policies
• academic policies
• device policies
• AI policies
• security policies
• privacy policies
• location policies
• time policies
• approval policies

───

Z. POLICY ASSIGNMENT
Policies may be assigned at:
• institution
• group
• campus
• department
• role
• user
• workspace
• resource
• workflow
with explicit precedence rules.

───

AA. POLICY PRECEDENCE
The policy engine must define deterministic conflict resolution.
Never rely on UI assumptions.

───

AB. PERMISSION MODEL
Permissions should be granular.
Examples:
text
student.read
student.create
student.update

attendance.read
attendance.record
attendance.correct

finance.read
finance.create
finance.approve

document.read
document.create
document.share

ai.use
ai.generate
ai.execute
ai.approve


───

AC. LEAST PRIVILEGE
Users receive only the capabilities required for their assigned context.

───

AD. JUST-IN-TIME ACCESS
Support temporary privileges where institutionally authorized.
Every temporary privilege requires:
• reason
• issuer
• duration
• scope
• audit trail

───

AE. ADMINISTRATOR ACCOUNT
The institution's initial administrator receives:
• administrative identity
• administrative workspace
• institution configuration
• workforce management
• policy management
• role management
• onboarding management
subject to platform constraints.

───

AF. ADMINISTRATOR DASHBOARD
The dashboard should dynamically surface:
• institution status
• onboarding progress
• pending invitations
• staff count
• role distribution
• security status
• attendance status
• policy status
• operational alerts
• unresolved issues
• recommended configuration

───

AG. ADMINISTRATIVE COMMAND CENTRE
Administrators should be able to:
• create users
• invite users
• suspend users
• reactivate users
• assign roles
• assign policies
• assign contexts
• create departments
• create campuses
• configure shifts
• manage workspaces
• manage onboarding
• inspect access
• review audit events

───

AH. HR ACCOUNT CREATION
An administrator may create an HR role.
The HR account must receive only the capabilities explicitly assigned.
Example:
text
HR Role
+
HR Context
+
HR Policies
+
HR Permissions
=
HR Workspace


───

AI. HR WORKSPACE
HR workspace may dynamically include:
• workforce directory
• recruitment
• onboarding
• staff records
• leave
• attendance
• training
• performance
• contracts
• HR workflows
Only features authorized by policy appear.

───

AJ. DYNAMIC WORKSPACE GENERATION
No hard-coded portal architecture.
Instead:
text
Identity
   ↓
Role Resolver
   ↓
Context Resolver
   ↓
Permission Resolver
   ↓
Policy Resolver
   ↓
Capability Resolver
   ↓
Workspace Composer
   ↓
Personalized Workspace


───

AK. WORKSPACE COMPOSITION
A workspace consists of:
• navigation
• modules
• widgets
• actions
• workflows
• dashboards
• AI capabilities
• notifications
• contextual tools
all dynamically resolved.

───

AL. WORKSPACE REGISTRY
Maintain a registry of capabilities.
Example:
text
Capability
 ├── identity
 ├── attendance
 ├── academic
 ├── finance
 ├── communication
 ├── analytics
 ├── AI
 └── automation


───

AM. NO HARDCODED PORTALS
Do not create:
text
TeacherPortal
AdminPortal
HRPortal
FinancePortal

as isolated architectural applications.
Instead create:
text
Capability
+
Policy
+
Role
+
Context
→
Workspace


───

AN. INVITATION ENGINE
When an administrator creates a staff account:
text
Create Identity
      ↓
Assign Role
      ↓
Assign Context
      ↓
Assign Policies
      ↓
Provision Workspace
      ↓
Generate Invitation
      ↓
Send Invitation
      ↓
Activate Account
      ↓
Start Onboarding


───

AO. INVITATION CHANNELS
Support:
• email
• SMS
• secure invitation links
• institutional identity providers
• QR-based activation where appropriate

───

AP. INVITATION SECURITY
Invitation tokens must:
• expire
• be single-use
• be cryptographically secure
• be revocable
• be auditable

───

AQ. INVITATION EMAIL
The invitation should communicate:
• institution
• inviter
• assigned role
• activation instructions
• expiration
• security guidance
• support information
Do not expose unnecessary permissions.

───

AR. ACCOUNT ACTIVATION
Activation may require:
• invitation verification
• identity verification
• password
• PIN
• supported device authentication
• required institutional information
• biometric enrollment where legally and operationally appropriate

───

AS. NOVICE EXPERIENCE
Every newly activated staff member receives a guided experience.
The onboarding system should know:
• role
• context
• policies
• permissions
• workspace
• institution
• device
and construct the onboarding journey dynamically.

───

AT. NOVICE JOURNEY
text
WELCOME
 ↓
IDENTITY
 ↓
ROLE
 ↓
CONTEXT
 ↓
WORKSPACE
 ↓
KEY CAPABILITIES
 ↓
FIRST TASK
 ↓
GUIDED ACTION
 ↓
CONFIRMATION
 ↓
NEXT RECOMMENDATION


───

AU. GUIDED ONBOARDING
Support:
• walkthroughs
• contextual explanations
• interactive tutorials
• recommended actions
• safe defaults
• progressive complexity
• contextual help

───

AV. PROGRESSIVE COMPLEXITY
New users see essential functionality first.
Advanced capabilities become visible as:
• competence increases
• role requires them
• user requests them
• administrator enables them

───

AW. ROLE-SPECIFIC ONBOARDING
A teacher should not receive the same onboarding as:
• HR
• accountant
• administrator
• security officer
• principal
The underlying onboarding engine remains shared.

───

AX. CONTEXT-SPECIFIC ONBOARDING
A mathematics teacher in Campus A may receive different onboarding from a mathematics teacher in Campus B if their policies or contexts differ.

───

AY. POLICY-AWARE ONBOARDING
If a policy prohibits an action, the onboarding system must not teach the user to perform it.

───

AZ. FIRST-TASK SYSTEM
Every new user should receive one or more safe initial tasks appropriate to their role.

───

BA. ONBOARDING PROGRESS
Track:
• started
• completed
• skipped
• deferred
• failed
• retried

───

BB. ONBOARDING RESUME
Users can continue onboarding after:
• logout
• device change
• connection loss
• interruption

───

BC. STAFF DIRECTORY
Provide a searchable institutional workforce directory.
Display only authorized fields.

───

BD. STAFF LIFECYCLE
Support:
text
INVITED
 ↓
ACTIVATING
 ↓
ACTIVE
 ↓
SUSPENDED
 ↓
ON_LEAVE
 ↓
TRANSFERRED
 ↓
DEACTIVATED
 ↓
ARCHIVED


───

BE. TRANSFER MANAGEMENT
Staff may move:
• department
• campus
• role
• shift
• institution
• school group
Permission recalculation must occur automatically.

───

BF. ROLE CHANGE
Changing a role must trigger:
• permission recalculation
• policy recalculation
• workspace recalculation
• onboarding update where necessary
• audit event

───

BG. POLICY CHANGE
Policy changes must propagate safely.
Existing sessions must be evaluated according to security policy.

───

BH. DEACTIVATION
Deactivation must:
• revoke access
• invalidate sessions where required
• preserve authorized records
• preserve audit history
• preserve legal retention requirements

───

BI. STAFF OFFBOARDING
Support:
• access revocation
• device revocation
• session termination
• workspace closure
• asset return
• handover
• workflow reassignment
• data ownership reassignment

───

BJ. ORGANIZATIONAL STRUCTURE
Support:
• departments
• faculties
• schools
• units
• offices
• committees
• teams
• houses
• clubs
• projects

───

BK. REPORTING RELATIONSHIPS
Model:
• manager
• supervisor
• department head
• principal
• director
• HR authority
These relationships must not automatically imply permissions.

───

BL. SEPARATION OF DUTIES
Support institutional controls such as:
text
Requester
   ≠
Approver
   ≠
Executor

where policy requires it.

───

BM. DUAL CONTROL
Critical workflows may require:
• two-person approval
• multiple administrators
• financial approval chains
• security approval

───

BN. ATTENDANCE IDENTITY
Phase 25 may provide identity orchestration for attendance.
It does not own the authoritative attendance ledger if that belongs to another phase.

───

BO. ATTENDANCE FLOW
Example:
text
Staff
 ↓
Scan QR
 ↓
Attendance Session Validation
 ↓
Identity Verification
 ↓
Liveness Check
 ↓
Role / Context Validation
 ↓
Attendance Authorization
 ↓
Attendance Event


───

BP. QR ATTENDANCE
QR codes must be:
• short-lived where appropriate
• location-aware where required
• cryptographically validated
• replay-resistant
• auditable
Avoid static QR codes as the sole security mechanism for high-risk attendance scenarios.

───

BQ. BIOMETRIC AUTHENTICATION
Support, where the device and jurisdiction permit:
• fingerprint
• Face ID / platform biometric authentication
• PIN
• password
Prefer platform-native biometric authentication.

───

BR. DEVICE BIOMETRICS
Where possible, CoreGrid should use:
• iOS LocalAuthentication
• Android BiometricPrompt
• platform secure enclaves / keystores
• WebAuthn / passkeys
rather than collecting raw biometric material unnecessarily.

───

BS. BIOMETRIC ENROLLMENT
First-time enrollment may occur during activation.
The user must receive:
• clear explanation
• consent where required
• purpose
• retention information
• alternative authentication method

───

BT. FACE VERIFICATION
Where institutionally authorized, a controlled attendance flow may request face verification after QR scanning.
Example:
text
Rear Camera
 ↓
Scan QR
 ↓
Attendance Session Identified
 ↓
Front Camera / Selfie Verification
 ↓
Liveness
 ↓
Identity Match
 ↓
Role + Context Validation
 ↓
Attendance Result

The exact camera behavior must respect OS permissions and platform capabilities.

───

BU. ANTI-SPOOFING
Face verification must consider:
• photographs
• screen replay
• recorded video
• masks
• presentation attacks
• deepfake attempts
• camera manipulation

───

BV. BIOMETRIC CONFIDENCE
Biometric systems must produce a verification result with appropriate confidence handling.
Low-confidence cases must not silently authenticate.

───

BW. FALLBACK AUTHENTICATION
Users must have a controlled fallback when biometric verification fails.
Possible mechanisms:
• PIN
• password
• platform passkey
• administrator verification
• secondary verification
Fallback must itself be policy-controlled.

───

BX. BIOMETRIC PRIVACY
Do not store raw biometric information unless explicitly required and legally justified.
Prefer:
• device-local authentication
• secure hardware
• derived verification mechanisms
• encrypted templates where unavoidable

───

BY. BIOMETRIC RETENTION
Every biometric capability must define:
• purpose
• retention
• deletion
• revocation
• consent
• jurisdiction
• access controls

───

BZ. BIOMETRIC DATA IS NOT AUTHORIZATION
A biometric match means:
the system believes the person is the enrolled identity.
It does not mean:
the person may perform every action.
Authorization remains determined by:
• identity
• role
• context
• policy
• permissions.

───

CA. ROLE RECOGNITION
The system may identify the authenticated institutional identity and retrieve the user's assigned role.
It must never infer authorization merely from facial appearance or visual assumptions.

───

CB. FRAUD PREVENTION
Detect:
• QR replay
• identity sharing
• impossible locations
• impossible timing
• repeated failed verification
• suspicious devices
• abnormal attendance patterns
• duplicate attendance
• simultaneous presence anomalies

───

CC. ATTENDANCE RISK ENGINE
Risk signals may include:
• device reputation
• location consistency
• QR freshness
• biometric confidence
• time consistency
• historical anomalies
Risk scoring should support review rather than automatically making unjustified accusations.

───

CD. ADMIN BIOMETRIC CONTROLS
Administrators should control:
• whether biometric attendance is enabled
• eligible staff
• permitted locations
• fallback methods
• retention policies
subject to CoreGrid platform and legal requirements.

───

CE. PRIVACY BY DESIGN
Phase 25 must minimize:
• unnecessary collection
• unnecessary retention
• unnecessary exposure

───

CF. ACCOUNT RECOVERY
Support secure recovery through:
• verified email
• verified phone
• administrator-assisted recovery
• passkeys
• backup authentication
Recovery must not bypass institutional authorization.

───

CG. ACCOUNT SECURITY
Accounts should support:
• MFA
• passkeys
• password policies
• PIN policies
• session management
• device management
• suspicious-login detection

───

CH. DEVICE REGISTRATION
Track authorized devices where appropriate.
Users may see:
• device
• platform
• last activity
• authorization state

───

CI. DEVICE REVOCATION
Administrators may revoke institutional access to compromised devices subject to policy.

───

CJ. SESSION MANAGEMENT
Sessions should support:
• expiry
• revocation
• reauthentication
• device binding where appropriate
• risk-based controls

───

CK. ADMINISTRATOR DELEGATION
The primary administrator may delegate selected responsibilities.
Delegation must define:
• role
• scope
• duration
• permissions
• policy
• audit trail

───

CL. ADMINISTRATIVE ESCALATION
Critical administrative actions may require:
• second administrator
• platform support
• institutional approval

───

CM. BREAK-GLASS ACCESS
Emergency access may exist for carefully defined scenarios.
Every break-glass event requires:
• reason
• identity
• scope
• duration
• audit
• post-event review

───

CN. ADMIN AUDIT
Record appropriate events for:
• user creation
• role assignment
• permission changes
• policy changes
• invitations
• deactivation
• biometric enrollment
• biometric revocation
• device registration
• security changes

───

CO. USER VISIBILITY
Where appropriate, users should be able to understand:
• their role
• major permissions
• workspace context
• assigned policies
• administrator contact
• institution

───

CP. PERMISSION EXPLANATION
When an action is denied, explain:
• what was denied
• why
• what authority controls it
• who can request/change access where appropriate
Avoid exposing sensitive authorization internals.

───

CQ. DYNAMIC CAPABILITY DISCOVERY
The UI should receive capability information from authoritative backend services.
Never hard-code:
text
if role == teacher:

as the primary authorization architecture.

───

CR. FEATURE AVAILABILITY
Feature visibility should be determined through:
• capability
• permission
• policy
• context
• platform

───

CS. WORKSPACE RECOMPOSITION
When context changes:
text
Role Changed
   ↓
Policy Recomputed
   ↓
Permissions Recomputed
   ↓
Capabilities Recomputed
   ↓
Workspace Recomputed


───

CT. ZERO-STATIC-PORTAL PRINCIPLE
CoreGrid must avoid:
one portal per role.
Instead:
one workspace engine capable of composing thousands of legitimate role/context combinations.

───

CU. ONBOARDING RECOMMENDATION ENGINE
Recommend:
• first actions
• missing configuration
• training
• security setup
• workspace configuration
• required policies
Recommendations must remain advisory unless explicitly automated.

───

CV. ADMIN CONFIGURATION ASSISTANT
Administrators may use AI assistance to:
• create roles
• configure policies
• identify permission conflicts
• generate onboarding journeys
• configure workspaces
AI-generated administrative changes must require appropriate approval.

───

CW. POLICY SIMULATION
Before applying a policy change, administrators should be able to simulate:
"Who will gain access?"
and:
"Who will lose access?"

───

CX. ROLE SIMULATION
Administrators should be able to preview a user's effective workspace without impersonating the user unsafely.
Use controlled preview mode.

───

CY. ACCESS PREVIEW
Display:
• effective permissions
• effective policies
• effective context
• available capabilities

───

CZ. ADMIN IMPERSONATION
Avoid unrestricted impersonation.
If support requires impersonation:
• explicit authorization
• time limit
• visible indicator
• audit trail
• restricted sensitive-data exposure

───

DA. STAFF SELF-SERVICE
Where policy allows, staff may manage:
• profile
• preferences
• password
• PIN
• devices
• notifications
• accessibility
• onboarding progress
They cannot self-grant institutional privileges.

───

DB. ORGANIZATIONAL IMPORT
Support importing staff through:
• CSV
• spreadsheet
• directory integration
• HR integration
• identity provider
Imports must validate data before creation.

───

DC. BULK USER PROVISIONING
Support:
• bulk creation
• bulk invitation
• bulk role assignment
• bulk context assignment
with preview and validation.

───

DD. IMPORT VALIDATION
Detect:
• duplicate identities
• invalid emails
• missing roles
• conflicting assignments
• invalid policies
• invalid locations

───

DE. BULK OPERATION SAFETY
Bulk operations require:
• preview
• validation
• confirmation
• audit
• rollback where possible

───

DF. DIRECTORY SYNCHRONIZATION
Future integrations may include:
• Microsoft Entra ID
• Google Workspace
• LDAP
• institutional HR systems
• government identity systems
Integration must map external identities to CoreGrid identities safely.

───

DG. IDENTITY LINKING
Multiple identity sources may map to one CoreGrid identity where verified.
Never merge identities based solely on name similarity.

───

DH. DUPLICATE DETECTION
Use verified identifiers and controlled matching.

───

DI. STAFF PROFILE
A staff profile may include:
• identity
• employment information
• organizational relationships
• qualifications
• assigned roles
• assigned contexts
• policies
• devices
• onboarding status
Sensitive information must be protected.

───

DJ. EMPLOYMENT STATUS
Support:
• applicant
• probation
• active
• leave
• suspended
• transferred
• resigned
• terminated
• retired
• archived

───

DK. TEMPORARY STAFF
Support temporary:
• teachers
• contractors
• substitutes
• consultants
• volunteers
• interns
with explicit expiration.

───

DL. EXPIRING ACCESS
Temporary access should automatically expire.

───

DM. SUBSTITUTE TEACHER
A substitute may receive temporary:
• class context
• subject context
• timetable context
• attendance capability
without receiving the permanent teacher's full access.

───

DN. VOLUNTEER ACCESS
Volunteer roles must be narrowly scoped.

───

DO. CONTRACTOR ACCESS
Contractor accounts must have:
• contract scope
• expiration
• limited data access
• limited workspace

───

DP. GOVERNMENT-ASSIGNED STAFF
Government or district assignments must coexist with institutional authorization.

───

DQ. MULTI-INSTITUTION STAFF
A person may belong to multiple institutions where legitimately authorized.
Example:
text
Identity
 ├── School A / Teacher
 ├── School B / Consultant
 └── District / Reviewer

The system must maintain context separation.

───

DR. CROSS-TENANT ISOLATION
Institutional contexts must never leak across tenants.

───

DS. CONTEXT SWITCHING
Users with multiple authorized contexts may switch between them explicitly.

───

DT. CONTEXT INDICATOR
The UI should clearly show the active:
• institution
• workspace
• campus
• role
when ambiguity could cause errors.

───

DU. CONTEXT-SENSITIVE AI
The AI assistant must inherit the active authorized context.

───

DV. CONTEXT-SENSITIVE SEARCH
Search results must inherit:
• tenant
• role
• policy
• permissions
• context

───

DW. CONTEXT-SENSITIVE NOTIFICATIONS
Notifications must respect active and authorized contexts.

───

DX. CONTEXT-SENSITIVE AUTOMATION
Automation must inherit the same authorization model.

───

DY. STAFF TRAINING
The onboarding engine may assign:
• required training
• policy education
• security training
• AI training
• workflow training

───

DZ. POLICY ACKNOWLEDGEMENT
Users may be required to acknowledge:
• acceptable-use policy
• security policy
• privacy policy
• institutional policies
• AI usage policy
Acknowledgements must be versioned.

───

EA. POLICY VERSIONING
Policies require:
• version
• owner
• effective date
• expiry where applicable
• history
• approval

───

EB. POLICY MIGRATION
Policy changes must support migration of affected users.

───

EC. WORKSPACE VERSIONING
Workspace composition may evolve without breaking user data.

───

ED. ONBOARDING VERSIONING
Onboarding journeys must be versioned.
A user who started an older journey should not silently receive an incompatible version.

───

EE. EXPERIENCE INTEGRATION
Phase 24 consumes Phase 25 outputs to render:
• navigation
• workspace
• onboarding
• role context
• capabilities

───

EF. SECURITY INTEGRATION
Phase 25 consumes Phase 08 and Phase 09 security/trust capabilities.
It must not duplicate security infrastructure.

───

EG. IDENTITY INTEGRATION
Phase 25 consumes Phase 02 identity primitives.
It extends institutional workforce administration rather than replacing the foundational identity subsystem.

───

EH. TENANCY INTEGRATION
Phase 25 consumes Phase 03 tenancy boundaries.
No institution administration operation may bypass tenant isolation.

───

EI. DATA INTEGRATION
Phase 25 consumes Phase 14 authoritative data services.

───

EJ. COMMUNICATION INTEGRATION
Phase 25 uses Phase 10 for:
• invitations
• notifications
• staff communication

───

EK. MOBILE INTEGRATION
Phase 25 uses Phase 22 for:
• mobile activation
• biometric flows
• device registration
• push notifications

───

EL. WEB INTEGRATION
Phase 25 uses Phase 23 for:
• web administration
• activation
• workspace
• onboarding

───

EM. EXPERIENCE INTEGRATION
Phase 25 uses Phase 24 for:
• dynamic workspace rendering
• onboarding UI
• personalization
• accessibility

───

EN. FUTURE AI INTEGRATION
Phase 26 may assist with:
• policy design
• onboarding generation
• role recommendations
• permission analysis
• anomaly detection
• administrative assistance
But Phase 26 must never bypass Phase 25's authoritative authorization controls.

───

EO. API CONTRACTS
Expose APIs for:
• institution provisioning
• administrator management
• user provisioning
• invitation
• role management
• context management
• policy assignment
• workspace composition
• onboarding
• staff lifecycle
• device enrollment
• biometric orchestration
• attendance identity verification
• audit events

───

EP. EVENT MODEL
Emit events such as:
text
institution.created
administrator.created
user.invited
user.activated
role.assigned
role.changed
context.assigned
policy.assigned
policy.changed
workspace.provisioned
workspace.recomposed
onboarding.started
onboarding.completed
device.registered
device.revoked
biometric.enrolled
biometric.revoked
staff.transferred
staff.suspended
staff.deactivated


───

EQ. IDEMPOTENCY
Provisioning operations must be idempotent.
Repeated requests must not create duplicate:
• users
• invitations
• roles
• workspaces
• policies
• devices

───

ER. TRANSACTION SAFETY
Multi-step provisioning must support:
• transactional boundaries
• compensating actions
• retry
• reconciliation

───

ES. EVENTUAL CONSISTENCY
Workspace and capability updates may be asynchronous.
The UI must clearly communicate pending changes.

───

ET. RECONCILIATION
A reconciliation process must detect:
• orphaned accounts
• orphaned workspaces
• stale roles
• stale policies
• failed invitations
• inconsistent permissions

───

EU. OBSERVABILITY
Monitor:
• invitation success
• activation success
• provisioning latency
• workspace generation
• policy propagation
• role changes
• failed onboarding
• biometric failures
• attendance verification failures

───

EV. SECURITY MONITORING
Monitor:
• privilege escalation attempts
• suspicious provisioning
• bulk account abuse
• invitation abuse
• biometric anomalies
• impossible context switching
• unauthorized administrative operations

───

EW. PRIVACY MONITORING
Track appropriate privacy events without creating unnecessary personal-data surveillance.

───

EX. RECOVERY
Recover from:
• failed provisioning
• failed invitation
• policy propagation failure
• workspace composition failure
• identity-provider failure
• communication failure

───

EY. ADMIN DISASTER RECOVERY
Institutions must have a controlled recovery path if their primary administrator becomes unavailable.

───

EZ. ADMIN SUCCESSION
Support controlled transfer of institutional administrative authority.

───

FA. ADMIN LOCKOUT
Prevent a single administrative error from permanently locking an institution out.

───

FB. EMERGENCY ADMINISTRATIVE RECOVERY
Emergency recovery must require:
• verified authority
• strong authentication
• audit
• platform safeguards

───

FC. TESTING
Test:
• institution creation
• administrator provisioning
• user creation
• invitations
• activation
• roles
• contexts
• policies
• workspace composition
• onboarding
• staff transfer
• deactivation
• biometric flows
• attendance
• bulk operations
• recovery

───

FD. AUTHORIZATION TESTING
Test:
• positive authorization
• negative authorization
• cross-tenant isolation
• role conflicts
• policy conflicts
• context conflicts
• privilege escalation

───

FE. WORKSPACE TESTING
Given:
text
Role
+
Context
+
Policy
+
Permissions

the expected workspace must be deterministic.

───

FF. PROPERTY TESTING
The system must guarantee:
Removing a permission cannot increase effective access.
Removing a role cannot increase effective access.
Changing tenant context cannot expose the previous tenant.
Expired access cannot remain active indefinitely.

───

FG. SECURITY PROPERTY
Biometric verification must never create authorization beyond the user's effective permissions.

───

FH. PRIVACY PROPERTY
Removing biometric enrollment must prevent future biometric authentication using that enrollment.

───

FI. ONBOARDING PROPERTY
A user must never be taught to perform an action they cannot legitimately perform.

───

FJ. DYNAMIC WORKSPACE PROPERTY
The workspace must be generated from authoritative capability state.

───

FK. PERFORMANCE
Target efficient:
• account provisioning
• bulk imports
• workspace composition
• permission resolution
• policy evaluation
• context switching

───

FL. SCALE
Architecture must support:
• thousands of institutions
• millions of identities
• millions of role assignments
• millions of workspaces
• large bulk imports
• high-volume attendance
without requiring separate codebases per institution.

───

FM. NO TENANT-SPECIFIC CODE
Institution-specific behavior must be configuration and policy driven.
Avoid:
text
if institution == SchoolA

as architectural logic.

───

FN. NO ROLE-SPECIFIC CODE
Avoid:
text
if role == Teacher

as the fundamental authorization mechanism.
Use capability and policy evaluation.

───

FO. NO HARD-CODED WORKSPACES
Avoid separate static application portals.
Use workspace composition.

───

FP. CONFIGURATION REGISTRY
Maintain registries for:
• roles
• permissions
• policies
• capabilities
• contexts
• onboarding journeys
• workspace modules
• institution types

───

FQ. GOVERNANCE
Every role and policy should have:
• owner
• purpose
• version
• lifecycle
• approval authority
• audit history

───

FR. ADMIN UX QUALITY
Administrative interfaces must prioritize:
• clarity
• preview
• impact analysis
• confirmation
• reversibility
• auditability

───

FS. "WHO GETS WHAT?" VIEW
Administrators should be able to answer:
Who can access this capability?
and:
What can this person access?

───

FT. "WHY CAN THEY ACCESS IT?" VIEW
Show the access chain:
text
Identity
 ↓
Role
 ↓
Context
 ↓
Policy
 ↓
Permission
 ↓
Capability


───

FU. "WHAT CHANGES IF I DO THIS?" VIEW
Before applying role/policy changes, administrators should see projected impact.

───

FV. ACCESS GRAPH
Support graph visualization:
text
User
 ↓
Role
 ↓
Context
 ↓
Policy
 ↓
Permission
 ↓
Capability
 ↓
Workspace


───

FW. STAFF ONBOARDING ANALYTICS
Measure:
• activation rate
• onboarding completion
• time-to-first-task
• training completion
• failed activation
• support requests

───

FX. INSTITUTION READINESS SCORE
Provide an administrative readiness view based on configured capabilities such as:
• institution profile
• administrator security
• staff onboarding
• policies
• communication
• academic configuration
• attendance
• finance
• workspace configuration
This is advisory, not an authorization mechanism.

───

FY. ADMIN RECOMMENDATIONS
The system may recommend:
• enable MFA
• complete institution profile
• configure shifts
• configure campuses
• invite staff
• configure roles
• configure policies
• configure attendance
Recommendations must remain explainable.

───

FZ. MULTI-CAMPUS ADMINISTRATION
Administrators may assign campus-specific authorities.
A campus administrator should only receive the configured campus scope.

───

GA. DEPARTMENT ADMINISTRATION
Department administrators may receive:
• department scope
• staff management
• academic management
• workflow permissions
according to policy.

───

GB. FACULTY / SCHOOL ADMINISTRATION
For universities or large institutions, support:
text
Institution
 ↓
Faculty
 ↓
Department
 ↓
Programme
 ↓
Course


───

GC. PRIMARY/SECONDARY STRUCTURE
Support:
text
School
 ├── Primary
 ├── Junior Secondary
 └── Senior Secondary

without assuming every institution uses this structure.

───

GD. BOARDING STRUCTURE
Support:
• houses
• dormitories
• boarding staff
• house parents
• boarding schedules
• boarding policies

───

GE. HOUSE SYSTEM
House membership may influence:
• activities
• permissions
• communication
• reporting
but must not automatically grant privileged data access.

───

GF. STUDENT SUPPORT STAFF
Support scoped access for:
• counsellors
• welfare officers
• safeguarding officers
• special-needs coordinators
Sensitive data must receive additional policy controls.

───

GG. SAFEGUARDING
Safeguarding information must be:
• highly restricted
• auditable
• purpose-limited
• appropriately retained

───

GH. SENSITIVE STAFF DATA
Sensitive workforce data must not automatically appear in general staff workspaces.

───

GI. DATA MINIMIZATION
Expose only fields required for the current task.

───

GJ. ADMIN SEARCH
Administrative search must support:
• name
• identifier
• role
• department
• campus
• status
• invitation state
• onboarding state

───

GK. STAFF SEARCH
Staff-facing search must respect authorization.

───

GL. ADMIN BULK ACTIONS
Support safe bulk:
• invitation
• suspension
• role assignment
• policy assignment
• context assignment
with preview.

───

GM. AUDITABLE ADMIN ACTIONS
Every privileged administrative mutation must produce an authoritative audit event.

───

GN. CODex IMPLEMENTATION DIRECTIVE
Codex must treat Phase 25 as an architectural contract.
Before implementation it MUST inspect:
• Phase 01 foundation
• Phase 02 identity
• Phase 03 multi-tenancy
• Phase 08 security engine
• Phase 09 security trust fabric
• Phase 10 communication
• Phase 14 data platform
• Phase 22 mobile
• Phase 23 web
• Phase 24 experience
• existing authentication
• existing authorization
• existing user models
• existing workspace models
• existing invitation system
• existing notification system
• existing biometric capabilities
Codex must identify existing capabilities before creating anything new.

───

GO. CODEX MUST NOT CREATE
Codex must not create:
• duplicate identity systems
• duplicate authorization systems
• duplicate tenant systems
• hard-coded role portals
• hard-coded institution portals
• separate workspace engines
• separate invitation systems
• unsafe biometric storage
• client-side authorization
• tenant-specific source-code branches

───

GP. CODEX IMPLEMENTATION LOOP
text
INSPECT
 ↓
MAP
 ↓
MODEL
 ↓
BOUNDARY CHECK
 ↓
CONTRACT DESIGN
 ↓
SECURITY REVIEW
 ↓
PRIVACY REVIEW
 ↓
IMPLEMENT
 ↓
UNIT TEST
 ↓
INTEGRATION TEST
 ↓
AUTHORIZATION TEST
 ↓
TENANT ISOLATION TEST
 ↓
WORKSPACE TEST
 ↓
ONBOARDING TEST
 ↓
DEVICE TEST
 ↓
BIOMETRIC TEST
 ↓
OBSERVABILITY TEST
 ↓
DOCUMENT
 ↓
RECONCILE


───

GQ. CODEX ZERO-CONFLICT RULE
If an existing subsystem already owns a capability:
extend it through a contract.
Do not create a competing subsystem.
If ownership is unclear:
stop implementation and produce an architecture decision.
Do not guess.

───

GR. PHASE 25 COMPLETION CRITERIA
Phase 25 is complete when CoreGrid can:
1. Create an institution.
2. Provision its initial administrator.
3. Give the administrator an administrative workspace.
4. Configure institutional structure.
5. Configure campuses.
6. Configure premises.
7. Configure shifts.
8. Configure languages.
9. Configure timezones.
10. Create departments.
11. Create roles.
12. Create policies.
13. Assign permissions.
14. Create staff accounts.
15. Assign roles.
16. Assign contexts.
17. Assign policies.
18. Generate dynamic workspaces.
19. Send secure invitations.
20. Activate accounts.
21. Guide new users through onboarding.
22. Dynamically adapt onboarding to role/context/policy.
23. Support HR administration.
24. Support staff lifecycle.
25. Support temporary staff.
26. Support multi-institution identities.
27. Support context switching.
28. Support device registration.
29. Support secure authentication.
30. Support platform biometrics.
31. Support controlled biometric enrollment.
32. Support QR attendance identity verification.
33. Support liveness/anti-spoofing where appropriate.
34. Support fallback authentication.
35. Prevent biometric authorization bypass.
36. Support role/policy simulation.
37. Explain effective permissions.
38. Explain why access exists.
39. Preview policy impact.
40. Maintain complete administrative auditability.
41. Support bulk provisioning.
42. Support recovery.
43. Support staff offboarding.
44. Maintain tenant isolation.
45. Maintain least privilege.
46. Maintain dynamic workspace composition.
47. Avoid hard-coded portals.
48. Avoid role-specific authorization logic.
49. Scale across heterogeneous institutions.
50. Integrate cleanly with Phases 01–24.

───

GS. FINAL ARCHITECTURAL PRINCIPLE
CoreGrid should not ask:
"Which portal belongs to this user?"
It should ask:
"Given this identity, institution, role, context, policy, permissions, device, location and current task, what is the safest and most useful experience we should compose for this person?"
That distinction is fundamental.
The institution administrator configures the organization.
The administrator defines who can do what.
The policy system determines the boundaries.
The identity system establishes who the person is.
The workspace system composes the experience.
The Experience Platform renders it.
The AI layer assists the user.
The security and trust layers remain authoritative underneath everything.
Therefore:
Identity determines who the person is.
Role determines what function they perform.
Context determines where and when they operate.
Policy determines the institutional rules.
Permissions determine what they may do.
Capabilities determine what CoreGrid can expose.
Workspace composition determines what the user sees.
Experience determines how the user interacts with it.
AI assists within those boundaries.
And that becomes the foundation for Phase 26 — CoreGrid AI Intelligence Layer.