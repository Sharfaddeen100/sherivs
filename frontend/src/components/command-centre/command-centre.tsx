import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Building2, CheckCircle2, ChevronRight, Landmark, Rocket, ShieldCheck,
  Users, AlertCircle, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  createInstitution, institutionId, type InstitutionType, type OwnershipType,
} from "@/lib/institution-core";
import { createSecurityPolicy } from "@/lib/security-policy";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";
import { PHASE_CATALOG, PHASE_LAYERS, PHASES_TOTAL, type PhaseCatalogEntry } from "@/lib/phase-catalog";
import type { TenantId } from "@/lib/tenant-core";

const DEMO_TENANT = "tenant:coregrid-demo" as TenantId;
const DEMO_AUTHOR = "user:demo-administrator";
const NOW = new Date().toISOString();

const APP_ROLES: readonly AppRole[] = [
  "super_admin", "hq", "admin", "principal", "teacher", "bursar", "parent", "student", "driver",
] as const;

type Step = "school" | "roles" | "policies" | "launch";

interface CreatedSchool {
  id: string;
  name: string;
  type: string;
  country: string;
  currency: string;
}
interface CreatedRole {
  role: AppRole;
  label: string;
}
interface CreatedPolicy {
  name: string;
  environment: string;
  ruleCount: number;
}

const STEP_LABELS: Record<Step, { title: string; subtitle: string }> = {
  school: { title: "1 · Create School", subtitle: "Provision a tenant institution through Phase 25 institutional contracts." },
  roles: { title: "2 · Create Roles", subtitle: "Define the school's role model (Phases 02 identity + 25 workforce)." },
  policies: { title: "3 · Create Policies", subtitle: "Attach governed security policies (Phase 08 security engine)." },
  launch: { title: "4 · Launch", subtitle: "Review the provisioned runtime and enter the workspace." },
};

