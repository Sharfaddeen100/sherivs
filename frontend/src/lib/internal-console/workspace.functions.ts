/**
 * Internal Console workspace, runtime, and recent-access writes.
 * Service-role after capability / membership checks. No client grants.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertInternalAal2 } from "@/lib/security/mfa-server";
import { writeAuditRecord } from "@/lib/server/write-audit";
import { SystemClock, TimeAuthority } from "@/lib/kernel/time-authority";
import { CONSOLE_PATHS } from "./paths";
import {
  isMissingRelation,
  isUniqueViolation,
  mapRuntimeRecord,
  mapWorkspaceRecord,
  slugifyWorkspaceName,
  store,
} from "./store";
import type { InternalWorkspace } from "./workspaces";
import {
  REGISTERED_RUNTIMES,
  SCHOLAR_RUNTIME_CONTRACT,
  type ConsoleRuntimeContract,
} from "./runtime-contract";
import type { RecentResource } from "./recent";

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

type Ctx = {
  supabase: { rpc: RpcClient["rpc"] };
  claims: { exp: number; aal?: unknown };
  userId: string;
};

type Admin = Awaited<ReturnType<typeof admin>>;

const timeAuthority = new TimeAuthority(new SystemClock());

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertCapability(context: Ctx, capability: string) {
  assertInternalAal2(context.claims);
  const { data, error } = await (context.supabase as unknown as RpcClient).rpc(
    "has_platform_capability",
    { p_capability: capability },
  );
  if (error || data !== true) throw new Error("Not authorized");
}

async function requireActiveStaff(db: Admin, userId: string): Promise<void> {
  const { data, error } = await store(db)
    .from("platform_staff")
    .select("id, status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as { id: string; status: string } | null;
  if (!row || row.status !== "active") {
    const { data: superRow } = await db
      .from("super_admins")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!superRow) throw new Error("Only active platform staff can join a workspace.");
  }
}

async function audit(
  context: Ctx,
  action: string,
  recordId: string | null,
  details: Record<string, unknown>,
) {
  await writeAuditRecord(await admin(), {
    action: `platform_workspace.${action}`,
    gate: "has_platform_capability:platform.staff.manage",
    tenantId: null,
    actorId: context.userId,
    table: "platform_workspace",
    recordId,
    outcome: "succeeded",
    details,
  });
}

export async function loadAuthorizedWorkspaces(
  db: Admin,
  userId: string,
  displayName: string,
  canManage: boolean,
): Promise<InternalWorkspace[] | null> {
  const { data, error } = await store(db)
    .from("platform_workspace")
    .select("id, slug, name, description, kind, status, owner_id")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return null;
    throw new Error(error.message);
  }
  const rows = (data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    kind: "personal" | "shared";
    status: "active" | "archived";
    owner_id: string;
  }>;
  const { data: members, error: memberErr } = await store(db)
    .from("platform_workspace_member")
    .select("workspace_id, user_id, access");
  if (memberErr) {
    if (isMissingRelation(memberErr)) return null;
    throw new Error(memberErr.message);
  }
  const memberships = (members ?? []) as Array<{
    workspace_id: string;
    user_id: string;
    access: "owner" | "member";
  }>;
  const mine = new Map(
    memberships
      .filter((row) => row.user_id === userId)
      .map((row) => [row.workspace_id, row.access]),
  );
  const visible = rows.filter((row) => canManage || mine.has(row.id));
  return visible.map((row) =>
    mapWorkspaceRecord(
      row,
      mine.get(row.id) ?? (row.owner_id === userId ? "owner" : "member"),
      row.kind === "personal" ? displayName : row.name,
      memberships
        .filter((member) => member.workspace_id === row.id)
        .map((member) => ({ userId: member.user_id, access: member.access })),
    ),
  );
}

export async function ensurePersonalWorkspace(db: Admin, userId: string): Promise<void> {
  const { error } = await store(db).rpc("ensure_platform_personal_workspace", {
    p_user_id: userId,
  });
  if (error && !isMissingRelation(error)) throw new Error(error.message);
}

export async function ensureRegisteredRuntimes(db: Admin): Promise<void> {
  for (const [index, runtime] of REGISTERED_RUNTIMES.entries()) {
    const { error } = await store(db)
      .from("platform_runtime")
      .upsert(
        {
          id: runtime.id,
          name: runtime.name,
          description: runtime.description,
          entry_origin: runtime.entryOrigin,
          entry_path: runtime.entryPath,
          help_href: runtime.helpHref,
          status: runtime.status,
          sort_order: (index + 1) * 10,
        },
        { onConflict: "id" },
      );
    if (error && !isMissingRelation(error)) throw new Error(error.message);
  }
}

export async function loadRegisteredRuntimes(db: Admin): Promise<ConsoleRuntimeContract[] | null> {
  const { data, error } = await store(db)
    .from("platform_runtime")
    .select("id, name, description, entry_origin, entry_path, help_href, status")
    .eq("status", "operational_product")
    .order("sort_order", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return null;
    throw new Error(error.message);
  }
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    description: string;
    entry_origin: string;
    entry_path: string;
    help_href: string;
    status: string;
  }>;
  return rows.length ? rows.map(mapRuntimeRecord) : [SCHOLAR_RUNTIME_CONTRACT];
}

export async function loadRecentAccess(
  db: Admin,
  userId: string,
  allowedHrefs: ReadonlySet<string>,
): Promise<RecentResource[] | null> {
  const { data, error } = await store(db)
    .from("platform_recent_access")
    .select("resource_key, title, href, kind, accessed_at")
    .eq("user_id", userId)
    .order("accessed_at", { ascending: false })
    .limit(8);
  if (error) {
    if (isMissingRelation(error)) return null;
    throw new Error(error.message);
  }
  return (
    (data ?? []) as Array<{
      resource_key: string;
      title: string;
      href: string;
      kind: string;
      accessed_at: string;
    }>
  )
    .filter((row) => allowedHrefs.has(row.href))
    .map((row) => ({
      id: row.resource_key,
      title: row.title,
      href: row.href,
      kind: row.kind,
      at: row.accessed_at,
    }));
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9_-]{0,62}$/)
    .optional(),
});

export const createSharedWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCapability(context as unknown as Ctx, "platform.staff.manage");
    const db = await admin();
    const slug =
      data.slug ??
      `${slugifyWorkspaceName(data.name).slice(0, 56)}-${context.userId.replace(/-/g, "").slice(0, 6)}`;
    const now = timeAuthority.now().at;
    const { data: created, error } = await store(db)
      .from("platform_workspace")
      .insert({
        slug,
        name: data.name,
        description: data.description ?? "",
        kind: "shared",
        status: "active",
        owner_id: context.userId,
        created_by: context.userId,
        updated_at: now,
      })
      .select("id, slug")
      .single();
    if (error) {
      throw new Error(
        isUniqueViolation(error) ? "A workspace with that slug already exists." : error.message,
      );
    }
    const id = (created as { id: string }).id;
    const { error: memberErr } = await store(db).from("platform_workspace_member").insert({
      workspace_id: id,
      user_id: context.userId,
      access: "owner",
      added_by: context.userId,
    });
    if (memberErr) throw new Error(memberErr.message);
    await audit(context as unknown as Ctx, "create", id, { name: data.name, slug });
    return { id, slug, href: CONSOLE_PATHS.workspace(id) };
  });

const memberSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const addWorkspaceMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => memberSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCapability(context as unknown as Ctx, "platform.staff.manage");
    const db = await admin();
    const { data: workspace, error } = await store(db)
      .from("platform_workspace")
      .select("id, kind, status")
      .eq("id", data.workspaceId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const row = workspace as { id: string; kind: string; status: string } | null;
    if (!row || row.kind !== "shared" || row.status !== "active") {
      throw new Error("Shared workspace not found.");
    }
    await requireActiveStaff(db, data.userId);
    const { error: memberErr } = await store(db).from("platform_workspace_member").insert({
      workspace_id: data.workspaceId,
      user_id: data.userId,
      access: "member",
      added_by: context.userId,
    });
    if (memberErr) {
      throw new Error(
        isUniqueViolation(memberErr) ? "That person is already a member." : memberErr.message,
      );
    }
    await audit(context as unknown as Ctx, "member.add", data.workspaceId, { userId: data.userId });
    return { ok: true };
  });

export const removeWorkspaceMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => memberSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCapability(context as unknown as Ctx, "platform.staff.manage");
    if (data.userId === context.userId) throw new Error("Use archive to leave ownership.");
    const db = await admin();
    const { error } = await store(db)
      .from("platform_workspace_member")
      .delete()
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", data.userId)
      .eq("access", "member");
    if (error) throw new Error(error.message);
    await audit(context as unknown as Ctx, "member.remove", data.workspaceId, {
      userId: data.userId,
    });
    return { ok: true };
  });

const archiveSchema = z.object({ workspaceId: z.string().uuid() });

export const archiveSharedWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => archiveSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCapability(context as unknown as Ctx, "platform.staff.manage");
    const db = await admin();
    const { data: workspace, error: loadErr } = await store(db)
      .from("platform_workspace")
      .select("id, kind")
      .eq("id", data.workspaceId)
      .maybeSingle();
    if (loadErr) throw new Error(loadErr.message);
    const row = workspace as { id: string; kind: string } | null;
    if (!row || row.kind !== "shared") throw new Error("Only shared workspaces can be archived.");
    const { error } = await store(db)
      .from("platform_workspace")
      .update({ status: "archived", updated_at: timeAuthority.now().at })
      .eq("id", data.workspaceId)
      .eq("kind", "shared");
    if (error) throw new Error(error.message);
    await audit(context as unknown as Ctx, "archive", data.workspaceId, {});
    return { ok: true };
  });

const recentSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  href: z.string().regex(/^\/console(?:\/|$)/),
  kind: z.string().min(1).max(40),
  at: z.string().min(1),
});

export const rememberConsoleResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => recentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isStaff, error: staffErr } = await (context.supabase as unknown as RpcClient).rpc(
      "is_platform_staff",
    );
    if (staffErr || isStaff !== true) throw new Error("Not authorized");
    const db = await admin();
    const { error } = await store(db).from("platform_recent_access").upsert(
      {
        user_id: context.userId,
        resource_key: data.id,
        title: data.title,
        href: data.href,
        kind: data.kind,
        accessed_at: data.at,
      },
      { onConflict: "user_id,resource_key" },
    );
    if (error && !isMissingRelation(error)) throw new Error(error.message);
    return { ok: true };
  });
