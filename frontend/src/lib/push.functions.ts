/**
 * Push notification server functions.
 *
 * Server-only push delivery is loaded inside handlers so the service-role /
 * VAPID code never reaches the client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tokenMsRemaining } from "@/lib/auth-helpers";
import { requireStaffContext } from "@/lib/security-role-gate";

const dispatchSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(500),
});

/** Deliver a push ping to a set of users in the caller's school. */
export const dispatchPushToUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => dispatchSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Pushing to other users is a staff capability, never open to any member.
    await requireStaffContext(context.supabase, "teaching_staff", {
      lifecycle: null,
      sessionValid: typeof context?.claims?.exp === "number" && tokenMsRemaining(context.claims.exp) > 0,
    });
    const { deliverPushToUsers } = await import("@/lib/push.server");
    const result = await deliverPushToUsers(context.supabase, data.userIds);
    return {
      attempted: result.attempted,
      delivered: result.delivered,
      skipped: result.skippedReason ?? null,
    };
  });

/** Send a test push to the signed-in user so they can confirm setup works. */
export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { deliverPushToUsers } = await import("@/lib/push.server");
    const result = await deliverPushToUsers(context.supabase, [context.userId]);
    return {
      delivered: result.delivered,
      skipped: result.skippedReason ?? null,
    };
  });
