
Phase 13 — Payment, Billing & Financial Operating System
A. Identity
A.1 Subsystem Identity
Phase 13 is CoreGrid's Payment, Billing & Financial Operating System (FinOS).
It provides the authoritative financial transaction and billing domain required for CoreGrid to operate educational institutions, organizations, enterprises, marketplaces, subscriptions, services, facilities, and future financial workflows.
FinOS transforms commercial and institutional obligations into controlled financial workflows.
Its core responsibility is to answer:

•	What is owed?
•	Why is it owed?
•	Who owes it?
•	Who is entitled to receive it?
•	What has been billed?
•	What has been paid?
•	What remains outstanding?
•	What has been refunded?
•	What has been credited?
•	What financial transaction occurred?
•	Can the transaction be independently verified?
•	Can the complete financial history be reconstructed?

───

B. Purpose

B.1 Primary Purpose
Provide a reliable, auditable, secure, multi-tenant financial infrastructure for CoreGrid.
B.2 Secondary Purposes
FinOS supports:
•	pricing
•	products
•	services
•	fees
•	billing plans
•	subscriptions
•	invoices
•	invoice items
•	charges
•	payments
•	payment attempts
•	refunds

•	credits
•	adjustments
•	discounts
•	taxes
•	receivables
•	collections
•	payment reconciliation
•	financial transactions
•	financial ledger references
•	settlements
•	payouts where applicable
•	payment-provider abstraction
•	financial notifications through Phase 10
•	financial analytics through Phase 18
•	financial automation through Phase 17
•	marketplace financial workflows through Phase 25
B.3 Core Principle

FinOS must never treat a payment as simply:
 
A real financial workflow is:
 



───

C. Ownership
•	Phase 13 owns:
•	billing domain
•	pricing domain
•	financial products
•	invoices
•	invoice lines

•	charges
•	payment intents
•	payment attempts
•	refunds
•	credits
•	discounts
•	tax calculation integration
•	receivables
•	collections state
•	payment-provider abstraction
•	settlement records
•	reconciliation
•	financial transaction state
•	financial idempotency
•	financial lifecycle
•	financial audit references
•	financial controls
•	financial risk signals
•	payment failure handling
•	financial dispute state

financial reporting interfaces

───

D. Explicit Non-Ownership
•	Phase 13 does not own:
•	user identity
•	authentication
•	tenant identity
•	authorization infrastructure
•	communication delivery
•	generic workflow execution
•	generic analytics infrastructure
•	hardware
•	digital twins
•	academic records
•	scheduling

•	generic data infrastructure
•	UI framework
•	AI agent lifecycle
marketplace ownership
Other phases consume FinOS capabilities through explicit contracts.

───

E. Architectural Boundaries
E.1 Phase 02 — Identity
•	Phase 02 identifies:
•	users
•	guardians
•	students
•	staff

•	administrators
organizations
Phase 13 associates financial obligations with authorized identities.
Phase 13 does not authenticate users.
E.2 Phase 03 — Multi-Tenancy
Phase 03 defines tenant isolation.
Every financial object must belong to the appropriate tenant context.
Cross-tenant financial access is prohibited unless explicitly authorized through platform-level contracts.
E.3 Phase 04 — Education Reality Engine
•	Phase 04 may define:
•	enrollment

•	courses
•	programs
•	institutional services
facilities
These may create financial obligations.
Phase 13 converts those obligations into financial records.
E.4 Phase 10 — Communication Platform
•	Phase 10 owns:
•	email
•	SMS
•	push
notification delivery.
FinOS emits events such as:

 
Phase 10 decides how to communicate them.
E.5 Phase 17 — Automation Engine
Phase 17 may automate approved financial workflows.
FinOS remains the financial authority.
Automation cannot bypass financial controls.
E.6 Phase 18 — Analytics & Decision Intelligence
Phase 18 consumes financial events and metrics.

It does not modify financial truth.
E.7 Phase 25 — Marketplace
Marketplace transactions may invoke FinOS.
Marketplace business logic remains in Phase 25.
FinOS provides financial primitives.

───

F. Financial Domain Model
The financial domain must distinguish:
 


These concepts must not be collapsed into a single "transaction" table.

───

G. Product Model
•	Products represent things CoreGrid can financially sell or bill.
•	Examples:
•	tuition

•	examination fee
•	registration fee
•	laboratory fee
•	hostel fee
•	transport
•	software subscription
•	facility booking
premium service
enterprise plan
Products must be versioned.

───

•	H. Service Model
•	Services may represent:
•	educational services
•	administrative services

•	infrastructure services
digital services
subscription services
A service is not necessarily a product.

───

•	I. Pricing Engine
•	Pricing must support:
•	fixed prices
•	variable prices
•	tiered pricing
•	volume pricing
•	per-user pricing
•	per-seat pricing
•	usage-based pricing
•	recurring pricing

•	one-time pricing
promotional pricing
institution-specific pricing

───

J. Price Versioning
A price change must never rewrite historical financial records.
Example:
 
Existing invoices retain v1.
New invoices may use v2.


───

•	K. Billing Plans
•	Plans may define:
•	price
•	billing interval
•	included services
•	usage limits
•	overage rules
•	grace periods
•	discounts
taxes
cancellation rules

───

•	L. Billing Intervals
•	Support:
•	one-time
•	daily
•	weekly
•	monthly
•	quarterly
•	yearly
•	academic term
academic semester
custom period

───

M. Billing Calendar
•	Academic billing may differ from normal 

commercial billing.
•	Support:
•	academic sessions
•	terms
•	semesters
•	enrollment periods
•	payment windows
grace periods
due dates

───

N. Financial Obligation
•	An obligation represents an amount that an entity is expected to pay.
•	It must contain:
•	obligation ID

•	tenant
•	debtor
•	beneficiary
•	source
•	amount
•	currency
•	reason
•	creation timestamp
•	due date
status
metadata

───

O. Invoice
•	An invoice is a formal representation of an amount owed.
•	It must contain:

•	invoice ID
•	invoice number
•	issuer
•	customer
•	billing address where applicable
•	currency
•	issue date
•	due date
•	status
•	line items
•	subtotal
•	discounts
•	taxes
•	total
amount paid
amount outstanding

───

P. Invoice Lifecycle
 
Alternative:
 

 
Invoices may also become:

Historical invoices must remain reconstructable.

───

•	Q. Invoice Line
•	Every invoice line must represent a specific financial reason.
•	Examples:
•	tuition
•	registration
•	examination

•	transport
•	hostel
software
facility
subscription
Invoice lines must preserve their historical price and tax basis.

