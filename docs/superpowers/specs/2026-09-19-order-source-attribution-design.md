# Order Source Attribution — Design

**Date:** 2026-09-19
**Status:** Approved design, pending implementation plan

## Problem

Orders record who bought and what they paid, but nothing about **where the customer
came from**. There is no way to tell whether an order originated from a Facebook ad,
a TikTok video, Google search, or a direct visit — so ad spend cannot be evaluated
against actual revenue.

Confirmed by inspection: `Order` (`prisma/schema.prisma:302`) has no attribution
fields, and a repo-wide search for `utm_`, `fbclid`, `gclid`, `ttclid` and
`document.referrer` returns zero hits in `src/`.

## Goals

1. Record the traffic source of every new order.
2. Show that source on the admin order detail page.
3. Filter the admin orders list by source.
4. Break down orders, revenue and AOV by source in admin analytics.

## Non-Goals

- Backfilling existing orders. The signal was never captured; it cannot be recovered.
  Pre-launch orders display "Unknown".
- Multi-touch fractional attribution models. First-touch and last-touch only.
- Replacing Meta Pixel / CAPI / GTM. This is complementary first-party data.
- Distinguishing paid from organic **within Meta** — see Constraints.

## Constraints and Honest Limitations

**The ad links currently carry no UTM parameters.** Detection therefore relies
primarily on platform click IDs, which the ad platforms append automatically.

| Click ID | Platform | Implies paid? |
|---|---|---|
| `gclid`, `gbraid`, `wbraid` | Google Ads | Yes — only ever set by Google Ads |
| `ttclid` | TikTok | Yes |
| `msclkid` | Microsoft/Bing Ads | Yes |
| `fbclid` | Meta | **No** — set on all Meta outbound clicks, ads and organic alike |

Consequences to accept:

- **Meta paid vs organic cannot be separated** without UTMs. Both resolve to
  `facebook` / `instagram`.
- **`fbclid` alone cannot distinguish Facebook from Instagram.** Where the referrer
  is stripped (common in in-app browsers), the channel resolves to `facebook` and
  the detail card must label it "Meta — exact app unknown" rather than assert Facebook.
- **`document.referrer` is unreliable for exactly the highest-value sources.** Meta and
  TikTok in-app browsers frequently strip or rewrite it. Click IDs are the dependable
  signal; referrer is a fallback only.
- **Attribution data is client-supplied and therefore spoofable.** Accepted: this is
  analytics, not authorization. Mitigated by server-side length caps and channel
  whitelisting, so the worst case is a junk row.

Adding UTMs to ad links later removes the first two limitations. See Appendix A.

## Architecture

Client-side capture, following the existing `DataLayerProvider` pattern.

```
Landing page load
  -> AttributionProvider (mounted in Providers)
  -> resolveTouch(search, referrer, pathname)   [pure]
  -> attribution-store (zustand + persist -> localStorage)
  -> checkout-client reads { first, last }
  -> createOrder validates with zod
  -> Order.sourceChannel / firstSourceChannel / attribution
```

Rejected alternative: server-side capture via `middleware.ts` + HttpOnly cookie.
Trusted and unspoofable, but the project has no middleware today, middleware runs on
every request, and it is the most common source of ISR/caching regressions in Next 16.
That risk to a live storefront is not justified for a reporting feature. Client-side
capture is also the only way to read `document.referrer` at all.

## Data Model

Hybrid: flat indexed columns for what gets filtered and grouped, one `Json` blob for
detail — mirroring the existing `courierCheckData Json?` at `schema.prisma:336`.

```prisma
// Traffic attribution (best-effort, captured client-side)
sourceChannel      String?  // normalized last-touch channel, e.g. "facebook"
firstSourceChannel String?  // normalized first-touch channel
attribution        Json?    // { first: TouchData | null, last: TouchData | null }

@@index([sourceChannel])
```

`String?` rather than a Prisma enum: `utm_source` is open-ended, so an enum would
force future values (e.g. an influencer campaign `utm_source=rakib_promo`) into
"OTHER" and lose them. Values are validated against a canonical TS list at write time,
which keeps `groupBy` fast while remaining extensible without a migration.

### TouchData

```ts
type TouchData = {
  channel: string;            // canonical, e.g. "facebook"
  source: string | null;      // utm_source, or inferred platform
  medium: string | null;      // utm_medium, or "paid" | "organic" | "referral" | "direct"
  campaign: string | null;    // utm_campaign
  content: string | null;     // utm_content
  term: string | null;        // utm_term
  clickId: string | null;     // raw click-ID value
  clickIdType: string | null; // "fbclid" | "gclid" | "ttclid" | ...
  referrer: string | null;    // full referrer URL
  landingPage: string | null; // path + query of the page where the touch occurred
  timestamp: string;          // ISO 8601
};
```

### Canonical channels

`facebook`, `instagram`, `messenger`, `tiktok`, `google_ads`, `google_organic`,
`youtube`, `whatsapp`, `bing`, `pinterest`, `snapchat`, `twitter`, `linkedin`,
`email`, `referral`, `direct`.

Anything unrecognized with an external referrer resolves to `referral`, preserving the
full referrer URL in the Json blob.

## Source Resolution

`resolveTouch()` applies, in strict priority order:

1. **UTM parameters** — `utm_source` wins outright when present. Future-proofs the
   system for when UTMs are added to ad links.
2. **Click IDs** — `fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`, `msclkid`, `epik`,
   `twclid`, `sccid`, `li_fat_id`. Sets `medium: "paid"` for all except `fbclid`,
   which is left `null` because it does not imply paid traffic.
