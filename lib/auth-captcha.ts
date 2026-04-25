/**
 * When Supabase Auth has captcha / bot protection enabled (e.g. Cloudflare Turnstile),
 * merge this into `options` for sign-in / sign-up, or into the second argument for
 * `resetPasswordForEmail`.
 */
export function buildAuthCaptchaOptions(token: string | null | undefined): {
  captchaToken?: string;
} {
  if (!token?.trim()) return {};
  return { captchaToken: token.trim() };
}

export function turnstileSiteKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return k || undefined;
}
