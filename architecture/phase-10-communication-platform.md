Phase 10 — Communication Platform
A. Identity
A.1 Subsystem Identity
The Communication Platform is CoreGrid's unified institutional communication infrastructure.
It provides the capabilities required for people, institutions, services, applications, agents, and approved external systems to communicate through controlled, observable, reliable, multi-channel communication mechanisms.
The platform provides a common communication substrate across CoreGrid. A runtime is a
consumer of that substrate, never its boundary: CoreGrid is runtime-001, the first
consumer.
It abstracts communication channels away from individual business domains.

───

A.2 Canonical Name
Communication Platform

───

A.3 Phase
Phase 10

───

A.4 Architectural Role
Core institutional communication infrastructure.

───

A.5 Primary Responsibility
Deliver reliable, secure, tenant-aware, multi-channel communication between authorized participants and systems.

───

A.6 Communication Principle
Communication is a platform capability.
Business domains should request communication through the Communication Platform rather than implementing independent messaging systems.

───

A.7 Core Communication Domains
The platform supports:
• direct messaging
• institutional messaging
• announcements
• notifications
• email
• SMS
• push notifications
• in-app notifications
• voice integrations
• approved messaging integrations
• communication templates
• communication workflows
• conversations
• channels
• threads
• attachments
• delivery tracking
• read tracking
• acknowledgement
• preferences
• subscriptions
• communication audit
• communication analytics
• moderation
• escalation
• localization

───

B. Purpose
B.1 Primary Purpose
Provide CoreGrid with a unified communication layer capable of delivering institutional communications reliably across multiple channels.

───

B.2 Secondary Purposes
The platform provides:
• communication routing
• message orchestration
• channel abstraction
• delivery reliability
• communication preferences
• notification management
• conversation management
• announcement distribution
• template management
• communication scheduling
• delivery tracking
• acknowledgement tracking
• communication auditability
• channel failover
• localization
• accessibility
• moderation
• communication governance

───

B.3 Problems Solved
Without a communication platform, individual modules may independently implement:
• email sending
• push notifications
• SMS
• messaging
• templates
• notification preferences
• delivery tracking
This creates duplication and inconsistent behavior.
The Communication Platform centralizes those capabilities.

───

C. Ownership
The Communication Platform owns:
• communication messages
• conversations
• channels
• threads
• recipients
• delivery attempts
• delivery status
• notification records
• communication templates
• communication preferences
• subscription preferences
• communication routing
• channel configuration
• provider configuration metadata
• communication schedules
• announcements
• acknowledgement records
• communication attachments metadata
• moderation states
• communication audit records
• delivery receipts
• retry state
• communication correlation identifiers

───

D. Boundaries
D.1 Phase 02 Identity Boundary
Phase 02 owns:
• identity
• authentication
• identity lifecycle
• account recovery
Phase 10 consumes identity references.
It does not recreate identity management.

───

D.2 Phase 03 Multi-Tenancy Boundary
Phase 03 owns:
• tenant lifecycle
• tenant isolation
• tenant hierarchy
Phase 10 enforces tenant-aware communication boundaries using Phase 03 contracts.

───

D.3 Phase 06 Workspace Boundary
Phase 06 owns:
• workspace structure
• workspace collaboration context
• workspace content
Phase 10 provides communication capabilities that workspace modules may consume.
It does not own the workspace itself.

───

D.4 Phase 07 Agent System Boundary
Phase 07 owns:
• agents
• agent lifecycle
• agent execution
• tool orchestration
Phase 10 provides communication tools to authorized agents.
Agents do not automatically gain communication privileges.

───

D.5 Phase 08 Security Boundary
Phase 08 owns:
• authorization
• security enforcement
• security policies
• runtime security controls
Phase 10 consumes those controls.

───

D.6 Phase 09 Trust Boundary
Phase 09 owns:
• trust relationships
• trust state
• trust evidence
• provenance
Phase 10 may consume trust information for communication risk decisions.

───

D.7 Phase 11 Academic Boundary
Phase 11 owns academic and learning-domain communication meaning.
Phase 10 owns delivery.
For example:
Phase 11 may determine:
"Notify student that assignment feedback is available."
Phase 10 determines:
"Deliver that notification through the approved channels."

───

E. Dependencies
Required dependencies include:
• Phase 01 Foundation
• Phase 02 Identity
• Phase 03 Multi-Tenancy
• Phase 08 Security Engine
• Phase 09 Security & Trust Fabric
Optional dependencies include:
• Phase 06 Workspace Engine
• Phase 07 AI Agent System
• Phase 11 Academic Learning Intelligence
• Phase 12 Scheduling
• Phase 13 Financial Operating System
• Phase 17 Automation Engine
• Phase 18 Analytics
• Phase 19 Institutional Command Centre

───

F. Contracts
F.1 Message Contract
A message contains:
• message ID
• tenant ID
• sender
• recipients
• channel
• subject
• content
• template reference
• priority
• classification
• correlation ID
• idempotency key
• timestamp
• expiration
• metadata

───

F.2 Notification Contract
A notification contains:
• notification ID
• recipient
• event source
• category
• priority
• message
• channels
• preferences
• delivery state
• acknowledgement requirement

───

F.3 Conversation Contract
A conversation contains:
• conversation ID
• tenant
• participants
• channel
• subject
• state
• created timestamp
• last activity
• retention policy

───

G. Internal Architecture
The platform consists of:
1. Communication Gateway
2. Message Service
3. Conversation Service
4. Notification Service
5. Announcement Service
6. Channel Router
7. Email Service
8. SMS Service
9. Push Notification Service
10. In-App Notification Service
11. Voice Integration Service
12. Provider Adapter Layer
13. Template Service
14. Preference Service
15. Subscription Service
16. Delivery Service
17. Retry Service
18. Scheduling Service
19. Attachment Service
20. Moderation Service
21. Acknowledgement Service
22. Communication Audit Service
23. Communication Search Service
24. Communication Policy Adapter
25. Localization Service
26. Communication Observability Service

───

H. Communication Gateway
H.1 Purpose
Provide a unified entry point for communication requests.

───

H.2 Responsibilities
The gateway handles:
• authentication context
• tenant context
• request validation
• idempotency
• authorization delegation
• routing
• rate limiting integration
• correlation IDs
• request tracing

───

I. Message Service
I.1 Responsibilities
Manage:
• message creation
• message validation
• message persistence
• message state
• message retrieval
• message lifecycle

───

I.2 Message States
Possible states:
• DRAFT
• QUEUED
• PROCESSING
• SENT
• DELIVERED
• PARTIALLY_DELIVERED
• FAILED
• CANCELLED
• EXPIRED

───

J. Conversation Service
Supports:
• one-to-one conversations
• group conversations
• institutional conversations
• service conversations
• agent-assisted conversations where permitted
• threaded conversations

───

J.1 Conversation States
• ACTIVE
• MUTED
• ARCHIVED
• LOCKED
• CLOSED
• DELETED

───

K. Thread Management
Threads may contain:
• root message
• replies
• mentions
• attachments
• reactions
• acknowledgements
Thread relationships must remain bounded to the owning conversation.

