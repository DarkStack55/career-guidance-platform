import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch, getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

type SubRow = {
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  environment: string;
};

async function loadActiveSubscription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  environment: PaddleEnv,
): Promise<SubRow> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("paddle_subscription_id, paddle_customer_id, product_id, price_id, status, environment")
    .eq("user_id", userId)
    .eq("environment", environment)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Could not load your subscription");
  if (!data) throw new Error("No active subscription found");
  return data as SubRow;
}

async function resolvePaddlePriceId(environment: PaddleEnv, priceId: string): Promise<string> {
  const res = await gatewayFetch(environment, `/prices?external_id=${encodeURIComponent(priceId)}`);
  if (!res.ok) throw new Error("Price lookup failed");
  const json = (await res.json()) as { data?: Array<{ id: string }> };
  if (!json.data?.length) throw new Error("Price not found");
  return json.data[0].id;
}

/** Immediate, pro-rated switch between Pro and Mentor+. */
export const changeSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const sub = await loadActiveSubscription(supabase, userId, data.environment);
    if (sub.price_id === data.priceId) return { changed: false as const };

    const paddlePriceId = await resolvePaddlePriceId(data.environment, data.priceId);
    const res = await gatewayFetch(data.environment, `/subscriptions/${sub.paddle_subscription_id}`, {
      method: "PATCH",
      body: JSON.stringify({
        items: [{ price_id: paddlePriceId, quantity: 1 }],
        proration_billing_mode: "prorated_immediately",
      }),
    });
    if (!res.ok) {
      console.error("Plan change failed", await res.text());
      throw new Error("Could not change your plan. Please try again.");
    }
    return { changed: true as const };
  });

/** Hosted billing portal (cancel, payment method, invoices). */
export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const sub = await loadActiveSubscription(supabase, userId, data.environment);
    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(sub.paddle_customer_id, [
      sub.paddle_subscription_id,
    ]);
    return { url: session.urls.general.overview };
  });
