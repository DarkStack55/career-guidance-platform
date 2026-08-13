import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "@/hooks/use-auth";

export type PlanId = "free" | "pro_plan" | "mentor_plus_plan";

export type SubscriptionState = {
  loading: boolean;
  plan: PlanId;
  status: string | null;
  /** Paid access — cancelled plans lose access immediately. */
  isActive: boolean;
  isPro: boolean;
  isMentorPlus: boolean;
  /** Renewal payment failed; access kept while the provider retries. */
  isPastDue: boolean;
  currentPeriodEnd: string | null;
  refresh: () => void;
};

const ACTIVE = ["active", "trialing", "past_due"];

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [row, setRow] = useState<{
    product_id: string;
    status: string;
    current_period_end: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("subscriptions")
      .select("product_id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("environment", getPaddleEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setRow(data ?? null);
        setLoading(false);
      });

    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, tick, refresh]);

  const status = row?.status ?? null;
  const notExpired =
    !row?.current_period_end || new Date(row.current_period_end).getTime() > Date.now();
  const isActive = !!status && ACTIVE.includes(status) && notExpired;
  const plan: PlanId = isActive && row ? (row.product_id as PlanId) : "free";

  return {
    loading,
    plan,
    status,
    isActive,
    isPro: isActive && (plan === "pro_plan" || plan === "mentor_plus_plan"),
    isMentorPlus: plan === "mentor_plus_plan" && isActive,
    isPastDue: status === "past_due",
    currentPeriodEnd: row?.current_period_end ?? null,
    refresh,
  };
}