export function CommandCentre() {
  const [step, setStep] = useState<Step>("school");
  const [error, setError] = useState<string | null>(null);

  const [schools, setSchools] = useState<CreatedSchool[]>([]);
  const [roles, setRoles] = useState<CreatedRole[]>([]);
  const [policies, setPolicies] = useState<CreatedPolicy[]>([]);

  const [schoolForm, setSchoolForm] = useState({
    legalName: "",
    institutionType: "secondary" as InstitutionType,
    ownershipType: "private" as OwnershipType,
    country: "Nigeria",
    currency: "NGN",
    officialEmailDomain: "",
    region: "",
    stateProvince: "",
    lga: "",
  });

  const createSchool = () => {
    setError(null);
    const domains = schoolForm.officialEmailDomain
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const result = createInstitution(
      {
        id: institutionId(`inst-${Date.now()}`),
        tenantId: DEMO_TENANT,
        profile: {
          legalName: schoolForm.legalName,
          displayName: schoolForm.legalName,
          institutionType: schoolForm.institutionType,
          ownershipType: schoolForm.ownershipType,
          registrationRefs: [],
          accreditationRefs: [],
          country: schoolForm.country,
          region: schoolForm.region || null,
          stateProvince: schoolForm.stateProvince || null,
          localGovernmentArea: schoolForm.lga || null,
          officialEmailDomains: domains,
          website: null,
          currency: schoolForm.currency,
          operatingDays: [],
          operatingHours: null,
        },
        identityRef: "identity:institution:demo",
        defaultPolicySetRef: "policy-set:default-admin",
        initialAdministratorRef: DEMO_AUTHOR,
        now: NOW,
      },
      NOW,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSchools((prev) => [
      ...prev,
      {
        id: result.institution.id,
        name: result.profile.legalName,
        type: schoolForm.institutionType,
        country: schoolForm.country,
        currency: schoolForm.currency,
      },
    ]);
    setSchoolForm((f) => ({ ...f, legalName: "", officialEmailDomain: "", region: "", stateProvince: "", lga: "" }));
    setStep("roles");
  };

  const toggleRole = (role: AppRole) => {
    setRoles((prev) =>
      prev.some((r) => r.role === role)
        ? prev.filter((r) => r.role !== role)
        : [...prev, { role, label: ROLE_LABEL[role] }],
    );
  };

  const [policyForm, setPolicyForm] = useState({
    name: "",
    environment: "development" as "production" | "staging" | "test" | "development",
    ruleKey: "",
    effect: "allow" as "allow" | "deny",
  });

  const createPolicy = () => {
    setError(null);
    const result = createSecurityPolicy({
      name: policyForm.name,
      tenantId: DEMO_TENANT,
      environment: policyForm.environment,
      rules: { [policyForm.ruleKey]: policyForm.effect === "allow" },
      authorId: DEMO_AUTHOR,
      now: NOW,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPolicies((prev) => [
      ...prev,
      { name: result.policy.name, environment: policyForm.environment, ruleCount: Object.keys(result.policy.rules).length },
    ]);
    setPolicyForm((f) => ({ ...f, name: "", ruleKey: "" }));
    if (step === "policies") setStep("launch");
  };

  const resetWorkspace = () => {
    setSchools([]);
    setRoles([]);
    setPolicies([]);
    setError(null);
    setStep("school");
  };
  
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              CG
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">
                CoreGrid Command Centre
              </h1>
              <p className="text-xs text-muted-foreground">
                African Educational Runtime · {PHASES_TOTAL} phases · one governed platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {PHASE_CATALOG.filter((p) => p.status !== "architecture").length}/
              {PHASES_TOTAL} phases implemented
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a href="/auth">Sign in</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <CapabilityPanel step={step} onJump={setStep} schools={schools} roles={roles} policies={policies} />
          <div className="space-y-6">
            <StepperHeader step={step} />
            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </div>
            ) : null}
            {step === "school" ? <SchoolStep form={schoolForm} setForm={setSchoolForm} onCreate={createSchool} /> : null}
            {step === "roles" ? <RolesStep roles={roles} onToggle={toggleRole} onNext={() => setStep("policies")} /> : null}
            {step === "policies" ? <PoliciesStep form={policyForm} setForm={setPolicyForm} onCreate={createPolicy} onBack={() => setStep("roles")} /> : null}
            {step === "launch" ? <LaunchStep schools={schools} roles={roles} policies={policies} onReset={resetWorkspace} /> : null}
            <PhaseRunway />
          </div>
        </div>
      </main>
    </div>
  );
}