───

L. Participant Management
Participants may include:
• students
• teachers
• administrators
• guardians
• staff
• institutions
• services
• approved agents
Participant permissions must be enforced through Phase 08.

───

M. Channel Architecture
Supported channel abstraction:
text
Communication Request
        |
        v
Channel Router
   /    |     \
Email  SMS   Push
   \    |     /
      Delivery

Business modules should not directly depend on individual communication providers.

───

N. Email Channel
Support:
• transactional email
• institutional email
• notifications
• announcements
• templated email
• attachments
• delivery receipts
• bounce tracking
• complaint tracking

───

O. SMS Channel
Support:
• transactional SMS
• emergency communication
• OTP integrations where required by other systems
• delivery receipts
• provider failover
The platform does not own authentication OTP logic.
It provides the delivery capability.

───

P. Push Notification Channel
Support:
• mobile push
• web push
• device registration references
• delivery tracking
• notification categories
• priority

───

Q. In-App Notification Channel
Support:
• notification centre
• unread count
• priority
• acknowledgement
• expiration
• deep links

───

R. Voice Integration
Where legally and technically supported, provide provider abstractions for:
• voice calls
• automated notifications
• emergency notifications
Voice providers remain external dependencies.

───

S. Provider Adapter Layer
Every external communication provider must be isolated behind an adapter.
Example:
text
Communication Platform
        |
Provider Adapter
   /      |      \
Provider A Provider B Provider C

No core domain service should directly depend on provider-specific APIs.

───

T. Provider Failover
The platform may support:
• primary provider
• secondary provider
• regional provider
• emergency provider
Failover must be policy-controlled.

───

U. Delivery Engine
The Delivery Engine manages:
• queueing
• dispatch
• provider calls
• delivery receipts
• retry
• failure handling
• status updates

───

V. Retry Architecture
Retry policies should support:
• exponential backoff
• maximum retries
• provider-specific retry behavior
• transient failure classification
• permanent failure classification
• dead-letter queues

───

W. Dead-Letter Handling
Messages that cannot be delivered after permitted retries should enter controlled dead-letter handling.
Dead-letter records must include:
• message ID
• provider
• error
• attempt count
• timestamps
• correlation ID

───

X. Idempotency
Communication operations must support idempotency.
This prevents duplicate delivery caused by:
• retries
• network failures
• worker restarts
• provider timeouts
• duplicate events

───

Y. Priority
Messages may have:
• LOW
• NORMAL
• HIGH
• URGENT
• CRITICAL
Priority must not bypass security controls.

───

Z. Emergency Communication
Emergency communication requires explicit authorization.
Capabilities may include:
• emergency announcement
• mass notification
• multi-channel delivery
• acknowledgement tracking
• escalation
• delivery monitoring
Emergency capabilities require stronger permissions.

───

AA. Announcement Service
Supports:
• institutional announcements
• tenant announcements
• departmental announcements
• class announcements
• targeted announcements
Announcements may define:
• audience
• channels
• priority
• publication time
• expiration
• acknowledgement requirement

───

AB. Audience Resolution
Audience selection may use:
• identity groups
• tenant groups
• institutional roles
• class membership
• workspace membership
• approved attributes
Audience resolution must consume authoritative data from owning systems.
Phase 10 must not become the authoritative source for academic membership.

───

AC. Notification Service
The Notification Service converts platform events into user-facing notifications.
Examples:
text
assignment.created
message.received
payment.completed
schedule.changed
announcement.published
security.alert
workflow.completed

The source domain remains the owner of the underlying event.

───

AD. Notification Preferences
Users may control:
• channel
• category
• frequency
• quiet hours
• digest preferences
• language
• notification type
Mandatory institutional or emergency communications may have restricted preference controls.

───

AE. Subscription Management
Users may subscribe to:
• announcements
• channels
• institutional updates
• system events
• optional communication categories
Subscriptions must be tenant-aware.

───

AF. Digest Engine
Support:
• daily digest
• weekly digest
• event digest
• configurable aggregation
Digest generation must preserve message priority.
Critical messages must not be hidden inside ordinary digests.

───

AG. Communication Templates
Templates may contain:
• subject
• body
• variables
• channel-specific versions
• localization
• version
• owner
• approval state

───

AH. Template Versioning
Every production template must have:
• version
• status
• creator
• reviewer where required
• created timestamp
• effective timestamp

───

AI. Template Security
Template rendering must protect against:
• injection
• unsafe HTML
• malicious links
• unauthorized variables
• cross-tenant data leakage

───

AJ. Localization
Communication supports:
• language
• locale
• timezone
• date formatting
• number formatting
• culturally appropriate formatting
Templates must support locale-specific variants.

───

AK. Accessibility
Communication interfaces must support:
• screen readers
• keyboard navigation
• accessible labels
• sufficient contrast
• semantic structure
• captions where applicable
• accessible notification controls

───

AL. Attachments
Attachment support includes:
• metadata
• size limits
• content type
• scanning
• access control
• expiration
• retention
• secure download
The platform should reference object storage rather than storing large binary content directly in transactional tables.

───

AM. Link Safety
Communication links should support:
• safe URL validation
• tenant-aware routing
• expiration where required
• phishing protection integration
• tracking policies

───

AN. Moderation
Moderation may include:
• spam detection
• abuse detection
• prohibited-content detection
• malicious-link detection
• harassment signals
• reporting
Moderation must follow applicable institutional policy.

───

AO. Human Moderation
Human reviewers may handle:
• abuse reports
• institutional complaints
• high-risk messages
• communication policy violations
Moderators require explicit permissions.

───

AP. AI-Assisted Communication
AI may assist with:
• drafting
• summarization
• translation
• classification
• routing recommendations
• response suggestions
AI must not automatically send high-impact communications without required authorization.

───

AQ. AI Communication Agent
Approved agents may:
• draft messages
• summarize conversations
• classify messages
• suggest recipients
• suggest channels
• prepare announcements
Sending authority must remain separately controlled.

───

AR. Agent Communication Permissions
Agent permissions should distinguish:
• READ_MESSAGES
• DRAFT_MESSAGE
• SEND_MESSAGE
• SEND_ANNOUNCEMENT
• MASS_SEND
• MODERATE_MESSAGE
• ACCESS_ATTACHMENTS
• EXPORT_COMMUNICATION_DATA
High-impact permissions require explicit authorization.

───

AS. Agent Memory Boundary
Communication memory must respect:
• tenant
• conversation
• participant
• retention
• privacy
• authorization
Agents must not automatically retain all conversations indefinitely.

───

AT. Search
Communication search may support:
• conversation search
• message search
• sender search
• recipient search
• date search
• channel search
• attachment metadata search
Search results must respect Phase 08 authorization.

───

AU. Database Models
Core entities include:
• CommunicationMessage
• Conversation
• ConversationParticipant
• MessageRecipient
• MessageAttachment
• MessageThread
• Notification
• Announcement
• DeliveryAttempt
• DeliveryReceipt
• CommunicationTemplate
• TemplateVersion
• CommunicationPreference
• CommunicationSubscription
• CommunicationSchedule
• Provider
• ProviderCredentialReference
• ProviderRoute
• CommunicationModerationRecord
• CommunicationAcknowledgement
• CommunicationAuditRecord
• CommunicationDigest
• CommunicationReport

