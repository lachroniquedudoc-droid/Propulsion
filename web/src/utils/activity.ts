import { supabase } from "./supabase/client";

export async function logActivity(
  memberId: string,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await supabase.from("member_activity_logs").insert({
      member_id: memberId,
      event_type: eventType,
      metadata,
    });
  } catch {
    // Non-blocking — activity logging must never break UX
  }
}