───
•	
•	R. Invoice Numbering
•	Invoice numbering must support:
•	tenant-specific sequences
•	institution-specific sequences
fiscal-period sequences
configurable prefixes
uniqueness guarantees

Number generation must be concurrency-safe.

───
•	
•	S. Currency
•	FinOS must support:
•	currency code
•	currency precision
minor units
currency metadata
supported payment currencies
Never represent financial values using floating-point arithmetic.
Use integer minor units or exact decimal representations.

───


T. Money Representation
Example:
 
must not be stored as an imprecise binary floating-point number.
Use:
 
where the currency's precision permits that representation.

───

•	
•	U. Multi-Currency
•	Support:
•	invoice currency
•	payment currency
•	settlement currency
exchange rate
conversion timestamp
exchange-rate source
Currency conversion must preserve the original amounts.

───
•	
•	V. Exchange Rates
•	Every conversion must record:

•	source currency
•	destination currency
•	rate
timestamp
provider
conversion method
Historical rates must remain immutable.

───

•	W. Payment Intent
•	A payment intent represents the intention to pay a financial obligation.
•	It must include:
•	intent ID
•	invoice
•	amount

•	currency
•	customer
payment method requirements
expiration
status

───

X. Payment Attempt
A payment attempt represents an actual attempt to process a payment.
One payment intent may have multiple attempts.
Example:
 

 

───

Y. Payment Lifecycle
Support states such as:

State transitions must be explicit.

───

Z. Payment Provider Abstraction
FinOS must not be coupled to a single payment provider.
Architecture:
 

•	───
•	
•	AA. Provider Adapter

•	Each provider adapter handles:
•	authentication
•	request translation
•	response translation
webhook translation
provider-specific errors
provider identifiers
provider capabilities
The domain model remains provider-independent.

•	───
•	
•	AB. Payment Methods
•	Support abstraction for:
•	bank transfer
•	card

•	mobile money
•	wallet
•	direct debit
payment link
cash reconciliation
external payment
institutional payment
Actual availability depends on provider and jurisdiction.

───

AC. Payment Method Tokenization
FinOS should avoid storing raw sensitive payment credentials when possible.
Use provider tokens or secure tokenization.

───

•	
•	AD. Card Data Boundary
•	Raw card data should remain outside CoreGrid infrastructure whenever provider architecture permits.
•	FinOS stores:
token
provider
masked metadata
expiry metadata where appropriate

───

AE. Webhook Processing
Payment webhooks are untrusted external input until verified.

Processing pipeline:
 


───

AF. Webhook Idempotency
Repeated provider webhooks must not produce duplicate financial effects.
Every provider event requires a durable idempotency identity.

───

AG. Payment Reconciliation
Reconciliation compares:
 

 
Discrepancies must be detected explicitly.

───

AH. Reconciliation States
Examples:


•	───

•	
•	AI. Settlement
•	Settlement represents funds becoming available through a provider or financial institution.
•	Track:
•	settlement ID
•	provider
•	amount
•	currency
settlement date
fees
net amount
reference
reconciliation state

───

AJ. Provider Fees
Provider fees must be recorded separately from the gross payment.
Example:
 
Never silently subtract fees from the original payment amount.

•	───
•	
•	AK. Refunds

Refunds must reference the original payment.
Support:
full refund
partial refund
multiple refunds where provider permits
Refunds must never exceed refundable amounts.

───

AL. Refund Lifecycle
 


•	Failure states must be explicit.
•	
•	───
•	
•	AM. Refund Authorization
•	Refund authority should depend on:
amount
user role
institution policy
reason
payment age
risk level
High-value refunds may require elevated approval.
•	
•	───

•	AN. Credits
Credits represent financial value that can offset future obligations.
•	Examples:
•	overpayment
•	scholarship adjustment
•	service credit
•	approved compensation
•	Credits must have:
amount
currency
source
expiration where applicable
status
usage history

•	───
•	
•	AO. Adjustments
•	Adjustments modify an obligation under controlled policy.
Examples:
scholarship
waiver
correction
approved discount
administrative adjustment
•	Every adjustment must be auditable.
•	
•	───
•	
•	AP. Discounts

Support:
fixed discount
percentage discount
promotional discount
institution-specific discount
student-specific discount where authorized
•	Discount eligibility must be explicit.
•	
•	───
•	
•	AQ. Scholarships and waivers (one discount category among many)
•	Scholarship support may include:
scholarship award
eligibility
coverage percentage
covered products
effective period

remaining amount
Scholarship policy belongs to the appropriate education/business domain; FinOS records its financial effect.

A scholarship is not a privileged case. It is one waiver category an organization declares, alongside corporate sponsorship, hardship waiver, goodwill credit, partner subsidy, promotional discount, statutory exemption and any other category the organization defines. FinOS stores the category and the financial effect with provenance; it never infers entitlement, never assumes an organization has scholarships, and never assumes a payer is a learner. Wherever this document names a category — tuition, examination fee, scholarship, hostel fee — read it as an example an organization supplies as data, not as a case the engine branches on (see EJ).

───

AR. Payment Allocation
A payment may be allocated across multiple obligations.
Example:
 

Allocation must be explicit and traceable.

───

AS. Partial Payments
Support:
•	 
•	
•	───

AT. Overpayments
If payment exceeds the obligation:
create credit
initiate refund
or apply according to policy
•	Never silently discard excess funds.
•	
•	───
•	
•	AU. Failed Payments
A failed payment must preserve:
attempt
provider
reason category
provider reference

timestamp
•	Sensitive provider error data must be protected.
•	
•	───
•	
•	AV. Payment Retry
Retry policies must consider:
failure type
provider recommendation
retry count
time interval
fraud risk
Do not endlessly retry payments.

───

AW. Collections
FinOS tracks collection state.
Possible states:
 
Collection actions are subject to institutional and legal policies.

───

AX. Grace Period
Institutions may define grace periods.
Grace-period rules must be versioned.

───

AY. Financial Holds
FinOS may expose financial state to other domains.
Example:
 
However, academic access policies belong to 

the relevant institutional domain.
•	FinOS must not independently decide academic eligibility.
•	
•	───
•	
AZ. Disputes
Support:
payment dispute
invoice dispute
chargeback
adjustment dispute
Disputes must have lifecycle state.

───

BA. Chargebacks
Where providers support chargebacks:
 
FinOS records the financial state.

───

BB. Financial Ledger Boundary

FinOS should maintain authoritative financial transaction records necessary for its domain.
Where CoreGrid eventually requires a formal double-entry accounting system, that system must be explicitly designed rather than approximated with arbitrary balance fields.
Financial balances must be derivable from immutable financial events.

───

