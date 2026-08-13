import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Loader2 } from "lucide-react";
import { SubPageShell } from "@/components/SubPageShell";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/mentors/book")({
  head: () => ({
    meta: [
      { title: "Book a 1:1 Session — CareerPilot AI" },
      { name: "description", content: "Reserve a private session that fits your schedule and goals." },
      { property: "og:title", content: "Book a 1:1 Session — CareerPilot AI" },
      { property: "og:description", content: "Reserve a private session that fits your schedule and goals." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const { loading, isMentorPlus } = useSubscription();

  if (loading && user) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isMentorPlus) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="glass-strong rounded-2xl p-10">
          <div className="mx-auto size-12 rounded-xl bg-primary/15 grid place-items-center">
            <Lock className="size-5 text-primary" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">1:1 mentor sessions are a Mentor+ feature</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Mentor+ includes two private mentor sessions every month, priority interview feedback
            and personal roadmap check-ins.
          </p>
          <Link
            to={user ? "/pricing" : "/login"}
            className="mt-7 inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90"
          >
            {user ? "Upgrade to Mentor+" : "Sign in to upgrade"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SubPageShell
      eyebrow="Mentors"
      title="Book a 1:1 Session"
      description="Reserve a private session that fits your schedule and goals."
      parentLabel="Mentors"
      parentTo="/mentors"
    />
  );
}