───

AV. Database Requirements
Every tenant-scoped record should contain:
• tenant ID
• immutable ID
• created timestamp
• updated timestamp
• lifecycle state
Where appropriate:
• deleted timestamp
• retention timestamp
• expiration timestamp
• creator
• source system
• correlation ID

───

AW. Indexing
Indexes should support:
• tenant
• conversation
• participant
• recipient
• timestamp
• status
• channel
• notification state
Indexes must be designed around actual query patterns.

───

AX. Row-Level Security
Where database architecture supports RLS:
• tenant isolation must be enforced
• user visibility must be enforced
• administrative access must be explicit
• service identities must be controlled
RLS is not the only security layer.

───

AY. APIs
AY.1 Messages
text
POST /communications/messages
GET /communications/messages/{id}
DELETE /communications/messages/{id}

AY.2 Conversations
text
POST /communications/conversations
GET /communications/conversations/{id}
PATCH /communications/conversations/{id}

AY.3 Messages Within Conversations
text
POST /communications/conversations/{id}/messages
GET /communications/conversations/{id}/messages

AY.4 Notifications
text
GET /notifications
POST /notifications/{id}/acknowledge
PATCH /notifications/preferences

AY.5 Announcements
text
POST /communications/announcements
GET /communications/announcements/{id}
POST /communications/announcements/{id}/publish

AY.6 Templates
text
POST /communications/templates
GET /communications/templates/{id}
POST /communications/templates/{id}/versions


───

AZ. Internal APIs
Internal services should expose contracts for:
• send message
• create notification
• publish announcement
• resolve channel
• resolve preferences
• schedule communication
• query delivery state
• retry communication
• cancel communication

───

BA. Events
Events include:
text
communication.message.created
communication.message.queued
communication.message.sent
communication.message.delivered
communication.message.failed
communication.message.expired
communication.message.cancelled

communication.conversation.created
communication.conversation.updated
communication.conversation.archived

communication.notification.created
communication.notification.delivered
communication.notification.acknowledged

communication.announcement.created
communication.announcement.published
communication.announcement.expired

communication.delivery.retry
communication.delivery.dead_letter

communication.template.created
communication.template.updated
communication.template.approved
communication.template.retired

communication.preference.updated
communication.subscription.created
communication.subscription.removed

communication.moderation.flagged
communication.moderation.resolved


───

BB. Webhooks
External providers may send:
• delivery receipts
• bounce notifications
• spam complaints
• provider status
• inbound messages
Webhook security must include:
• signature verification
• timestamp validation
• replay protection
• idempotency
• provider identity verification

───

BC. MCP Interfaces
Potential MCP tools:
text
communication.send
communication.draft
communication.search
communication.get_conversation
communication.create_notification
communication.publish_announcement
communication.get_delivery_status
communication.get_preferences
communication.schedule
communication.summarize

MCP access is subject to Phase 08 security enforcement and Phase 07 agent permissions.

───

BD. Security
Communication security includes:
• authorization
• tenant isolation
• encryption
• secure provider credentials
• attachment protection
• audit logging
• abuse protection
• rate limiting
• message classification
• retention enforcement

───

BE. Confidential Communication
Sensitive communications should support:
• classification
• restricted recipients
• encryption
• restricted search
• retention controls
• enhanced auditing

───

BF. Encryption
Protect:
• message content
• attachments
• communication metadata where sensitive
• provider credentials
• sensitive preferences
Encryption must support:
• encryption at rest
• encryption in transit
• managed key rotation

───

BG. Provider Credentials
Provider secrets must not be stored directly in source code or ordinary application configuration.
Use a secure secret-management mechanism.

───

BH. Audit Logging
Audit events include:
• message creation
• message access
• message delivery
• message deletion
• announcement publication
• template changes
• moderation decisions
• preference changes
• administrative access
• communication exports

───

BI. Privacy
The platform must minimize:
• unnecessary message retention
• unnecessary metadata
• unnecessary access
• unnecessary analytics collection
Privacy policies must be tenant-aware.

───

BJ. Retention
Retention may differ by:
• tenant
• communication type
• legal requirement
• institutional policy
• message classification
Retention must be explicit.

───

BK. Deletion
Deletion must distinguish:
• user-visible deletion
• logical deletion
• retention expiration
• legal hold
• immutable audit requirements

───

BL. Legal Hold
Where required, communication records may be placed under legal hold.
Legal hold must prevent ordinary deletion while the hold is active.

───

BM. Communication Export
Authorized exports may include:
• messages
• conversations
• metadata
• delivery records
• audit records
Exports must be:
• permission-controlled
• logged
• tenant-scoped
• encrypted

───

BN. Abuse Prevention
Controls include:
• rate limiting
• spam detection
• mass-send protection
• recipient limits
• anomaly detection
• suspicious-provider detection
• account abuse signals

───

BO. Mass Communication Protection
Mass sending requires:
• explicit permission
• audience validation
• preview
• estimated recipient count
• channel validation
• confirmation
• audit record
Critical mass communication may require human approval.

───

BP. Communication Scheduling
Scheduled messages require:
• schedule ID
• timezone
• execution time
• expiration
• cancellation state
• creator
• authorization context

───

BQ. Timezone Handling
All scheduled communication must store canonical timestamps.
User-facing scheduling must preserve:
• timezone
• locale
• daylight-saving behavior where applicable

───

BR. Reliability
The platform must support:
• queues
• retries
• dead-letter handling
• provider failover
• idempotency
• durable state
• delivery reconciliation

───

BS. Delivery Reconciliation
Provider delivery status must be reconciled with internal state.
The system must detect:
• missing receipts
• delayed receipts
• inconsistent provider status
• duplicate receipts

───

BT. Offline Behavior
Mobile and web clients should support controlled offline behavior.
Messages generated offline should receive:
• local temporary ID
• synchronization state
• conflict handling
• server-issued canonical ID

───

BU. Real-Time Communication
Where supported:
• WebSocket
• server-sent events
• push infrastructure
Real-time channels must not become the authoritative persistence mechanism.
Durable message state remains authoritative.

───

BV. Presence
Optional presence information may include:
• online
• offline
• recently active
Presence should be privacy-controlled.

───

BW. Typing and Ephemeral Signals
Optional ephemeral signals:
• typing
• recording
• message composition
These should not be persisted unless explicitly required.

───

BX. Read Receipts
Read state may include:
• unread
• delivered
• read
• acknowledged
Read information must respect privacy settings.

───

BY. Acknowledgement
Certain communications may require explicit acknowledgement.
Examples:
• policy announcements
• emergency notices
• institutional decisions
• required administrative communication
Acknowledgement must be independently recorded.

───

BZ. Escalation
Escalation can occur when:
• message is not acknowledged
• emergency communication fails
• recipient cannot be reached
• critical notification remains unread
Escalation rules must be configurable and authorized.