BC. Immutable Financial Events
Critical financial events should be append-oriented.
Examples:


 

───

BD. Financial State Reconstruction
•	Current financial state should be reconstructable from historical financial events and controlled snapshots.
•	
•	───

•	BE. Double-Entry Compatibility
•	FinOS should be architected so it can integrate with a formal double-entry ledger.
•	Potential accounts include:
accounts receivable
cash
payment clearing
refunds payable
revenue
tax payable
provider fees
FinOS does not casually invent accounting treatment.
Accounting policy must be explicitly governed.

───

BF. Ledger Integration Boundary
If a dedicated accounting subsystem is introduced later:
•	 
•	The adapter must preserve financial provenance.
•	
•	───
•	
•	BG. Tax Engine

•	Tax handling must support:
taxable products
tax categories
tax rates
tax jurisdiction
tax exemptions
tax-inclusive pricing
•	tax-exclusive pricing
•	Tax rules must be versioned.
•	
•	───
•	
•	BH. Tax Jurisdiction
Tax determination may depend on:
institution
customer
product

location
transaction type
jurisdiction

───

•	BI. Tax Provider Abstraction
•	Tax calculation should support provider abstraction where external tax engines are required.
•	
───

BJ. Fiscal Period
Financial records may be associated with:
fiscal year

fiscal period
•	academic period
•	Fiscal periods must not rewrite historical records.
•	
•	───
•	
BK. Financial Calendar
Support:
fiscal year
fiscal quarter
fiscal month
•	academic billing cycle
•	settlement cycle
•	
•	───

•	BL. Subscription Billing
•	Support:
•	subscription creation
•	activation
renewal
upgrade
downgrade
pause
cancellation
grace period
failed renewal

───

BM. Subscription State

 

───

BN. Usage Billing
Where appropriate:
•	 

•	
•	Usage records must be auditable.
•	
•	───
•	
•	BO. Metering
Metering may measure:
users
seats
API calls
storage
compute
services
facility usage

Metering infrastructure must not fabricate usage.

───

•	BP. Billing Corrections
•	Corrections must create compensating adjustments rather than rewriting historical invoices.
•	
•	───

BQ. Invoice Cancellation
An issued invoice should not simply be deleted.
Use:
void
cancellation

credit
•	replacement invoice
•	according to policy.
•	
•	───
•	
BR. Financial Idempotency
Critical mutation APIs require idempotency keys.
Examples:
payment creation
payment capture
•	refund
•	credit application
•	invoice issuance
•	
•	───

BS. Concurrency
Financial operations must protect against:
double payment
duplicate refund
duplicate invoice
race conditions
duplicate credit application
conflicting allocation
Use transactional integrity and concurrency controls.

───

BT. Atomicity
Financial state transitions must be atomic.
Never allow:

•	 
•	while the corresponding internal financial state remains unknowable.
•	
•	───
•	
BU. Distributed Transactions
Avoid fragile distributed transactions.
Use:
durable events
transactional outbox
idempotent consumers
reconciliation
eventual consistency where appropriate


───
•	
•	BV. Transactional Outbox
•	Financial domain events should be persisted transactionally with state changes before being published.
•	
───

BW. Event Ordering
Where financial event ordering matters, maintain:
aggregate sequence
event version
•	causation ID
•	correlation ID

•	
•	───
•	
•	BX. Security
•	Financial data requires high protection.
•	Controls include:
•	encryption
authorization
tenant isolation
secrets management
tokenization
audit logging
•	fraud detection
•	anomaly detection
•	privileged-action controls
•	
•	───

•	
•	BY. RBAC
Roles may include:
financial administrator
billing administrator
cashier
finance officer
auditor
•	institution administrator
•	support administrator
•	Roles must be tenant-scoped.
•	
•	───
•	
•	BZ. ABAC
Authorization may consider:

transaction amount
tenant
institution
financial object
action
risk level
•	payment state
•	
•	───
•	
•	CA. Approval Policies
High-risk operations may require:
 


Examples:
large refunds
1.	manual credits
2.	invoice cancellation
3.	financial adjustments
4.	payout changes

───

CB. Separation of Duties
Avoid allowing one actor to:
create financial adjustment
•	approve it
•	execute it

•	reconcile it
•	without appropriate controls.
•	
•	───

CC. Privileged Operations
Privileged operations require:
elevated authorization
reason
•	audit record
•	actor
•	timestamp
•	affected objects
•	
•	───

CD. Fraud Detection
FinOS may identify:
unusual payment velocity
repeated failed payments
suspicious refund patterns
•	abnormal amount changes
•	account takeover indicators
•	duplicate payment behavior
•	Fraud models should produce risk signals rather than silently blocking legitimate users without policy.
•	
───

CE. Financial Risk Scoring
Risk signals may include:

transaction risk
account risk
•	provider risk
•	velocity risk
•	anomaly score
•	Risk decisions must be explainable enough for operational review.
•	
───

CF. Payment Limits
Support configurable:
per-transaction limits
•	daily limits
•	monthly limits
•	refund limits
•	payout limits

•	
───

CG. Rate Limiting
Protect:
payment creation
•	refund creation
•	webhook endpoints
•	invoice APIs
authentication-adjacent financial endpoints

───

CH. Secrets
Never store:

provider secret keys
•	private credentials
•	raw card credentials
•	in source control.
•	Use secure secrets infrastructure.
•	
•	───
•	
•	CI. Audit Logging
•	Audit:
•	invoice creation
•	invoice changes
•	payment creation
payment attempts
refunds
credits
adjustments

pricing changes
tax changes
provider configuration
reconciliation
privileged operations

───

CJ. Audit Immutability
Financial audit records should be tamper-evident.

───
•	
•	CK. Financial Provenance
•	Every financial state must be traceable to:

•	 
•	
───

CL. Data Retention
Retention must respect:
legal requirements

tax requirements
financial requirements
•	institutional policy
•	privacy obligations
•	Retention must not mean uncontrolled permanent storage of unnecessary personal data.
•	
───

CM. Privacy
Financial data should follow data-minimization principles.
Examples:
•	do not expose full payment identifiers
•	mask sensitive data
•	restrict invoice access

•	minimize exported financial data
•	
•	───
•	
CN. Compliance Architecture
FinOS must be designed to support applicable requirements concerning:
payment security
privacy
financial records
tax
consumer protection
electronic transactions
local payment regulation
Exact obligations depend on jurisdiction, institution, payment model, and provider.

───

CO. Provider Compliance Boundary
Payment providers may handle regulated payment infrastructure.
CoreGrid must still understand its own responsibilities rather than assuming:
"The provider handles compliance, therefore CoreGrid has no obligations."