3. **Referrer host** — mapped against a domain table covering the mobile and link-shim
   variants that actually appear in practice: `l.facebook.com`, `lm.facebook.com`,
   `m.facebook.com`, `l.instagram.com`, `vm.tiktok.com`, `wa.me`,
   `api.whatsapp.com`, `youtu.be`, and `google.*` across ccTLDs.
4. **Direct** — no params and no referrer.

## Capture Layer

Three new files, each mirroring an established pattern in the repo.

| File | Mirrors | Role |
|---|---|---|
| `src/lib/attribution.ts` | `src/lib/data-layer.ts` | Pure `resolveTouch()` + channel constants and labels |
| `src/store/attribution-store.ts` | `src/store/cart-store.ts:97` | zustand + `persist` to `localStorage` |
| `src/components/analytics/attribution-provider.tsx` | `data-layer-provider.tsx` | Mounts in `Providers`, records touches |

### Two rules that determine correctness

**1. Self-referrer guard.** After a customer lands from Facebook, every internal click
sets `document.referrer` to this site's own domain. Without a guard, last-touch
silently rewrites itself to `referral / <own domain>` and the true source is destroyed
before checkout. Therefore: **discard any touch whose referrer host equals the current
host and which carries no campaign parameters.** This is the single highest-risk
detail in the feature.

**2. First-touch is write-once** within a rolling 30-day window. Last-touch updates
only on a genuine new external touch, as defined by rule 1.

### Persistence

`localStorage`, via the same `createJSONStorage` mechanism already used by
`cart-store.ts`. Stored shape: `{ first, last, firstSetAt }`. A first-touch older than
30 days is replaced rather than extended.

## Server Integration

`checkout-client.tsx:252` adds `attribution: { first, last }` to the `createOrder`
payload. `createOrder` (`src/actions/orders.ts:211`) validates it with a new zod schema
at `src/schemas/attribution.ts`:

- every string length-capped (referrer and landingPage 500, others 200)
- `channel` whitelisted against the canonical list; unrecognized values coerced to
  `referral`, never rejected
- parsing via `safeParse`; on failure, all three columns are written as `null`

**Non-negotiable:** attribution is wrapped in try/catch and defaults to `null`.
An analytics failure must never block a real order. This is enforced at the call site,
not only inside the parser.

## Admin Surfaces

### 1. Order detail — `src/app/(admin)/admin/orders/[id]/page.tsx`

A "Traffic Source" card inserted after Payment Information, showing the last-touch
channel as a badge, first-touch beside it when it differs, plus campaign, landing page
and referrer. Where the channel was inferred from `fbclid` with no referrer, the card
labels it "Meta — exact app unknown" rather than claiming Facebook.

Requires adding the three fields to `OrderDetailData` (`src/actions/admin/orders.ts:24`)
and to the serializer in `getOrderById` (`:231`).

### 2. Orders list — `src/app/(admin)/admin/orders/page.tsx`

A source badge column, plus `source?: string` added to the `getAdminOrders` options
object (`:72`) and a matching filter dropdown.

### 3. Analytics — `src/app/(admin)/admin/analytics/page.tsx`

New `getOrdersBySource(dateFrom, dateTo)` in `src/actions/admin/analytics.ts` using
`db.order.groupBy({ by: ['sourceChannel'], _count, _sum: { total } })`, rendered as a
chart plus a table of orders / revenue / AOV per source. `recharts` is already a
dependency. Orders predating the feature group under "Unknown".

## Failure Modes

| Failure | Behaviour |
|---|---|
| `localStorage` unavailable (private mode) | Capture no-ops; order saves with `null` attribution |
| Malformed or oversized attribution payload | zod rejects; order saves with `null` attribution |
| Referrer stripped by in-app browser | Falls back to click ID; if none, `direct` |
| JS disabled | No capture; order still completes normally |
| Pre-existing orders | `sourceChannel` is `null`; UI renders "Unknown" |

In every case the order completes.

## Verification

No test framework exists in this project and none is being added, per decision. The
resolver will be verified manually against the dev server, and observed results
reported rather than assumed:

1. `/?fbclid=TEST123` — expect `facebook`, `clickIdType: fbclid`, `medium: null`
2. `/?gclid=TEST123` — expect `google_ads`, `medium: "paid"`
3. `/?ttclid=TEST123` — expect `tiktok`, `medium: "paid"`
4. `/?utm_source=facebook&utm_medium=paid&utm_campaign=eid` — UTMs take priority
5. Land with `?fbclid=X`, then navigate several pages internally, then order —
   **last-touch must still be `facebook`, not `referral`** (self-referrer guard)
6. Direct visit, no params, no referrer — expect `direct`
7. Order placed with `localStorage` cleared mid-session — order must still complete

## Rollout

1. Schema change + `prisma migrate dev` — additive and nullable, so no downtime and
   no risk to existing rows.
2. Capture layer and checkout wiring.
3. Admin surfaces.
4. Manual verification per the list above.

Attribution accrues only for orders placed after deploy.

## Appendix A — Adding UTMs to Ad Links

Doing this unlocks paid-vs-organic separation and campaign-level detail. The resolver
already prioritizes UTMs, so no code change is needed when these are added.

**Meta Ads** — Ads Manager, ad level, "URL parameters" field:

```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

**Google Ads** — final URL suffix (auto-tagging already supplies `gclid`):

```
utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}
```

**TikTok Ads** — ad level URL parameters:

```
utm_source=tiktok&utm_medium=paid&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__
```

Macro syntax differs per platform and changes over time; confirm the exact tokens in
each platform's current UI before saving.