───

CA. Communication Observability
Monitor:
• messages per second
• queue depth
• delivery latency
• delivery success rate
• provider failure rate
• retry rate
• dead-letter volume
• notification acknowledgement rate
• channel health
• API latency

───

CB. Distributed Tracing
Every communication request should support:
• trace ID
• correlation ID
• message ID
• provider request ID
This allows:
text
Business Event
      ↓
Notification
      ↓
Message
      ↓
Channel Router
      ↓
Provider
      ↓
Delivery Receipt

to be traced end-to-end.

───

CC. Metrics
Core metrics include:
• send latency
• delivery latency
• failure percentage
• retry percentage
• provider availability
• queue age
• notification engagement
• acknowledgement rate

───

CD. Alerting
Alerts may trigger for:
• provider outage
• delivery failure spike
• queue growth
• dead-letter spike
• suspicious mass sending
• webhook failure
• credential failure

───

CE. Reliability Targets
Service-level targets should be defined for:
• API availability
• message acceptance
• delivery processing
• notification processing
• provider failover
Actual targets should be established from production requirements rather than arbitrary numbers.

───

CF. Testing
CF.1 Unit Testing
Test:
• message validation
• routing
• preferences
• templates
• state transitions
• retry policies
• scheduling

───

CF.2 Integration Testing
Test:
• email providers
• SMS providers
• push providers
• webhook processing
• queues
• database
• identity integration

───

CF.3 End-to-End Testing
Test:
text
Create Event
    ↓
Notification
    ↓
Message
    ↓
Channel
    ↓
Provider
    ↓
Delivery Receipt


───

CG. Security Testing
Test:
• unauthorized message access
• cross-tenant access
• attachment access
• provider credential leakage
• webhook forgery
• replay attacks
• message injection
• template injection
• mass-send abuse

───

CH. Failure Testing
Simulate:
• provider outage
• queue failure
• database failure
• network timeout
• duplicate events
• delayed receipts
• malformed webhooks
• worker crash
• regional outage

───

CI. AI Evaluation
Evaluate AI communication capabilities for:
• hallucination
• incorrect recipient selection
• unsafe message generation
• privacy leakage
• incorrect summarization
• incorrect translation
• inappropriate tone
• unauthorized sending
AI-generated communication must be clearly governed.

───

CJ. Performance
Optimize:
• message throughput
• queue processing
• database queries
• template rendering
• notification fan-out
• provider connection management
Large audience broadcasts must use scalable fan-out architecture.

───

CK. Scalability
The architecture must support independent scaling of:
• API
• message workers
• notification workers
• channel workers
• provider adapters
• search
• moderation
• webhook processors

───

CL. Deployment
Potential services:
text
communication-api
message-service
conversation-service
notification-service
announcement-service
channel-router
delivery-service
template-service
preference-service
provider-adapters
webhook-service
moderation-service
communication-search
communication-observability

Services should only be separated when operational scale or isolation justifies the complexity.

───

CM. Infrastructure
Infrastructure may include:
• relational database
• message broker
• object storage
• cache
• search engine
• observability platform
• secret manager
• push infrastructure
• provider integrations

───

CN. Configuration
Configuration includes:
• channel enablement
• provider routing
• retry policies
• message limits
• attachment limits
• notification categories
• retention
• templates
• emergency communication rules
• rate limits
Configuration must be versioned and audited.

───

CO. Disaster Recovery
Recovery must preserve:
• messages
• conversations
• notifications
• delivery state
• templates
• preferences
• audit records
• schedules
Provider state must be reconciled after recovery.

───

CP. Backup
Backups should cover:
• communication database
• configuration
• templates
• audit metadata
• required indexes or rebuildable state
Backups must be encrypted.

───

CQ. Business Continuity
If one communication provider fails:
text
Primary Provider
       ↓
Failure
       ↓
Provider Failover
       ↓
Secondary Provider
       ↓
Delivery

Critical communication should have predefined fallback paths.

───

CR. Operational Procedures
Document procedures for:
• provider outage
• provider credential rotation
• mass-send incident
• spam incident
• communication abuse
• webhook compromise
• notification outage
• queue backlog
• failed delivery recovery
• emergency communication

───

CS. Human Escalation
Human approval may be required for:
• emergency mass communication
• high-risk institutional announcements
• communication involving sensitive classifications
• large-scale external communication
• suspicious AI-generated communications
• communication policy overrides

───

CT. Compliance Support
The platform should support evidence relevant to:
• communication retention
• privacy
• auditability
• access control
• consent
• institutional records
• communication traceability
It does not itself define legal compliance.

───

CU. User Experience
The platform may expose communication capabilities through:
• web
• mobile
• institutional dashboards
• notification centres
• workspace integrations

───

CV. Communication Inbox
Users may see:
• conversations
• announcements
• notifications
• unread count
• priority
• filters
• search
• archived messages

───

CW. Conversation UI
Support:
• message history
• replies
• threads
• attachments
• reactions
• read state
• participant list
• search

───

CX. Notification Centre
Support:
• unread notifications
• categories
• priority
• acknowledgement
• filtering
• preferences

───

CY. Announcement UI
Authorized users may:
• compose
• preview
• select audience
• select channels
• schedule
• publish
• monitor delivery

───

CZ. Mobile Experience
Mobile clients should support:
• push notifications
• conversations
• announcements
• offline synchronization
• notification preferences
• attachments
• accessibility

───

DA. Web Experience
Web interfaces should support:
• responsive communication UI
• multi-column inbox
• conversation views
• institutional announcements
• administration
• delivery monitoring

───

DB. Accessibility
Communication interfaces must support:
• keyboard navigation
• screen readers
• semantic HTML
• accessible notifications
• reduced motion
• captions
• localization

───

DC. Localization
Support:
• multilingual messages
• locale-specific formatting
• timezone-aware scheduling
• translated templates
• right-to-left languages where required

───

DD. Analytics Boundary
Phase 10 produces communication telemetry.
Phase 18 owns cross-platform analytics and decision intelligence.
Phase 10 must not become the institutional analytics engine.

───

DE. Automation Boundary
Phase 17 owns cross-system automation.
Phase 10 provides communication actions that automation workflows can invoke.

───

DF. Scheduling Boundary
Phase 12 owns institutional scheduling intelligence.
Phase 10 owns only communication delivery scheduling.

───

DG. Financial Boundary
Phase 13 owns financial operations.
Phase 10 only delivers financial-related notifications generated by Phase 13.

───

DH. Academic Boundary
Phase 11 owns academic meaning.
Phase 10 owns communication delivery.

───

DI. Agent Boundary
Phase 07 owns agent execution.
Phase 10 provides communication capabilities to agents through controlled interfaces.

───

DJ. Data Boundary
Phase 14 owns the broader data platform.
Phase 10 owns communication-domain data only.

───

DK. API Governance
All public communication APIs require:
• versioning
• authentication
• authorization
• idempotency where required
• rate limiting
• schema validation
• observability
• documentation
Breaking changes require explicit versioning.

───

