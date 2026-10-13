import { setStatusAction } from "@/app/panel/[slug]/actions";
import { STATUS_LABELS, type FollowUp } from "@/lib/status";
import { cn } from "@/lib/cn";

const ORDER: FollowUp[] = ["NEW", "IN_PROGRESS", "REVIEWED"];
const ACTIVE: Record<FollowUp, string> = {
  NEW: "bg-slate-900 text-white",
  IN_PROGRESS: "bg-amber-500 text-white",
  REVIEWED: "bg-emerald-600 text-white",
};

/** Selector del estado de seguimiento: Nueva → En seguimiento → Resuelta. */
export function StatusControl({ slug, feedbackId, status }: { slug: string; feedbackId: string; status: FollowUp }) {
  return (
    <div role="group" aria-label="Estado de seguimiento" className="inline-flex rounded-lg border border-line bg-white p-0.5 text-xs font-medium">
      {ORDER.map((s) => (
        <form key={s} action={setStatusAction.bind(null, slug, feedbackId, s)}>
          <button
            type="submit"
            aria-pressed={status === s}
            disabled={status === s}
            className={cn("rounded-md px-2.5 py-1.5 transition-colors", status === s ? ACTIVE[s] : "text-slate-600 hover:bg-slate-100")}
          >
            {STATUS_LABELS[s]}
          </button>
        </form>
      ))}
    </div>
  );
}
