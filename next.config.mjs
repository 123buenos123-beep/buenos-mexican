// value of PHASE_DEVELOPMENT_SERVER from next/constants (not importable in .mjs config)
const PHASE_DEVELOPMENT_SERVER = 'phase-development-server';

/* ── Content Security Policy ──
   Allowlist of everything the site legitimately loads; anything else is
   blocked by the browser (XSS / injected-script mitigation).
   - challenges.cloudflare.com : Turnstile CAPTCHA (script + widget iframe + telemetry)
   - www.google.com            : Google Maps embed (Location section)
   - fonts.googleapis/gstatic  : Google Fonts stylesheet + font files
   - *.supabase.co (https+wss) : database REST, auth, and realtime websocket
   - assets.mixkit.co          : admin dashboard new-booking chime
   - img-src https:            : newsletter admin preview renders editor-pasted
                                 image URLs (Imgur, flaticon social icons, …)
   - 'unsafe-inline'           : required by styled-jsx <style> tags, framer-motion
                                 style attrs, Next.js hydration scripts & JSON-LD
   - 'unsafe-eval' (DEV ONLY)  : webpack/turbopack eval source maps            */
const buildCsp = (isDev) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https://assets.mixkit.co",
  // *.challenges.cloudflare.com: Turnstile shards challenge beacons across random subdomains
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://www.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'", // clickjacking protection (CSP successor to X-Frame-Options)
  'upgrade-insecure-requests',
].join('; ');

const buildSecurityHeaders = (isDev) => [
  { key: 'Content-Security-Policy', value: buildCsp(isDev) },
  // stop browsers MIME-sniffing responses into executable types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // send full referrer same-origin, origin-only cross-origin, nothing on downgrade
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // legacy clickjacking fallback for old browsers (matches frame-ancestors 'self')
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // the site never needs these powerful APIs — deny them outright
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  // NOTE: Strict-Transport-Security is set automatically by Vercel at the edge.
];

/** @type {(phase: string) => import('next').NextConfig} */
export default function nextConfig(phase) {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: buildSecurityHeaders(isDev),
        },
      ];
    },
  };
}
