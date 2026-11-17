import { createFileRoute } from "@tanstack/react-router";
import { BATCH, cronSecret, currentSlot, DAILY_GIFT_COINS, slotMessage } from "@/lib/bot-daily.server";

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

// Called by an external scheduler every ~10 minutes with ?key=<secret>.
// Sends at most BATCH messages per run; players get each slot once.
export const Route = createFileRoute("/api/public/telegram/daily")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env["TELEGRAM_BOT_TOKEN"];
        if (!token) return new Response("not configured", { status: 500 });
        if (new URL(request.url).searchParams.get("key") !== (await cronSecret(token))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { data: locked } = await db.rpc("wall_job_lock" as never, { _name: "daily", _seconds: 50 } as never);
        if (!locked) return Response.json({ ok: true, skipped: "running" });

        const slot = currentSlot();
        let giftId: string | null = null;
        if (slot.hour === 8) {
          const { data, error } = await db.rpc("wall_today_gift" as never, { _amount: DAILY_GIFT_COINS } as never);
          if (error) return Response.json({ error: error.message }, { status: 500 });
          giftId = data as unknown as string;
        }
        const { data: users, error } = await db.from("wall_users")
          .select("tg_id, first_name")
          .eq("bot_blocked" as never, false as never)
          .or(`notified_slot.is.null,notified_slot.neq.${slot.key}`)
          .limit(BATCH);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let sent = 0, blocked = 0;
        for (const u of users ?? []) {
          const m = slotMessage(slot.hour, esc(u.first_name || "Soldier"), giftId);
          const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: u.tg_id, parse_mode: "HTML", ...m }),
          });
          if (res.status === 429) break; // Telegram rate limit: stop, next run continues
          const patch: Record<string, unknown> = { notified_slot: slot.key };
          if (res.status === 403 || res.status === 400) { patch["bot_blocked"] = res.status === 403; blocked++; } else sent++;
          await db.from("wall_users").update(patch as never).eq("tg_id", u.tg_id);
          await new Promise((r) => setTimeout(r, 40));
        }
        await db.from("wall_jobs" as never).update({ locked_until: new Date().toISOString() } as never).eq("name", "daily");
        return Response.json({ ok: true, slot: slot.key, sent, blocked, remaining: (users?.length ?? 0) === BATCH });
      },
    },
  },
});