DL. Event Governance
Events must be:
• versioned
• documented
• idempotent where consumers require it
• traceable
• tenant-aware
• backward-compatible

───

DM. Data Classification
Communication data should support classification such as:
• PUBLIC
• INTERNAL
• CONFIDENTIAL
• RESTRICTED
• HIGHLY_RESTRICTED
Classification affects:
• access
• retention
• encryption
• search
• export

───

DN. Tenant Isolation
Every tenant-scoped communication operation must preserve:
• tenant ID
• participant boundaries
• recipient boundaries
• attachment boundaries
• search boundaries
• analytics boundaries
Cross-tenant communication requires explicit federation or platform authorization.

───

DO. Cross-Tenant Communication
If permitted:
• both tenants must be identified
• relationship must be authorized
• data exposure must be limited
• communication must be auditable
• revocation must be possible

───

DP. External Communication
External recipients must be treated separately from internal recipients.
Controls should include:
• external-recipient classification
• domain restrictions
• approval requirements
• data-loss prevention integration where applicable
• audit logging

───

DQ. Data Loss Prevention Integration
The Communication Platform may integrate with DLP systems to detect:
• sensitive data
• credentials
• personal data
• institutional records
• restricted documents
DLP enforcement remains with the appropriate security controls.

───

DR. Communication Governance
Communication governance defines:
• who may communicate
• through which channels
• to whom
• under which circumstances
• with which retention requirements
• with which approval requirements
Runtime enforcement remains Phase 08.

───

DS. Versioning
Version:
• API contracts
• event schemas
• templates
• provider adapters
• notification categories
• communication policies

───

DT. Migration
Migration mechanisms must support:
• legacy messages
• provider migration
• template migration
• conversation migration
• notification migration
Migrations must preserve identifiers where possible.

───

DU. Compatibility
The platform must preserve:
• message identifiers
• conversation identifiers
• event compatibility
• delivery semantics
• API version guarantees

───

DV. Security Incident Integration
Security incidents may trigger communications.
Phase 08 or other security systems may emit:
text
security.incident.communication_required

Phase 10 handles delivery.
It does not own incident response.

───

DW. Trust Integration
Phase 09 may provide:
• sender trust
• provider trust
• device trust
• agent trust
Trust information may influence communication routing or escalation.

───

DX. Agent Integration
Phase 07 agents may invoke communication capabilities only through approved tools.
Example:
text
Agent
  ↓
Communication Tool
  ↓
Phase 08 Authorization
  ↓
Communication Platform
  ↓
Channel


───

DY. Audit Requirements
Every high-impact communication action must be traceable to:
• actor
• agent if applicable
• source system
• tenant
• recipient
• channel
• authorization context
• timestamp
• correlation ID

───

DZ. Operational Dashboards
Operators should be able to monitor:
• communication throughput
• provider health
• queue health
• failed deliveries
• emergency broadcasts
• webhook failures
• notification health
• channel availability

───

EA. Administrative Controls
Administrators may manage:
• providers
• routing
• templates
• communication policies
• notification categories
• retention settings
• emergency communication configuration
Administrative actions require strong authorization.

───

EB. Provider Lifecycle
Provider lifecycle:
text
DISCOVERED
    ↓
CONFIGURED
    ↓
VALIDATED
    ↓
ACTIVE
    ↓
DEGRADED
    ↓
SUSPENDED
    ↓
RETIRED


───

EC. Template Lifecycle
Template lifecycle:
text
DRAFT
  ↓
REVIEW
  ↓
APPROVED
  ↓
ACTIVE
  ↓
DEPRECATED
  ↓
RETIRED


───

ED. Message Lifecycle
text
CREATED
  ↓
VALIDATED
  ↓
QUEUED
  ↓
DISPATCHED
  ↓
DELIVERED

Failure branches may lead to:
text
RETRY
  ↓
DEAD_LETTER


───

EE. Communication Quality
Quality monitoring may include:
• delivery success
• latency
• bounce rate
• provider health
• acknowledgement
• user reports
• spam indicators

───

EF. Testing Matrix
Testing must cover:

Area
Requirement

Unit
Domain logic

Integration
Providers

API
Contracts

Event
Schema compatibility

Security
Authorization

Tenant
Isolation

Performance
Throughput

Reliability
Failover

AI
Generation quality

Accessibility
UX compliance

Localization
Language correctness

Recovery
Disaster scenarios



───

EG. Acceptance Criteria
Phase 10 is accepted when:
1. messages can be created.
2. messages can be delivered.
3. conversations can be managed.
4. notifications can be generated.
5. announcements can be published.
6. multiple communication channels are abstracted.
7. providers are replaceable.
8. delivery state is observable.
9. retries work.
10. dead-letter handling works.
11. idempotency works.
12. preferences work.
13. templates are versioned.
14. localization works.
15. attachments are protected.
16. tenant boundaries are enforced.
17. authorization integrates with Phase 08.
18. trust information can be consumed from Phase 09.
19. approved agents can use communication tools.
20. AI-assisted communication is controlled.
21. mass communication is protected.
22. emergency communication is controlled.
23. communication events are emitted.
24. webhooks are verified.
25. communication audit records exist.
26. provider failover works.
27. disaster recovery is tested.
28. accessibility requirements are met.
29. performance requirements are validated.
30. operational monitoring exists.

───

EH. Definition of Done
Phase 10 is complete only when:
• communication domain model exists
• communication APIs exist
• event contracts exist
• provider abstraction exists
• delivery engine exists
• notification system exists
• conversation system exists
• announcement system exists
• templates exist
• preferences exist
• subscriptions exist
• scheduling exists
• delivery tracking exists
• retry system exists
• dead-letter handling exists
• webhook processing exists
• attachment handling exists
• moderation exists
• accessibility exists
• localization exists
• tenant isolation exists
• security integration exists
• trust integration exists
• agent integration exists
• observability exists
• disaster recovery exists
• testing exists
• documentation exists

───

EI. Future Evolution
Future capabilities may include:
• richer real-time communication
• institution-to-institution messaging
• advanced voice communication
• secure video communication integrations
• AI communication assistants
• intelligent communication routing
• multilingual real-time translation
• communication risk detection
• advanced notification personalization
• communication federation
• decentralized communication identity
• advanced anti-abuse systems
Future evolution must preserve:
• channel abstraction
• provider independence
• message identity
• delivery semantics
• tenant isolation
• security boundaries
• auditability
• privacy
• backward compatibility

───

