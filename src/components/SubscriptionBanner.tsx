import { AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSubscription } from "@/hooks/useSubscription";

/** Dunning banner: shown while a renewal payment is being retried. Access is kept. */
export function SubscriptionBanner() {
  const { isPastDue } = useSubscription();
  if (!isPastDue) return null;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground flex items-start gap-2.5">
      <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
      <p>
        <span className="font-semibold">We couldn&apos;t take your last payment.</span>{" "}
        Your plan stays active while we retry. Update your payment method from{" "}
        <Link to="/pricing" className="text-primary font-semibold underline">
          billing
        </Link>{" "}
        to avoid losing access.
      </p>
    </div>
  );
}
