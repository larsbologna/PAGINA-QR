import { Check, RotateCcw } from "lucide-react";
import { setReviewedAction } from "@/app/panel/[slug]/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReviewToggle({ slug, feedbackId, reviewed, size = "sm" }: { slug: string; feedbackId: string; reviewed: boolean; size?: "sm" | "md" }) {
  return (
    <form action={setReviewedAction.bind(null, slug, feedbackId, !reviewed)}>
      <SubmitButton variant={reviewed ? "ghost" : "secondary"} size={size} pendingText="Guardando…">
        {reviewed ? <RotateCcw className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
        {reviewed ? "Marcar sin revisar" : "Marcar revisada"}
      </SubmitButton>
    </form>
  );
}
