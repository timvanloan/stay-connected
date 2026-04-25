"use client";

import { Turnstile } from "@marsidev/react-turnstile";

type TurnstileGateProps = {
  siteKey: string;
  onToken: (token: string | null) => void;
};

/**
 * Renders Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Secret must be configured in Supabase Auth → Attack Protection / Captcha.
 */
export function TurnstileGate({ siteKey, onToken }: TurnstileGateProps) {
  return (
    <div className="flex justify-center min-h-[65px]">
      <Turnstile
        siteKey={siteKey}
        onSuccess={onToken}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
        options={{ theme: "light", size: "normal" }}
      />
    </div>
  );
}