───
•	
•	CP. Reconciliation Engine
•	Daily or scheduled reconciliation should compare:

•	 
•	
•	───
•	
•	CQ. Reconciliation Exceptions
Exceptions may include:
missing payment
duplicate payment
wrong amount
wrong currency

missing settlement
unexpected fee
refund mismatch
chargeback mismatch

───
•	
•	CR. Reconciliation Workflow
•	 

•	
•	
•	───
•	
•	CS. Financial Reporting Interface
FinOS exposes financial facts to Phase 18.
Examples:
gross billing
collected amount
outstanding amount
refunds
credits
payment failures
settlement totals

provider fees
Phase 18 determines analytical presentation.
•	
•	───
•	
•	CT. Reporting Integrity
•	Analytics must not mutate financial source records.
•	
───

CU. Financial Exports
Support controlled exports:
invoices
payment history
refunds

settlements
reconciliation
financial summaries
Exports must be authorized and audited.

•	───
•	
•	CV. API Architecture
•	Representative APIs:
•	

•	 
•	
•	───


CW. API Requirements
Financial APIs must support:
authentication
authorization
•	idempotency
•	validation
•	rate limiting
•	structured errors
•	correlation IDs
•	audit events
•	
•	───
•	
•	CX. API Error Model
Errors should distinguish:

invalid request
unauthorized
forbidden
insufficient funds
provider failure
duplicate request
financial conflict
invalid state transition
reconciliation exception
system failure

───

CY. Event Contracts
Representative events:


 



───

CZ. Webhook Events
•	External provider events must be translated into internal domain events.
•	Never expose provider-specific event schemas throughout the CoreGrid codebase.
•	
•	───
•	
•	DA. Database Architecture

•	Core models include:
•	 

•	

───

DB. Database Integrity
Enforce:
tenant isolation

currency consistency
immutable historical values
unique invoice numbers
valid state transitions
non-negative balances where applicable
refund limits
allocation limits
foreign-key integrity

───

DC. Financial Invariants
Examples:
 

 
Any invariant violation must fail safely.

───

DD. Balance Integrity
Do not trust cached balances blindly.
Where appropriate:

Snapshots may improve performance but must be reconstructable.

───


•	DE. Financial State Machine
•	Every major financial entity requires an explicit state machine.
•	Never allow arbitrary status strings to mutate financial state.
•	
•	───
•	
DF. Financial Event Sourcing Compatibility
FinOS should remain compatible with event-oriented reconstruction.
This does not require every subsystem to become fully event-sourced.
Use event sourcing where it materially improves financial correctness and auditability.


───
•	
•	DG. Performance
•	Optimize:
•	invoice queries
•	payment lookup
•	reconciliation
transaction history
billing generation
subscription processing
Financial correctness always outranks raw throughput.

•	───

•	DH. Scalability
•	Support:
•	asynchronous invoice generation
batch billing
large payment volumes
provider webhook bursts
reconciliation workloads
subscription renewal workers

───

DI. Batch Billing
Batch billing must support:
cohort billing
institution billing

subscription renewal
term billing
bulk invoice generation
Batch jobs must be restartable.

───
•	
•	DJ. Job Safety
•	A failed billing job must not create duplicate invoices.
•	Use deterministic idempotency keys.
•	
•	───
•	
•	DK. Financial Scheduler
•	Recurring billing may use Phase 17 automation 

infrastructure.
•	Phase 13 defines financial execution semantics.

───

DL. Observability
Track:
•	payment success rate
•	payment failure rate
•	provider latency
•	webhook latency
•	reconciliation mismatch rate
•	refund latency
•	invoice generation latency
•	outstanding receivables
settlement delay
duplicate-event rate


───

•	DM. Financial Alerts
•	Alert on:
•	abnormal payment failures
•	reconciliation mismatch
•	provider outage
•	duplicate transactions
abnormal refund volume
unexpected settlement difference
financial invariant violation
suspicious activity

───

DN. Distributed Tracing
Financial operations require:
correlation ID
transaction ID
•	payment ID
•	invoice ID
•	provider reference
•	reconciliation run ID
•	
───

DO. Monitoring
Monitor:


 

───

DP. Failure Recovery
If provider unavailable:
preserve invoice state
•	preserve payment intent
•	avoid duplicate attempts
•	retry according to policy
•	allow alternative providers where configured
•	
•	───

•	DQ. Provider Failover
•	Where multiple providers exist:
 
Failover must not accidentally double-charge customers.

───

•	DR. Disaster Recovery

•	Recover:
•	invoices
•	payments
•	payment attempts
refunds
credits
financial events
reconciliation state
provider references
•	audit records
•	
•	───
•	
•	DS. Backups
•	Financial backups must support:
point-in-time recovery
encrypted backups

tested restoration
retention policies
isolated backup storage

───

DT. Disaster Recovery Testing
Regularly test:
database restoration
•	provider recovery
•	webhook replay
•	reconciliation recovery
•	invoice reconstruction
•	payment-state reconstruction

───

DU. Degraded Modes
Support:
•	 
•	
•	───
•	
•	DV. Business Continuity
•	If payment providers fail:
•	existing invoices remain accessible

•	financial history remains accessible
•	payment state remains visible
•	no duplicate charging occurs
•	recovery queues preserve pending work
•	
•	───
•	
•	DW. Testing
Testing must include:
unit tests
integration tests
provider adapter tests
webhook tests
•	database tests
•	security tests
•	authorization tests
•	tenant-isolation tests

•	concurrency tests
•	idempotency tests
•	reconciliation tests
•	recovery tests
•	disaster-recovery tests
•	load tests
•	financial invariant tests
•	
•	───
•	
•	DX. Financial Test Scenarios
Test:
duplicate payment
duplicate webhook
payment timeout
provider success after timeout
•	provider failure after local success

•	duplicate refund request
•	partial refund
•	overpayment
•	partial payment
•	currency mismatch
•	concurrent payment
•	concurrent refund
stale invoice
cancelled invoice
invalid state transition

───

DY. Provider Contract Testing
Every payment provider adapter requires contract tests for:
authorization

payment creation
payment confirmation
failure
•	refund
•	webhook
•	settlement
•	error mapping
•	
•	───
•	
•	DZ. Financial Property Testing
•	Test invariants across generated scenarios.
Examples:
 



───
•	
•	EA. Security Testing
•	Include:
•	authorization bypass testing
•	IDOR testing
webhook spoofing
replay attacks
signature bypass
privilege escalation
tenant isolation
•	secret exposure
•	injection testing
•	
•	───

