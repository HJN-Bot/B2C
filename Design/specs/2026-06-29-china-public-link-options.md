# SpeakSpark China Public Link Options — 2026-06-29

## Summary

SpeakSpark's app is currently a static SPA backed by remote Supabase functions. The app does not need a new dynamic hosting stack for the current China deployment milestone. The missing piece is a stable, shareable China-accessible entry URL.

Current known state:
- Vercel production is stable for overseas access: `https://speakspark-one.vercel.app`.
- Tencent EdgeOne Pages has the latest static build, but the default `edgeone.cool` domain uses a 3-hour `eo_token`, so it cannot be used as a public stable link.
- Supabase project `jyofoabobuwfowpctbfd` remains the active backend. Do not migrate to `mgufxtpqbcjoyadqcxzg` in this milestone.

## Options

### A. EdgeOne Pages + Custom Domain + Overseas Acceleration

Use a custom domain on EdgeOne Pages without mainland acceleration.

Pros:
- Can be completed quickly once a domain and DNS access are available.
- Stable shareable URL.
- No ICP filing required for overseas acceleration.

Cons:
- Mainland access may be better than Vercel but not truly mainland-native.

Blocker:
- Need a domain and DNS control.

### B. EdgeOne Pages + Custom Domain + Mainland Acceleration

Use EdgeOne Pages with a custom domain and mainland acceleration after ICP filing.

Pros:
- Best long-term China access path.
- Keeps current static deployment architecture.

Cons:
- ICP filing usually takes days to weeks.
- May require a Tencent Cloud resource, such as a low-cost Lighthouse server, to obtain a filing service code if EdgeOne Pages free tier does not provide one.

Blockers:
- Domain real-name verification.
- ICP filing decision.
- Filing service code or eligible Tencent Cloud resource.

### C. Cloudflare Pages

Deploy to Cloudflare Pages.

Conclusion:
- Not recommended for the China-stable-access milestone. `*.pages.dev` is also unreliable in mainland China, and Cloudflare's mainland acceleration path requires Enterprise/JD Cloud style arrangements plus ICP.

### D. Borrowed Filed Subdomain

Use a subdomain from an already ICP-filed domain.

Pros:
- Potentially fastest way to get a mainland-accelerated shareable URL.

Cons:
- Depends on another owner and can be revoked.
- Suitable as a bridge, not a long-term product home.

### E. Low-Cost Tencent Cloud Server

Buy the low-cost Tencent Cloud server package only if needed for ICP filing service code.

Conclusion:
- Not needed to host the current static SPA.
- Useful only as filing infrastructure for option B.

## Recommendation

Use A immediately and start B in parallel:
1. Bind a custom domain to EdgeOne Pages with overseas acceleration to get a stable link quickly.
2. Start ICP filing for the same domain if Jianan wants long-term mainland-native speed.
3. Optionally use D as a bridge during ICP filing if a trusted filed subdomain is available.

Cloudflare is not the right primary solution for this specific China access problem.

## Jianan Decisions Needed

1. Domain choice:
   - Buy a normal `.com` domain.
   - Use a cheap promotional domain.
   - Borrow a filed subdomain temporarily.
2. ICP filing:
   - Start now or defer.
3. Tencent Cloud filing resource:
   - Buy the low-cost server only if needed for filing service code.
4. DNS ownership:
   - Decide which account owns DNSPod / EdgeOne access.

## Validation Checklist

After a domain is available:
1. Bind domain in EdgeOne Pages.
2. Complete DNS verification.
3. Confirm HTTPS certificate issuance.
4. Deploy latest `dist`.
5. Test:
   - root path
   - hash route refresh
   - practice page load
   - Supabase `gemini-proxy`
   - Deepgram environment variable behavior
6. Record final public URL in `Design/HANDOVER.md` and `Design/dev-memory/SESSION-WIP.md`.
