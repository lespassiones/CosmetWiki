import type { Metadata } from "next";
import { getAppConfig } from "@/lib/appConfig";

// Shown by the middleware rewrite when the admin enables maintenance mode.
// Rendered dynamically so the toggle takes effect on the next request without
// a redeploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maintenance · Cosme Check",
  robots: { index: false, follow: false },
};

const DEFAULT_MESSAGE =
  "Cosme Check est momentanément en maintenance. Nous revenons très vite, merci de ta patience.";

export default async function MaintenancePage() {
  const cfg = await getAppConfig();
  const message =
    cfg.maintenance_message && cfg.maintenance_message.trim().length > 0
      ? cfg.maintenance_message
      : DEFAULT_MESSAGE;

  return (
    <main className="min-h-svh flex items-center justify-center px-5 py-10 bg-[#FAFAFA]">
      <section className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-[0_8px_24px_-12px_rgba(17,17,17,0.08)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-2xl">
          🛠️
        </div>
        <h1 className="text-[22px] font-bold leading-tight text-[#111111]">
          Maintenance en cours
        </h1>
        <p className="mx-auto mt-3 max-w-sm whitespace-pre-line text-[14px] leading-relaxed text-[#6B7280]">
          {message}
        </p>
      </section>
    </main>
  );
}