•	
•	EB. Fraud Testing
Test:
high-frequency payment attempts
refund abuse
amount manipulation
repeated failed cards
•	suspicious account behavior
•	
•	───
•	
•	EC. Compliance Testing
•	Validate:
•	audit retention
access controls

data masking
financial record integrity
required reporting fields
consent requirements where applicable

•	───
•	
•	ED. Financial AI Boundary
•	AI may assist with:
•	fraud detection
•	billing anomaly detection
•	collection prioritization
payment failure prediction
pricing analysis
financial forecasting
reconciliation assistance
AI cannot independently alter authoritative 

financial state without authorized deterministic workflows.

───

EE. Financial Agents
Potential agents:
Billing Intelligence Agent
Payment Operations Agent
Reconciliation Agent
Fraud Intelligence Agent
•	Collections Intelligence Agent
•	Financial Analysis Agent
•	Revenue Operations Agent
•	Phase 07 owns their lifecycle.
•	
•	───

•	
EF. Agent Permissions
Agents must have least-privilege permissions.
Example:
 

High-risk mutation permissions require explicit authorization.
•	
•	───
•	
•	EG. Human-in-the-Loop
•	Human approval should be available for:
•	high-value refunds
•	unusual adjustments
•	disputed transactions
suspicious activity
large credits
manual reconciliation
provider changes

•	───

•	EH. Explainability
•	Every AI-assisted financial recommendation should provide:
•	recommendation
•	evidence
•	confidence
•	uncertainty
•	financial impact
affected objects
proposed action
required approval

───
•	
•	EI. Financial UX
•	Interfaces should include:

•	billing dashboard
•	invoice management
•	payment dashboard
•	receivables dashboard
reconciliation dashboard
refund dashboard
subscription management
financial settings
transaction history

•	───
•	
•	EJ. Customer Financial View
•	Authorized users may see:
•	invoices
•	payments
•	outstanding balance

credits
refunds
payment methods
receipts
Sensitive internal financial information must remain hidden.
•	
•	───
•	
•	EK. Finance Operations View
•	Authorized finance users may see:
•	receivables
•	collections
•	reconciliation
•	settlements
•	refunds
•	payment failures

•	provider performance

───

EL. Invoice UX
Invoice presentation should clearly show:
•	issuer
•	recipient
•	invoice number
•	date
•	due date
•	items
•	subtotal
discounts
tax
total
paid amount

outstanding amount

───
•	
•	EM. Payment UX
•	Payment interfaces should provide:
•	amount
•	currency
•	purpose
provider
status
receipt
failure explanation where safe
Never expose sensitive provider information unnecessarily.
•	
•	───

•	
•	EN. Receipt
•	Successful payments should generate a durable receipt representation.
Receipt must reference:
payment
invoice
amount
currency
•	timestamp
•	provider reference
•	
•	───
•	
•	EO. Financial Accessibility
Financial workflows must support:

keyboard navigation
screen readers
clear error states
accessible tables
non-color-only status indicators

───

EP. Localization
•	Support:
•	currency formatting
•	locale
•	date formats
•	number formats
tax presentation
•	local payment methods

•	
•	───
•	
•	EQ. Internationalization
The financial model must support institutions operating across jurisdictions without embedding one country's financial assumptions into the core domain.

───

ER. Import / Export
Import:
•	external invoices
•	historical payments
•	balances

•	credits
•	settlement records
•	Export:
•	invoices
•	receipts
transactions
reconciliation reports
settlement reports
All imports require validation and deduplication.

───
•	
•	ES. Migration
•	Financial migrations must preserve:
•	historical amounts
•	original currency

•	original timestamps
•	original references
•	invoice history
•	payment history
•	refund history
adjustment history
Historical financial truth must not be rewritten for convenience.

───

•	ET. Documentation
•	Maintain:
•	financial domain model
•	state machines
•	provider contracts
•	webhook specifications

•	reconciliation procedures
•	refund procedures
•	financial security model
•	compliance mapping
•	operational runbooks
•	disaster recovery procedures
•	
•	───
•	
•	EU. Operational Runbooks
At minimum:
payment provider outage
duplicate payment
duplicate webhook
payment timeout
•	failed refund
•	reconciliation mismatch

•	settlement mismatch
•	chargeback
•	suspicious transaction
•	invoice corruption
incorrect billing
accidental credit
accidental refund
provider credential rotation
financial database recovery
•	disaster recovery
•	
•	───
•	
•	EV. Financial Governance
•	Financial configuration must be:
•	versioned
•	authorized

•	auditable
tenant-scoped
effective-dated
reversible where appropriate

───

•	EW. Configuration
•	Configurable elements include:
•	pricing
•	tax rules
•	billing periods
•	payment providers
payment limits
refund limits
collection policies
grace periods

approval thresholds
Configuration changes must not silently alter historical transactions.

───

EX. Provider Credential Rotation
Provider credentials must support:
secure storage
rotation
expiration
revocation
audit
emergency replacement

───

EY. Financial Data Classification
Classify data into categories such as:
 
Access must correspond to classification.

───

EZ. Tenant Isolation
Every financial object must carry tenant context.
Database-level protections should prevent accidental cross-tenant access.

•	
•	───
•	
•	FA. Financial API Tenant Enforcement
•	Every request must establish:
•	 
•	before financial data is returned or mutated.
•	
───


FB. Cross-Tenant Platform Operations
Platform-level financial operations must be explicitly distinguished from tenant financial operations.

───

FC. Financial Audit
Audit records must preserve:
actor
•	action
•	object
•	previous state
•	new state

•	reason
•	timestamp
•	correlation ID
•	
•	───
•	
FD. Non-Repudiation
High-risk financial actions should provide strong evidence of who initiated and approved them.

───

1.	FE. Financial State Reconstruction
2.	Given a financial object, CoreGrid should be able to answer:
3.	who created it?

4.	why?
5.	from which source?
6.	what changed?
7.	who changed it?
8.	what payment affected it?
9.	what refund affected it?
10.	what adjustment affected it?
11.	what is its current state?
12.	can its historical state be reconstructed?
13.	
14.	───
15.	
16.	FF. Acceptance Criteria
17.	Phase 13 is accepted when:
18.	Products can be defined.
19.	Prices can be versioned.
20.	Billing plans can be defined.

21.	Financial obligations can be created.
22.	Invoices can be created.
23.	Invoice lines can be represented.
24.	Invoice lifecycle is enforced.
25.	Payment intents can be created.
26.	Payment attempts can be represented.
27.	Multiple payment providers can be supported.
28.	Provider adapters are isolated.
29.	Payment methods can be represented.
30.	Webhooks can be securely processed.
31.	Webhooks are idempotent.
32.	Payments can be reconciled.
33.	Settlements can be represented.
34.	Provider fees can be represented.
35.	Partial payments work.
36.	Overpayments work.
37.	Payment allocation works.
38.	Refunds work.
39.	Partial refunds work.