EJ. Architectural Invariants
The following rules are mandatory:
1. Communication is a platform capability.
2. Business domains own communication meaning, not delivery infrastructure.
3. Phase 10 owns communication delivery.
4. Phase 08 owns runtime security enforcement.
5. Phase 09 owns trust.
6. Phase 07 owns agent execution.
7. Phase 11 owns academic meaning.
8. Phase 12 owns institutional scheduling intelligence.
9. Phase 13 owns financial operations.
10. Phase 17 owns cross-system automation.
11. Phase 18 owns cross-platform analytics.
12. Provider-specific logic must remain behind adapters.
13. Provider replacement must not require rewriting business domains.
14. Communication must remain tenant-aware.
15. High-impact communication requires explicit authorization.
16. AI-generated messages must not automatically acquire unrestricted sending authority.
17. Mass communication must be protected against accidental or malicious execution.
18. Delivery state must be observable.
19. Retries must be idempotent.
20. Unknown delivery state must not be treated as successful delivery.
21. Critical communications require controlled escalation.
22. Communication retention must be explicit.
23. Sensitive communication must receive appropriate protection.
24. External communication must be explicitly identifiable.
25. Cross-tenant communication must be explicitly authorized.
26. Communication contracts must be versioned.
27. Events must remain backward-compatible.
28. Auditability must be preserved.
29. Durable message state remains authoritative over real-time transport.
30. Communication infrastructure must remain replaceable and provider-independent.

───

EK. Final Architectural Principle
CoreGrid should never allow every subsystem to invent its own communication infrastructure.
A student system, academic system, financial system, scheduling system, automation system, agent system, government system, and institutional command centre should all be able to request communication through the same controlled platform.
The Communication Platform therefore acts as CoreGrid's institutional communication nervous system. A runtime consumes it rather than owning it: CoreGrid is runtime-001, the first consumer of this contract.
It carries the messages.
It does not decide the meaning of the institution's business events.
It does not own identity.
It does not own security policy.
It does not own agents.
It does not own academic intelligence.
It does not own financial operations.
It does not own automation.
It provides the reliable, secure, observable communication infrastructure through which those systems can communicate.
The result is a communication layer that is:
• modular
• multi-tenant
• secure
• provider-independent
• observable
• auditable
• accessible
• localized
• resilient
• AI-compatible
• automation-compatible
• institution-ready
• globally extensible
• backward-compatible

───

EL. Dependency Register

EL.1 Purpose
Every dependency this phase has, and every dependency other phases have on it, is stated
here as a testable claim rather than left as an implication. A dependency that cannot be
named is a dependency the platform has not understood.

EL.2 Inbound dependencies — what this phase requires before it can behave as designed
• Dependency on Phase 01 (Foundation): the kernel primitives — contracts, events, outbox,
  error taxonomy. If a kernel primitive changes, this phase changes; the reverse is not
  true.
• Dependency on Phase 02 (Identity): every contact is an opaque reference owned by
  identity. Communication never resolves a person by itself.
• Dependency on Phase 03 (Multi-Tenancy): every subscription, mandate, message and call
  session carries a tenant, and isolation is enforced by row-level security rather than by
  convention.
• Dependency on Phase 06 (Workspace): the inbox, notification centre and conversation
  surfaces are hosted inside the workspace shell.
• Dependency on Phase 07 (Agent System): the steward is an agent principal. Execution,
  memory and tool rules come from Phase 07 and are never re-implemented here.
• Dependency on Phase 08 (Security Engine): the authorization decision to send, moderate,
  export or record is Phase 08's, not this phase's.
• Dependency on Phase 09 (Trust Fabric): provenance, retention and trust assertions over
  communication artefacts belong to Phase 09.
• Dependency on the domain phases (11 and later): communication carries domain meaning and
  never defines it.

EL.3 Outbound dependencies — what depends on this phase
• Academic, financial, scheduling, transport, health, government and agent capabilities
  depend on this phase for delivery. They publish intent; this phase owns delivery state.
• A consumer of a communication module acquires a dependency on the message contract
  version, never on a provider.

EL.4 External provider dependencies
Anything that leaves the platform depends on an external provider: telephony and SMS
carriers, WhatsApp Business, email relays and senders, push services, meeting providers and
social platforms.
Each dependency is isolated behind one adapter shape, so the dependency is on a capability
(voice, SMS, email, push) rather than on a company. A provider that changes its terms,
degrades, or disappears becomes a routing decision rather than a rewrite (EJ.12, EJ.13,
EJ.30).

EL.5 Dependency rules
1. A domain may depend on the communication contract; it may never call a provider.
2. A provider adapter may depend on nothing inside a domain.
3. A dependency that is not stated in this register is not authorised.
4. If a phase that depends on this phase requires this phase to depend on it, that is a
   cycle and must be refused at review.

───

EM. Steward Mandate Data Model

EM.1 Purpose
This is the data model the Communication Steward needs in order to be durable. The shapes
below are implemented today as typed values with enforced invariants; the tables are not yet
created, and that gap is declared in the steward report rather than implied away. A model
that is written down is a model that can be migrated deliberately.

EM.2 Entities
• organization_communication_subscription — one row per organization subscribed to
  platform communication.
• steward_mandate — one row per steward a subscription carries: the authority it holds.
• steward_quiet_hours — the mandated quiet window, in the mandate's timezone.
• communication_consent_record — a recorded, attributable opt-in.
• communication_do_not_contact — a person's instruction not to be contacted.
• steward_knowledge_pack — what the steward may know, with its provenance.
• steward_knowledge_pack_topic — the topics a pack covers, and those it refuses.
• call_session — one inbound or outbound conversation, with its state history.
• steward_decision_record — the audit record of every decision: what was asked, what was
  decided, which rule decided it, and which obligations were attached.

EM.3 Columns of the principal tables
organization_communication_subscription: id (primary key), tenant_id (foreign key),
organization_name, plan (enum: essential | professional | institution | enterprise),
status (enum: pending | active | suspended), channels (text[]), steward_enabled (boolean),
steward_seats (integer), policy_pack_ref, billing_ref, provisioned_at, created_at,
updated_at.

steward_mandate: id (primary key), tenant_id (foreign key), subscription_id (foreign key),
organization_name, steward_id, autonomy (enum: OBSERVE | DRAFT | APPROVAL_REQUIRED |
AUTONOMOUS), channels (text[]), audiences (text[]), jurisdictions (text[]),
languages (text[]), prohibited_topics (text[]), knowledge_topics (text[]),
requires_disclosure (boolean), recording_allowed (boolean), emergency_allowed (boolean),
external_recipients_allowed (boolean), escalation_target, created_at, expires_at (nullable),
revoked_at (nullable).

steward_mandate_limit: mandate_id (foreign key), currency, max_outbound_calls_per_hour,
max_outbound_calls_per_day, max_messages_per_day, max_mass_recipients,
max_call_minutes_per_day, max_monthly_spend_minor_units.

communication_consent_record: id, tenant_id, subject_ref, channel, purpose (enum),
granted_at, expires_at (nullable), revoked_at (nullable), source (not null).

communication_do_not_contact: id, tenant_id, contact_ref, scope (enum: all | marketing |
voice), recorded_at, source (not null).

call_session: id, tenant_id, steward_id, direction (enum: inbound | outbound), channel
(enum: voice | whatsapp_voice), contact_ref, state (enum over the nine declared call
states), started_at, ended_at (nullable), disposition (nullable), escalated_to (nullable).

steward_decision_record: id, tenant_id, mandate_id, action, channel, audience, purpose,
classification, decision (enum: ALLOW | DENY | REQUIRE_APPROVAL | ESCALATE), reason,
failed_rules (text[]), obligations (text[]), decided_at, actor_ref.

