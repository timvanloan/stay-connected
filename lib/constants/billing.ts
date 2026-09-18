/** Display price for marketing; real charge amount is set on the Stripe Price. */
export const PLAN_NAME = "Stay Connected";
export const PLAN_PRICE_LABEL = "$6 / month";
export const PLAN_TAGLINE =
  "Private daily check-ins with a partner or a small circle of friends (up to 10).";

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
]);

export function isSubscriptionActive(
  status: string | null | undefined
): boolean {
  return !!status && ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}

/** Client-safe: publishable key present means billing UI can be shown. */
export function isBillingUiEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

/** Server: secret + price required for Checkout / Portal / webhooks. */
export function isStripeServerConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID
  );
}
