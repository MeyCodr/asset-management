import cron from "node-cron";

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  // Runs every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/phniams";
      const res = await fetch(`${baseUrl}${basePath}/api/notifications/license-expiry`, {
        method: "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
      });
      const data = await res.json();
      console.log("[scheduler] License expiry check:", data);
    } catch (err) {
      console.error("[scheduler] License expiry check failed:", err);
    }
  }, { timezone: "Asia/Kuala_Lumpur" });

  console.log("[scheduler] License expiry cron started — runs daily at 9:00 AM MYT");
}