EM.4 Keys, constraints and enums
• Primary keys are opaque identifiers; no natural key is ever a primary key.
• tenant_id is NOT NULL on every table, so a row without a tenant cannot exist.
• autonomy, plan, status, purpose, classification, direction, scope, call state and decision
  are enumerated types: a typo cannot widen authority or invent a state.
• Money is held in minor units with an explicit currency column; no floating point.
• A mandate may not be deleted while a decision record references it. Revocation is a
  timestamp, not a deletion, so the authority that was in force remains legible.
• consent.source and do_not_contact.source are NOT NULL: an unattributable instruction is
  not an instruction.


EM.5 Indexes
• (tenant_id, decided_at desc) on steward decision records and on call sessions, for the
  operational views a control plane actually reads.
• (tenant_id, subject_ref, channel, purpose) on consent records, because that is the exact
  question the decision engine asks before any marketing send.
• (tenant_id, contact_ref) on do-not-contact entries, because that question is asked on
  every send to a known contact.
• A partial index that excludes revoked mandates is deliberately not used: a revoked
  mandate must remain readable for audit.

EM.6 Row-level security
• Every table in this model is tenant-scoped under row-level security. Application code is
  never the only security layer (Constitution §17, Phase 03).
• The control plane reads across tenants through a service role; it never trusts a tenant
  identifier supplied by a client.
• A steward's decision records are readable by the organization that owns them and by the
  control plane, and by nothing else.
• Consent and do-not-contact rows are readable outside their tenant only in aggregate,
  never as individual rows.

EM.7 Migration and evolution
• These tables arrive as a forward migration with their policies in the same change. A
  table without its policy is not merged.
• Columns are added nullable or with a default; a widening of authority (a new autonomy
  level, a new action kind, a new channel) is a versioned contract change, never a data
  edit.
• Existing rows are never rewritten to grant authority. New authority arrives as a new
  mandate version, so the history of what was permitted stays readable.
• The model is additive: a provider, a channel or a language is data, and adding one must
  not require a schema change to an existing tenant's mandate.

EM.8 Declared gaps in this model
1. No migration exists yet: the model is documented and implemented as typed values, and
   nothing persists it. Until the migration lands, a mandate lives only as long as the
   process that built it.
2. No retention or deletion policy is attached to decision records, call sessions,
   consent records or knowledge packs.
3. No recording or transcript storage is modelled, because recording is not yet permitted
   to be switched on.
4. Billing is a reference, not a meter: plan tiers are descriptive until metering exists.
These gaps are reported by the steward report and by the phase acceptance record rather
than hidden behind a table name.

───

EN. Organization Subscription to Platform Communication

EN.1 Principle
Communication is a platform capability, and every organization that plugs into CoreGrid
subscribes to it rather than assembling its own. A tenant that joins the platform receives
the communication infrastructure, the provider routing, the policy surface and an autonomous
Communication Steward — configured to that organization's authority, not to the platform's
convenience.

EN.2 What a subscription carries
• The channel set the organization is authorised to use, per jurisdiction.
• A Communication Steward, with the seats the plan entitles the organization to.
• The organization's own policy pack reference and escalation queue.
• The communication surfaces: inbox, notification centre, conversation view, announcement
  composer.
• Access to the provider routing described in Sections S, T and EB — including regional
  carriers, so an organization is not forced onto one company's coverage.
• The audit record of everything its steward decided, and the reasons.

EN.3 Provisioning semantics
1. Provisioning creates the subscription in state pending, with the requested channels
   recorded on the subscription.
2. Provisioning creates the steward's mandate in OBSERVE with no channels, no audiences, no
   jurisdictions, no languages and no knowledge topics. A new organization is trusted with
   nothing until it writes down what its steward may do.
3. The organization then opens authority deliberately: autonomy, channels, audiences,
   jurisdictions, languages, knowledge topics, prohibited topics, quiet hours, limits,
   disclosure and recording duties, and the escalation target.
4. Only when a mandate is live does the steward act; and every act is bounded by the mandate
   that authorises it.

EN.4 Plan tiers and seats
Communication plans: essential, professional, institution, enterprise. Seat entitlement
scales with the plan, and every plan carries at least one steward. A plan changes seats and
support; it never changes an organization's authority — authority is granted by the mandate
and only by the mandate.

EN.5 Isolation
A subscription is tenant-scoped. There is no shared inbox, no shared contact list and no
implicit cross-tenant reach. Cross-tenant communication is an explicit authorisation
(Section DO), never a side effect of sharing a provider.


EN.6 Declared limitation
Plan tiers and seat counts are descriptive today: there is no metering and no invoice.
Billing is a reference string, and the steward report states this in the open rather than
letting a plan name imply enforcement that does not exist.

───

EO. The Communication Steward

EO.1 What it is
Every subscribing organization receives a Communication Steward: an autonomous
communication agent that answers inbound voice and WhatsApp conversations, places outbound
calls, sends messages and status updates, publishes to institutional social channels,
schedules meetings, maintains presence, and escalates to a human when its mandate, its
knowledge or its limits say it must.

EO.2 Why it exists
The role it performs is the support-and-communications role: answering the same questions all
day, chasing acknowledgements, sending the same notices, keeping status current, and knowing
when to fetch a person. That work is real, repetitive, and done badly at scale when it
depends on who happens to be on duty. The platform makes it explicit, bounded, auditable and
continuous, under a mandate rather than under a job description nobody wrote down.

EO.3 What the steward is not
• It is not the organization's authority: its mandate is written by the organization.
• It is not the identity system, the security engine, the trust fabric or the agent runtime;
  it consumes all four.
• It is not an oracle: outside its knowledge pack it escalates.
• It is not unbounded: volume, spend, audience and jurisdiction ceilings stop it.

EO.4 The mandate — authority expressed as data
A mandate carries: autonomy, channels, audiences, jurisdictions, languages, knowledge
topics, prohibited topics, quiet hours with a timezone, hard limits (calls per hour and per
day, messages per day, mass recipients, call minutes per day, monthly spend in minor units),
disclosure duty, recording permission, emergency permission, external-recipient permission,
and an escalation target. It has a creation time, an optional expiry and an optional
revocation.

EO.5 The autonomy ladder
OBSERVE — the steward watches and reports; it may never act.
DRAFT — the steward may draft, and may report its own presence; nothing it produces reaches a
person without a human sending it.
APPROVAL_REQUIRED — the steward may act, and a human approves each person-facing action
before it reaches anyone.
AUTONOMOUS — the steward acts on its own, still bounded by every mandate rule, limit, quiet
hour, consent record and classification rule.
Autonomy is monotone: raising it is a deliberate, recorded act, and lowering or revoking it
takes effect immediately.

EO.6 The decision
Every steward action passes one gate, which returns ALLOW, DENY, REQUIRE_APPROVAL or
ESCALATE together with the reason, the rule that decided it, and the obligations the action
carries. The rules, in order: escalation is always available; the mandate must be live; a
forbidden classification is refused; a prohibited topic is refused; channel, audience and
external reach must be opened; jurisdiction must be known and inside the mandate; language
must be mandated; a do-not-contact instruction is absolute; marketing requires a recorded
opt-in and emergency requires explicit authority; knowledge outside the pack escalates; a
reached limit stops the steward; quiet hours bind external channels; autonomy decides act,
ask or step aside; mass communication and sensitive classifications always need a human;
recording needs permission; and every permitted action still carries its duties.