40.	Credits work.
41.	Adjustments work.
42.	Discounts work.
43.	Tax integration exists.
44.	Multi-currency is supported.
45.	Currency conversions are traceable.
46.	Subscriptions are supported.
47.	Usage billing can be supported.
48.	Collections state exists.
49.	Disputes can be represented.
50.	Chargebacks can be represented.
51.	Financial invariants are enforced.
52.	Idempotency exists.
53.	Concurrency protection exists.
54.	Transactional event publishing exists.
55.	Financial provenance exists.
56.	Audit records exist.
57.	Tenant isolation exists.
58.	RBAC exists.
59.	ABAC exists.

60.	Separation of duties exists.
61.	High-risk operations support approval.
62.	Fraud signals can be generated.
63.	Financial limits exist.
64.	Provider failover can be supported safely.
65.	Reconciliation exceptions can be resolved.
66.	Financial state can be reconstructed.
67.	AI cannot bypass financial controls.
68.	Financial agents use least privilege.
69.	Human approval exists for high-risk operations.
70.	Financial APIs are idempotent.
71.	Financial events are versioned.
72.	Historical invoices remain immutable.
73.	Historical payments remain reconstructable.
74.	Refunds cannot exceed refundable value.
75.	Credits cannot exceed available credit.
Payment allocations cannot exceed payment value.
Duplicate webhooks cannot duplicate 

financial effects.
Duplicate payment requests cannot silently double-charge.
Disaster recovery is tested.
Backups are tested.
Provider credentials are securely managed.
Financial exports are controlled.
Financial imports are validated.
Migration preserves financial history.
Observability exists.
Operational runbooks exist.
Compliance responsibilities are documented.
Financial UX exists.
Receipts can be generated.
Financial reporting interfaces exist.
Degraded modes exist.
The financial source of truth remains recoverable.

───

EG. Definition of Done
Phase 13 is complete when CoreGrid can safely execute:
 

 
and additionally:

while preserving complete financial provenance.
1.	The system must be able to answer:
2.	What was charged?
3.	Why was it charged?
4.	Who was charged?
5.	Which invoice generated the obligation?
6.	Which payment satisfied it?
7.	Which provider processed it?

8.	Was the provider response verified?
9.	Was the payment reconciled?
10.	Was any fee deducted?
11.	Was a refund issued?
12.	Who authorized the refund?
13.	What is the current outstanding balance?
14.	Can the entire history be reconstructed?
15.	
16.	───
17.	
18.	EH. Architectural Invariants
19.	Financial history must never be silently rewritten.
20.	Money must never use unsafe floating-point representation.
21.	Every financial mutation must be auditable.
22.	Every critical financial mutation must be idempotent.

23.	Payment providers must remain behind adapters.
24.	Provider webhooks are untrusted until verified.
25.	Duplicate provider events must not create duplicate financial effects.
26.	Refunds cannot exceed refundable amounts.
27.	Credits cannot exceed available credits.
28.	Payment allocations cannot exceed payment value.
29.	Financial state transitions must be explicit.
30.	Historical prices must remain immutable.
31.	Historical invoice amounts must remain reconstructable.
32.	Historical payment amounts must remain reconstructable.
33.	Tenant isolation is mandatory.
34.	Least privilege is mandatory.
35.	High-risk financial actions require elevated controls.

36.	Separation of duties must be supported.
37.	AI cannot independently bypass financial controls.
38.	AI recommendations must remain distinguishable from authoritative financial state.
39.	Provider failure must not corrupt internal financial state.
40.	Payment timeout must not automatically imply payment failure.
41.	Successful provider confirmation must be independently verified.
42.	Reconciliation is a first-class financial process.
43.	Settlement must be distinguished from payment authorization.
44.	Gross payment must be distinguished from provider fees.
45.	Refund must be distinguished from credit.
46.	Adjustment must be distinguished from 

refund.
47.	Invoice must be distinguished from payment.
48.	Financial obligation must be distinguished from invoice.
49.	Financial events must preserve provenance.
50.	Financial configuration must be versioned.
51.	Tax rules must be versioned.
52.	Pricing changes must not rewrite historical transactions.
53.	Financial balances must remain reconstructable.
54.	Financial exports must be authorized and audited.
55.	Financial imports must be validated and deduplicated.
Provider credentials must never be stored in source code.
Raw sensitive payment credentials should remain outside CoreGrid wherever possible.
Financial systems must support disaster 

recovery.
Financial systems must support degraded operation.
Existing financial truth must remain available during provider outages.
Reconciliation discrepancies must never be silently ignored.
Financial anomalies must be observable.
Financial policies must be explicit.
Financial approvals must be auditable.
Financial state must remain independent from UI state.
Financial domain logic must remain independent from a specific payment provider.
Accounting integration must preserve financial provenance.
CoreGrid must never claim regulatory compliance merely because a payment provider is compliant.

Jurisdiction-specific financial rules must remain configurable.
Financial operations must remain explainable.
Production financial state must never be modified by simulation.
Historical financial events must remain recoverable.
Financial correctness takes precedence over convenience.

───

EI. Final Architectural Principle
CoreGrid must treat money as state that requires proof, not merely data stored in a database.
The fundamental FinOS loop is:

 


The financial system must always preserve the distinction between:
what CoreGrid expected to happen, what the payment provider reported happened, what CoreGrid verified happened, and what was ultimately reconciled.
That distinction is foundational to building an institutional-grade financial operating system.

───

EJ. Domain-Neutral Financial Operations for Every Organization
FinOS belongs to CoreGrid, not to one kind of institution. A school charging tuition, a hospital billing a
procedure, a company invoicing a client, a warehouse charging handling, a ministry levying a fee and a
marketplace taking commission are the same financial workflow in different vocabulary. Therefore:

• The debtor and the beneficiary are identity references (Phase 02): a person, an organization, a
household or guardian relationship, an internal cost centre or a partner. The model never names one kind
of payer, and no field assumes a payer is a learner.
• Charge reasons, products, services, discount categories, tax rules, billing calendars and payment
provider choices are institutional data with lifecycle and versioning — configuration, never a code
branch.
• "Tuition", "examination fee", "subscription", "municipal levy" and "marketplace commission" are
examples an organization stores, not cases the engine switches on.
• A scholarship or bursary is one waiver category among many — corporate sponsorship, hardship waiver,
goodwill credit, partner subsidy, promotional discount. FinOS records the financial effect with
provenance; the policy that decides eligibility belongs to the consuming domain, and the platform never
infers entitlement.
• Currency, jurisdiction, tax treatment and available payment methods are resolved per transaction, so an
organization operating across countries or entities does not fork the engine.
• The platform's own revenue is expressed as a split beneficiary (see EK), exactly like any other
beneficiary. There is no privileged "platform fee" code path.
• Surfaces are named for financial processes, never for one institution's role list: authority comes from
Phase 08 as a decision over identity, tenant, relationship, policy and context.