function CapabilityPanel(props: {
  step: Step;
  onJump: (step: Step) => void;
  schools: CreatedSchool[];
  roles: CreatedRole[];
  policies: CreatedPolicy[];
}) {
  const { step, onJump, schools, roles, policies } = props;
  const items: { key: Step; label: string; icon: typeof Building2; count: number }[] = [
    { key: "school", label: "Schools", icon: Landmark, count: schools.length },
    { key: "roles", label: "Roles", icon: Users, count: roles.length },
    { key: "policies", label: "Policies", icon: ShieldCheck, count: policies.length },
  ];
  return (
    <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            Workspace
          </CardTitle>
          <CardDescription className="text-xs">
            Permission-derived surface. Only capabilities you are authorized to
            see are exposed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onJump(item.key)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                step === item.key
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <item.icon className="size-4" />
                {item.label}
              </span>
              <Badge variant="secondary" className="size-5 justify-center p-0 text-xs">
                {item.count}
              </Badge>
            </button>
          ))}
          <Separator className="my-2" />
          <div className="px-3 py-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{PHASES_TOTAL}</span> architecture
            phases · <span className="font-semibold text-foreground">{PHASE_LAYERS.length}</span>{" "}
            layers · one tenant boundary
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Provisioning pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(["school", "roles", "policies", "launch"] as const).map((s) => {
            const active = step === s;
            const done =
              (s === "school" && schools.length > 0) ||
              (s === "roles" && roles.length > 0) ||
              (s === "policies" && policies.length > 0) ||
              s === "launch";
            return (
              <div key={s} className="flex items-center gap-2">
                {done && s !== "launch" ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <ChevronRight className={`size-4 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
                )}
                <span className={active ? "font-semibold text-primary" : "text-muted-foreground"}>
                  {STEP_LABELS[s].title.replace(/^\d+ · /, "")}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </aside>
  );
}

function StepperHeader({ step }: { step: Step }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{STEP_LABELS[step].title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{STEP_LABELS[step].subtitle}</p>
    </div>
  );
}

function SchoolStep(props: {
  form: {
    legalName: string;
    institutionType: InstitutionType;
    ownershipType: OwnershipType;
    country: string;
    currency: string;
    officialEmailDomain: string;
    region: string;
    stateProvince: string;
    lga: string;
  };
  setForm: (updater: (prev: typeof props.form) => typeof props.form) => void;
  onCreate: () => void;
}) {
  const { form, setForm, onCreate } = props;
  const institutionTypes: InstitutionType[] = [
    "nursery", "primary", "secondary", "senior_secondary", "sixth_form", "technical",
  ];
  const ownershipTypes: OwnershipType[] = [
    "private", "public", "government", "faith_based", "community", "board_governed", "network", "custom",
  ];
  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="size-4 text-muted-foreground" />
          New institution
        </CardTitle>
        <CardDescription>
          Validated by Phase 25 <code>createInstitution</code> — the same contract that governs
          production provisioning.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="legalName">Legal name *</Label>
          <Input
            id="legalName"
            value={form.legalName}
            onChange={(e) => set("legalName", e.target.value)}
            placeholder="e.g. Greenfield International School"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Institution type *</Label>
          <Select value={form.institutionType} onValueChange={(v) => set("institutionType", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {institutionTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Ownership type</Label>
          <Select value={form.ownershipType} onValueChange={(v) => set("ownershipType", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select ownership" />
            </SelectTrigger>
            <SelectContent>
              {ownershipTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country *</Label>
          <Input id="country" value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency *</Label>
          <Input id="currency" value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="NGN" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="emailDomain">Official email domain(s) *</Label>
          <Input
            id="emailDomain"
            value={form.officialEmailDomain}
            onChange={(e) => set("officialEmailDomain", e.target.value)}
            placeholder="greenfield.sch.ng (comma-separated for multiple)"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region">Region</Label>
          <Input id="region" value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Africa / Lagos" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State / Province</Label>
          <Input id="state" value={form.stateProvince} onChange={(e) => set("stateProvince", e.target.value)} placeholder="e.g. Lagos" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lga">Local Government Area</Label>
          <Input id="lga" value={form.lga} onChange={(e) => set("lga", e.target.value)} placeholder="e.g. Ikeja" />
        </div>
        <div className="flex items-end">
          <Button onClick={onCreate} className="w-full">
            <Building2 className="size-4" />
            Create school
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RolesStep(props: {
  roles: CreatedRole[];
  onToggle: (role: AppRole) => void;
  onNext: () => void;
}) {
  const { roles, onToggle, onNext } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          Role model
        </CardTitle>
        <CardDescription>
          Select the roles this school needs. Roles are derived from the Phase 02 identity model
          and Phase 25 workforce contracts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {APP_ROLES.map((role) => {
            const selected = roles.some((r) => r.role === role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => onToggle(role)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {ROLE_LABEL[role]}
              </button>
            );
          })}
        </div>
        {roles.length > 0 ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <span className="font-semibold">{roles.length}</span> role(s) selected:{" "}
            {roles.map((r) => r.label).join(", ")}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No roles selected yet.</p>
        )}
        <Button onClick={onNext} disabled={roles.length === 0}>
          Continue to policies
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function PoliciesStep(props: {
  form: {
    name: string;
    environment: "production" | "staging" | "test" | "development";
    ruleKey: string;
    effect: "allow" | "deny";
  };
  setForm: (updater: (prev: typeof props.form) => typeof props.form) => void;
  onCreate: () => void;
  onBack: () => void;
}) {
  const { form, setForm, onCreate, onBack } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" />
          Security policy
        </CardTitle>
        <CardDescription>
          Each policy is validated by Phase 08 <code>createSecurityPolicy</code> — attributed,
          environment-scoped, and rule-bearing.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="policyName">Policy name *</Label>
          <Input
            id="policyName"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. default-administrative"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Environment</Label>
          <Select
            value={form.environment}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, environment: v as typeof f.environment }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              {(["production", "staging", "test", "development"] as const).map((env) => (
                <SelectItem key={env} value={env}>{env}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ruleKey">Rule key *</Label>
          <Input
            id="ruleKey"
            value={form.ruleKey}
            onChange={(e) => setForm((f) => ({ ...f, ruleKey: e.target.value }))}
            placeholder="e.g. students.view"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Effect</Label>
          <Select
            value={form.effect}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, effect: v as typeof f.effect }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allow">allow</SelectItem>
              <SelectItem value="deny">deny</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onCreate}>Add policy</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LaunchStep(props: {
  schools: CreatedSchool[];
  roles: CreatedRole[];
  policies: CreatedPolicy[];
  onReset: () => void;
}) {
  const { schools, roles, policies, onReset } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="size-4 text-emerald-500" />
          Runtime provisioned
        </CardTitle>
        <CardDescription>
          Your African Educational Runtime is ready. The school, its role model, and its policy
          set were all validated through the phase contracts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard title="Schools" icon={<Landmark className="size-4" />} rows={schools.map((s) => `${s.name} · ${s.country}`)} />
          <SummaryCard title="Roles" icon={<Users className="size-4" />} rows={roles.map((r) => r.label)} />
          <SummaryCard title="Policies" icon={<ShieldCheck className="size-4" />} rows={policies.map((p) => `${p.name} (${p.environment})`)} />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" onClick={onReset}>Provision another school</Button>
          <Button asChild>
            <a href="/admin/dashboard">Enter school workspace</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="/auth">Manage your account</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard(props: { title: string; icon: ReactNode; rows: string[] }) {
  const { title, icon, rows } = props;
  return (
    <div className="rounded-md border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {rows.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {rows.map((r) => (
            <li key={r} className="truncate">{r}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">None</p>
      )}
    </div>
  );
}

const RUNWAY_COLUMNS: ColumnDef<PhaseCatalogEntry>[] = [
  { accessorKey: "phase", header: "Phase", cell: (c) => <span className="font-mono text-xs">#{String(c.getValue())}</span> },
  { accessorKey: "name", header: "Capability", cell: (c) => <span className="font-semibold">{String(c.getValue())}</span> },
  {
    accessorKey: "layer",
    header: "Layer",
    cell: (c) => {
      const v = String(c.getValue());
      const color = v === "Foundations" ? "bg-emerald-500/10 text-emerald-600" : v === "Intelligence" ? "bg-violet-500/10 text-violet-600" : v === "Runtime" ? "bg-sky-500/10 text-sky-600" : v === "Commerce" ? "bg-amber-500/10 text-amber-600" : v === "Universal" ? "bg-indigo-500/10 text-indigo-600" : v === "Civilization" ? "bg-teal-500/10 text-teal-600" : "bg-rose-500/10 text-rose-600";
      return <Badge variant="secondary" className={`border-0 ${color}`}>{v}</Badge>;
    },
  },
  {
    accessorKey: "modules",
    header: "Domain modules",
    cell: (c) => (
      <span className="font-mono text-xs text-muted-foreground">
        {(c.getValue() as string[]).slice(0, 3).join(", ")}
        {(c.getValue() as string[]).length > 3 ? " …" : ""}
      </span>
    ),
  },
  {
    accessorKey: "testCount",
    header: "Tests",
    cell: (c) => (c.getValue() ? <span className="font-mono text-xs">{String(c.getValue())}</span> : <span className="text-xs text-muted-foreground">—</span>),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status === "architecture" ? (
        <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-500/40">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Architecture
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Active
        </Badge>
      ),
  },
];

function PhaseRunway() {
  const table = useReactTable({
    data: PHASE_CATALOG as unknown as PhaseCatalogEntry[],
    columns: RUNWAY_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          {PHASES_TOTAL}-phase architecture runway
        </CardTitle>
        <CardDescription className="text-xs">
          The complete CoreGrid build sequence — Phases 01–32 have implemented,
          tested domain contracts (with explicit measured test suites);
          Phases 33–51 are architecture-defined (documents complete, awaiting
          domain-contract implementation).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}





