CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and environment = check_env
      and status in ('active','trialing','past_due')
      and (current_period_end is null or current_period_end > now())
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_plan(user_uuid uuid, plan_product_id text, check_env text DEFAULT 'live'::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and environment = check_env
      and product_id = plan_product_id
      and status in ('active','trialing','past_due')
      and (current_period_end is null or current_period_end > now())
  );
$function$;

REVOKE ALL ON FUNCTION public.has_plan(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_plan(uuid, text, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated, service_role;