The neutrality obligation is executable, not rhetorical: no domain-neutral financial module may contain a
vertical's vocabulary, the neutrality guard enforces it, and the phase's own intelligence report must
express the same capability in several organizations' own words without a single institution being the
default person.

───

EK. Payment-Provider Neutrality and Split Payments

EK.1 Provider Neutrality
FinOS never depends on one payment provider. A provider is reached only through an adapter that declares:
• its identity and capability set: supported payment methods, currencies, jurisdictions, capture model,
refund model, partial-refund support, split support and webhook signature scheme;
• request, response and webhook translation, with provider-specific errors mapped into FinOS error
classes;
• its tokenization surface — a provider token reference only, never raw card, wallet or bank credential;
• its settlement and fee reporting shape, so provider fees are recorded separately from gross amounts.

Routing is a decision over capability, currency, jurisdiction, tenant policy, risk and cost. A routing
decision is explainable: it names the candidates considered, the capability that disqualified each
rejected candidate, and the policy that applied. Failover re-routes only where the provider proved that
no capture occurred — an attempt that timed out is never treated as a failure (EH 40), because treating
it as one is how systems double-charge.

EK.2 Split Payments
A single gross payment may satisfy multiple beneficiaries. FinOS models this as an explicit split: one
payment, N legs, each leg naming its beneficiary identity, amount, currency, purpose, provider route,
settlement reference and reconciliation state.
• The legs must sum exactly to the gross amount. Over-allocation and under-allocation are refused, never
  silently absorbed or rounded away.
• A split is immutable once created: a correction is a compensating split or a governed adjustment, never
  an edit of a leg whose money has already moved.
• Every leg settles and reconciles on its own. A settlement covering several legs must name them, and a
  leg without settlement evidence stays unsettled even when its siblings are paid.
• Provider fees are attributed to the leg whose route produced them and are never silently deducted from
  the gross amount.
• Refunds are applied across legs pro rata to what each leg received, with any remainder assigned
  deterministically, so refunding a split can never return more from a beneficiary than it received.
• Idempotency is per split: replaying the same split identity produces no second movement of money.
• CoreGrid's own fee is a leg like any other, so platform revenue travels the same ledger, reconciliation
  and reporting path as an institution's, a seller's or a partner's share. There is no privileged path.
• If a beneficiary cannot be paid, the remainder is never silently rolled into another beneficiary's leg:
  the leg stays unresolved until policy resolves it, and the unresolved state is visible.

EK.3 What remains outside
Provider internals, a provider's compliance posture, the pricing policy of consuming domains and the
payout schedules of financial institutions stay outside FinOS. The engine owns the money-movement record
and its proof, and it never assumes that a provider's compliance discharges CoreGrid's own obligations
(see CO).

───

EL. Command Model
Every financial mutation is a command with a declared authority, validation set, idempotency
requirement, approval rule and audit obligation. Commands never trust client-supplied tenant, role,
amount, currency or payment state, and a command either completes atomically with its event or changes
nothing.

• defineProduct / versionPrice — refuses an effective date that would retrospectively rewrite an issued
  invoice, a price with unsafe precision, and a product without a declared category.
• issueInvoice — refuses an unknown debtor, an invoice line without a declared reason, a currency that
  contradicts its lines, a duplicate invoice number, a tenant mismatch between debtor and issuer, and a
  zero-total invoice that is not explicitly marked waived.
• voidInvoice / replaceInvoice — refuses an invoice with money applied to it (the correction must be a
  credit, refund or adjustment) and refuses any request without a reason. An issued invoice is never
  deleted.
• recordObligation — refuses a negative amount, a missing due date, an unknown source and a beneficiary
  outside the tenant boundary.
• createPaymentIntent — refuses an amount above the outstanding balance unless overpayment policy
  explicitly allows it, refuses a currency mismatch with the invoice, and refuses an intent with no
  debtor.
• recordPaymentAttempt — refuses an attempt against a closed intent, a duplicate provider reference, and
  a currency mismatch between intent and attempt.
• confirmPayment — refuses unverified provider evidence. A timeout is recorded as an unresolved attempt,
  never as a failure, and confirmation is accepted only from independently verified provider evidence.
• verifyAndIngestProviderEvent — refuses an invalid signature, an unknown provider and a replayed event
  identity. Ingestion is idempotent on the provider event identity, durable before any financial effect.
• createSplit — refuses legs that do not sum exactly to the gross, a negative leg, a repeated beneficiary
  where policy forbids it, and a route no adapter can serve.
• settleSplitLeg — refuses a leg already settled, a settlement reference that does not exist, and an
  amount that differs from the leg. A settlement covering several legs must name them.
• refundPayment / refundSplit — refuses a refund exceeding the refundable amount per leg, a refund whose
  actor lacks refund authority for that amount, and a high-value refund without the approval policy's
  decision. Refunds are pro-rated across legs with a deterministic remainder.
• applyCredit — refuses a credit beyond its available amount, an expired credit, and a currency mismatch.
• adjustObligation — refuses an adjustment without a reason, without the required authority, and one that
  exceeds the obligation unless an explicit policy permits it. Adjustment is never used as a disguised
  refund.
• recordMeteredUsage — refuses fabricated or negative usage, and refuses usage attributed to a period
  already billed, because billing must not be rewritten after the fact.
• runBatchBilling — refuses a batch without a deterministic idempotency key, so a restarted job cannot
  create duplicate invoices.
• reconcile / resolveReconciliationException — refuses closing an exception without evidence, and refuses
  a resolution that does not name its cause and its correction.
• changeFinancialConfiguration — refuses an unversioned change, a change that would alter historical
  records, and a change without the authority the policy names.
• rotateProviderCredential — refuses without elevated authorization and a recorded reason.

Command rules, uniformly: authenticate, resolve tenant, authorize (Phase 08), validate, execute
atomically, persist the domain event transactionally with the state change, audit the actor and reason,
and return only data the caller may see. Commands classified as high-impact are refused for automated
execution: an agent may propose them, never perform them.

───