EO.7 Obligations travel with permission
An ALLOW is never bare. It arrives with its duties attached — disclose the assistant, announce
the recording, honour the opt-out, warn the owner before a limit, log a public statement —
because a permission without its duty is how a platform loses the trust it was given.
───

EP. Autonomous Call Rules

EP.1 Inbound
1. A call arrives at the organization's number. The call session is created in REQUESTED and
   moves along the declared call state machine; no state is skipped and no finished call is
   resumed.
2. The steward answers only if its mandate is live, voice is an authorised channel, the
   contact's jurisdiction is inside the mandate, the language is mandated, no quiet-hours
   restriction applies to the purpose, and its autonomy reaches the level an answered call
   requires.
3. Below that autonomy, the call is routed to a human instead; the steward never answers on
   behalf of an authority it was not given.
4. The steward states that it is an assistant where disclosure is required or where the words
   are machine-generated. A person who asks for a human is handed to one.
5. Outside its knowledge pack, the steward takes a message and escalates rather than guessing.
6. A MISSED, FAILED or ABANDONED call is reported as such. Unknown is never reported as
   delivered.

EP.2 Outbound
1. An outbound call requires AUTONOMOUS authority; below that it is queued for human approval,
   because a ringing telephone cannot be approved after the fact.
2. Outbound minutes, calls per hour and calls per day are bounded by the mandate, and the
   steward stops when a ceiling is reached rather than discovering it mid-conversation.
3. Quiet hours apply in the mandate's timezone, with the clock supplied by the caller so
   daylight-saving transitions are resolved by the system that owns the timezone data.
4. An authorised emergency may be placed inside quiet hours; nothing else may.
5. Recording is permitted only where the mandate allows it, and notice of recording is an
   obligation of the call, not an option.
6. Every outbound attempt takes the failover ladder for its channel and region: the declared
   primary first, then the regional carrier, then the secondary. A degraded provider is used
   only when the caller asked for one.

EP.3 Handover
A handover to a human carries the conversation context the organization is allowed to share,
the mandate that governs it, and the escalation target. The steward does not retain the
caller after a handover, and the session records who took over and when.

EP.4 Presence and status
Presence states are online, offline and recently active, and they are shareable only when the
subject permits it. Presence is a platform-internal signal: it carries no contact data and is
never used to infer whether a person is reachable by telephone.

───

EQ. The Human Role the Steward Replaces

EQ.1 The claim, stated plainly
A mandate with AUTONOMOUS authority, voice, WhatsApp, email, status, meeting, presence and
social reach is the authority a support-and-communications employee is given today. A
subscribing organization can therefore hand that role to its steward: the repeated answering,
the acknowledgement chasing, the routine notices, the status keeping, and the escalation when
a person is genuinely needed.

EQ.2 What that means for the organization's people
The steward replaces the role, not the judgement. It removes the work that is mechanical and
leaves the work that is human: decisions the mandate does not cover, conversations outside
the knowledge pack, anything involving a prohibited topic, sensitive classifications, and
complaints that need an accountable person. Those arrive as escalations with the history
attached, which is a better starting point for a person than a cold queue.

EQ.3 The obligations this creates for the platform
1. Disclosure: a person speaking to a machine is told so, in words, before they invest
   anything in the conversation.
2. Reachability: a human must always be reachable through the escalation target, including
   outside working hours, or the mandate's emergency authority is misleading.
3. Opt-out: an instruction not to be contacted is absolute and survives every plan change.
4. Review: an organization can read every decision its steward made, with the rule that
   decided it, and can lower or revoke its authority at any time.
5. Honesty about limits: the platform states which channels are live. Today only platform
   presence and in-app are live; every external channel is declared and unrouted until a
   credential exists.

EQ.4 The adoption boundary
Handing a human role to an autonomous steward is an organizational decision, taken with the
people affected. The platform provides the mechanism, the mandate and the record; it does not
create the staffing decision, and nothing in this phase performs a handover automatically.




───

ER. Steward Acceptance Criteria

ER.1 Organizational subscription
1. An organization with a tenant and a name can be provisioned; one without either is
   refused.
2. Provisioning returns a subscription in state pending and a mandate in OBSERVE with no
   channels, audiences, jurisdictions, languages or knowledge topics.
3. Seat entitlement follows the plan, and every plan carries at least one steward.

ER.2 Authority is bounded by the mandate
4. An action on a channel, audience, jurisdiction or language the mandate has not opened is
   refused, and the refusal names the rule.
5. An unknown jurisdiction is refused: unknown is not authorised.
6. A revoked or expired mandate refuses everything except escalation to a human.
7. Escalation is available at every autonomy level, including OBSERVE and including a
   revoked mandate.

ER.3 Autonomy
8. OBSERVE refuses every action.
9. DRAFT produces drafts and may report its own presence; it never sends.
10. APPROVAL_REQUIRED queues every person-facing action for human approval.
11. AUTONOMOUS acts alone within the mandate.
12. Answering and placing calls require AUTONOMOUS authority; below it, a call is routed to a
    human or queued for approval.

ER.4 Protection that outranks autonomy
13. Mass communication requires human approval at every autonomy level, and requests a
    recipient estimate and a preview.
14. Confidential and restricted classifications require human approval.
15. Highly restricted classification cannot be handled by a steward at all.
16. A do-not-contact instruction is absolute.
17. Marketing requires a recorded opt-in with an attributable source; emergency requires
    explicit mandate authority.
18. A reached limit stops the steward and names the limit; an approaching limit warns the
    owner first.
19. External channels observe the mandate's quiet hours in its timezone; an in-app channel is
    not a disturbance; an authorised emergency is not silenced.

ER.5 Duties travel with permission
20. Every decision carries an audit obligation.
21. A permitted conversation obliges disclosure of the assistant where the mandate or the
    law requires it.
22. A permitted recording requires the mandate's permission and carries a notice duty.
23. A public statement is logged.
24. An opt-out obligation accompanies every allowed action to a known contact.

ER.6 Provider independence
25. Every adapter names its credential by reference; raw-looking material is refused.
26. Routing resolves to an ACTIVE adapter for the channel and region, or refuses with the
    reasons it rejected; a degraded provider is used only when the caller allows it.
27. The capability matrix is derived from the registry, so no module hard-codes a provider.
28. The registry reports no findings about itself, and only the platform's own presence
    adapter is live.

ER.7 Honesty
29. The steward report exercises the mandate machine on real organizations and reports every
    check with the observation that produced it.
30. The report declares the gaps — no live external provider, no persistence, no telephony
    binding, no steward model, no recording store, no metering, no automated handover — with
    the consequence and the owner of each.
31. A surface showing steward authority declares no role list of its own; authorization is
    enforced by the platform's existing layers.