EM. Query Model
Queries are read-only: no query may mutate financial state, and no query may be satisfied by
manufactured, preview or simulated data when its subject is production money.

Representative queries: outstanding balance as at a date; an invoice exactly as issued; the payment
history of an obligation; the allocation map of a payment; the refundable amount of a payment and of
each split leg; the settlement status of a split and its legs; reconciliation state with open
exceptions; receivables ageing for a tenant and period; the collection state of a debtor; the tax
breakdown of an invoice; the price that applied on a date; and the complete provenance of any financial
object.

Every financial query obeys five rules.

1. Canonical and derived are labelled. What CoreGrid expected, what the provider reported, what CoreGrid
independently verified and what was reconciled are four distinct answers, never merged into one status.
A projection is never presented as canonical truth.
2. Unknown is returned as unknown. A missing payment, an unsettled leg, an unverified attempt and an
absent exchange rate are states, never defaulted to zero, paid or settled. A balance is either known or
explicitly unknown.
3. Every result carries its as-of context: the instant it was computed, and the configuration versions
that shaped it (price version, tax rule version, exchange rate and its source, billing calendar).
4. Aggregates never reveal an object the caller could not read. Cross-tenant totals are refused rather
than masked, and a total is never a side channel for an inaccessible record.
5. Exports and statements require authority, are audited, are minimized to the purpose, and never
contain provider credentials or full payment-instrument identifiers.

───

EN. Data Model
Separate records, each with its own lifecycle, because collapsing them is how financial systems lose the
ability to prove anything: configuration (versioned), product, price version, billing plan, billing
period and calendar, charge reason, obligation, invoice, invoice line, invoice numbering sequence,
payment intent, payment attempt, provider route decision, split, split leg, settlement, provider fee,
payment allocation, refund, credit, adjustment, discount application, tax rule version, tax line,
metered usage record, subscription and its state changes, collection state, dispute, chargeback,
reconciliation run, reconciliation exception, financial event, outbox entry, audit record and
idempotency record.

Constraints the database enforces, not the application alone: tenant on every financial row; currency
consistency within an invoice, a payment and a split; amounts as integer minor units with a declared
currency precision (never binary floating point); unique invoice number per tenant scope and fiscal
period; split legs summing exactly to their gross; non-negative amounts; refundable amount never
exceeding the received amount per leg; credit application never exceeding available credit; allocation
never exceeding the payment; explicit state-machine columns; immutable historical rows (issued invoices,
price versions, tax versions, exchange rates and financial events are append-only); foreign keys across
obligation, invoice, payment, allocation, refund, credit, split and settlement; and tenant-scoped row
level security so a cross-tenant read is impossible at the storage layer, not merely rejected in code.

Indexes are chosen for the queries that matter: outstanding receivables by tenant and due date, payments
by intent and provider reference, split legs by beneficiary and settlement state, reconciliation
exceptions by state and age, and financial events by aggregate sequence.

Migration and retention: every change is a forward-only migration with a validation step; historical
amounts, currencies, timestamps, references and invoice history are preserved rather than rewritten for
convenience; retention honours legal, tax, financial and privacy obligations, so financial records are
kept while unnecessary personal data is minimized and masked, and no retention rule is used as an excuse
to accumulate personal data that has no financial purpose.

───

EO. Dependency Model
Dependencies point one way. FinOS depends on: Phase 01 (configuration, secrets and verification
discipline), Phase 02 (identity — who owes and who is owed), Phase 03 (tenant boundary), Phase 05
(runtime primitives: commands, queries, events, jobs, idempotency), Phase 08 (authorization decisions),
Phase 09 (trust evidence), Phase 14 (data infrastructure) and Phase 17 (scheduled execution). It never
depends on a domain runtime's vocabulary, on a payment provider's SDK shape, or on any consumer's policy
model.

Consumers call FinOS through its contracts and never reach around them: Phase 10 delivers financial
notifications but never decides financial state; Phase 17 automates financial workflows but cannot bypass
a control; Phase 18 reads financial facts and never mutates them; Phase 25 sends marketplace money
movement through FinOS primitives while keeping marketplace logic; Phase 27 bills through FinOS;
Phase 49 coordinates economic activity above FinOS rather than beside it; Phase 11 and Phase 12 create
obligations (fees, services, bookings) and read payment state but never write financial records; Phase 15
and Phase 16 supply facility and twin facts that may price a service, never money movement.

The boundary rules that keep the dependency graph acyclic: pricing policy belongs to the consuming
domain while price records belong to FinOS; entitlement and eligibility decisions belong to the domain
that owns the policy while the financial effect is recorded by FinOS; communication, analytics and
automation are downstream of financial facts, never upstream of financial truth; and no phase may keep a
second money record, because a duplicated ledger is a boundary violation rather than a feature.

If a dedicated accounting subsystem is introduced later (see BF), it enters as a consumer of FinOS
financial events through an adapter that preserves provenance, and it replaces nothing in the dependency
direction above.

───

EP. Financial Memory and Knowledge Model
Financial memory and platform knowledge are different things and are stored differently.

Organization memory (tenant-scoped, purpose-limited, retained under policy): decision memory (who
approved what, on which evidence, under which policy version), dispute memory (claims, evidence,
resolution and the reasoning), reconciliation exception memory (the cause, the correction and the
pattern), collection memory (what was attempted, what was promised, what happened), customer billing
memory (payment reliability per debtor, where lawful), and configuration history (which price, tax,
calendar and limit versions applied when). Memory is never a shadow ledger: it explains financial
records, it does not become an alternative source of money truth.

Platform knowledge (cross-tenant, no tenant-identifying data): the provider capability catalogue,
payment-method taxonomies, failure and error taxonomies mapped across providers, reconciliation
exception classes, currency and minor-unit metadata, tax jurisdiction catalogues, and observed provider
behaviour such as settlement latency and failure rates. Knowledge is evidence, versioned and dated, and
it may inform routing and risk decisions without exposing one tenant to another.

Three laws govern knowledge. First, learning is evidence, not authority: a fraud signal, a settlement
prediction or a routing preference is recorded with its evidence, confidence and uncertainty, and it
remains a proposal until an organization's policy adopts it. Second, knowledge never widens access: no
aggregate or trained signal may reveal another tenant's financial object, and knowledge stores carry no
tenant-identifying fields. Third, retention is explicit: memory expires under the tenant's policy and
legal obligations, knowledge under platform policy, and neither accumulates personal data without a
financial purpose.

AI operates inside this model and never replaces it: models may detect anomalies, predict failures,
prioritise collections and assist reconciliation, but authoritative financial state changes only through
deterministic commands with authority, approval and audit (see ED, EE, EF, EG).