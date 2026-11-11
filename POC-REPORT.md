# Retail AEM + Next.js POC Report

Plan: `POC-PLAN.md`. Status: **complete, 2026-11-11.** Run against the stage dispatcher (`http://dispatcher.stage.tirerack.net`) on VPN. Evidence screenshots are in `poc-evidence/`.

## Answer

**Yes, with a host contract.** Next.js can fetch Retail's AEM fragments on the server and render the header, footer, head libraries and SEO content so they look like production, with AEM fetched at most once a minute. What does not work is everything the header asks of the Java app: sign-in state, cart count, search suggestions, Tomcat-served icons, and a few page globals. Those are not AEM problems; they are the contract a new host must meet.

| Question | Answer |
| --- | --- |
| 1. Can Next.js fetch the AEM fragments server-side? | Not through Akamai on `www.tirerack.com` (block page returned as HTTP 200). Yes through the internal dispatchers on VPN. |
| 2. Do AEM's stylesheets and scripts work inside a Next.js document? | Yes, when kept scripts run as plain `<script>` elements in source order after stubs for `s`, `s_gi`, `dataLayer` and `sessionIsSet`. AEM's CSS restyles every plain host element. |
| 3. How much of the header works without the Java app? | Look, layout and menus work. Sign-in state, cart count, search and the cart link do not: they call the Java app. |

## Success criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Next.js fetches all four fragments server-side from the stage dispatcher | Yes | Steps 1 to 5 logs |
| SEO blurb and a size-specific title in the server HTML of `/tires/[size]` | Yes | Step 2 |
| Header and footer match production at 375 px and 1280 px | Yes, except the fixed header covers about 55 px of content and the Live Chat badge is a broken image | `poc-evidence/step5-*` |
| Header menus and search open and close, by mouse and keyboard, `aria-expanded` matching production | Menus and account panel open by mouse. Search does not open (needs the Java app). Escape closes nothing and there is no `aria-expanded` or focus ring, but production is the same | Step 6 |
| Every header call to the Java app listed with purpose and status | Yes, 5 kinds of call, all 404 from localhost | Step 6 |
| AEM fetched at most once a minute per fragment, on a production build | Yes | Step 7 |
| No browser request to a host outside the CSP list during load and interactions | Yes. Google Fonts (allowed) only; ResellerRatings and `http://` LivePerson images were blocked | Steps 4c and 6 |
| Style leaks between AEM's CSS and the host page listed | Yes | `poc-evidence/step4c-style-probe-diffs.txt` |

## What a production version would need

1. **An AEM host the server can reach.** The internal dispatcher works on VPN; a deployed host needs network access to it, or an Akamai allow rule for server-side requests. `getAemFragment` must also treat the Akamai block page (HTTP 200) as a failure, which it does.
2. **The Java app's session and cart contract**, proxied or reimplemented: `/rest/v1/UserProfileService/getUser`, `/rest/v1/cartService/getCartDetails`, `/includes/Components/querySuggestions.jsp`, `/cart/HoldingArea.jsp`, and Tomcat-served `/images/*`.
3. **Page globals the JSP sets:** `s` and `s_gi` (or real Adobe Analytics), `dataLayer`, `sessionIsSet`, `phoneNumber`.
4. **Header spacing:** reserve the fixed header's height, which AEM's page grid (`aem-GridColumn`) provides on AEM pages.
5. **A style contract:** AEM's CSS restyles every bare element, so host-owned UI must be scoped or must adopt AEM's base styles.
6. **Cache invalidation on publish:** the fetch can carry cache tags (as wholesale-next's `aemSdk.ts` does) so an AEM publish can call `revalidateTag`.
7. **UsableNet** (or an approved replacement) restored; it was dropped for the POC only.
8. **Accessibility gaps that already exist on production:** no skip link, no `aria-expanded`, Escape does not close menus, no visible focus ring.
9. **In a `[partner]` app**, fragment fetching would move to `[partner]/layout.tsx`.

## Notes on how the POC was built

- Next 16.0.1 / React 19.2.0 (pinned to match wheelrack-next and wholesale-next; JFrog did not carry 16.4.6). Packages installed with `jf npm install`.
- Kept scripts render as plain `<script>` elements rather than `next/script` (see Step 4c).
- Hydration warnings from AEM changing the DOM are recorded, not suppressed.

## Step 0 — Server fetch check (2026-11-11)

**Result: blocked.** Akamai does not serve the AEM fragments to a server-side request. The POC cannot continue against `https://www.tirerack.com` until Web Systems / DevOps allows it or gives an internal host.

### What was run

`curl` from a developer laptop, no VPN, against `https://www.tirerack.com/content/tirerack/desktop/`, with three User-Agents:

| User-Agent | Fragment | Status | Bytes | What came back |
| --- | --- | --- | --- | --- |
| `curl/8` (plain) | `en.seocontent.225.45.17.html` | 200 | 906 | Akamai block page |
| `curl/8` (plain) | `en.headerResponsive.html` | 200 | 906 | Akamai block page |
| `TireRack-Tomcat-poc` (Java app style) | `en.seocontent.225.45.17.html` | 200 | 906 | Akamai block page |
| `TireRack-Tomcat-poc` (Java app style) | `en.headerResponsive.html` | 200 | 906 | Akamai block page |
| `wholesale-frontend-…` (from `wholesale-next/src/app/actions/aemSdk.ts`) | `en.seocontent.225.45.17.html` | 200 | 906 | Akamai block page |
| `wholesale-frontend-…` (from `wholesale-next/src/app/actions/aemSdk.ts`) | `en.headerResponsive.html` | 200 | 906 | Akamai block page |

The expected header fragment is about 78 KB; the SEO blurb about 1 KB.

### The block page

- Body: "We're sorry. This page is currently unavailable." with a contact for `siteusage@tirerack.com`.
- Reference number: `18.841c2117.1794436464.2455a255`
- Response headers: `server: AkamaiNetStorage`, `akamai-grn: 0.841c2117.1794436473.245630e2`
- **It returns HTTP 200**, not 403. A status check alone would treat it as success.

### What this tells us

- The same URLs return the real fragments in a browser (checked 2026-11-11, see `AEM-FINDINGS.md`), so the block is Akamai bot protection, not AEM.
- A named User-Agent does not get through, including the one wholesale-next sends. That User-Agent is not an allowlist entry for these paths.
- Spoofing a browser to get past the check was not tried, on purpose. The right fix is an allow rule or an internal host.

### For the build, once unblocked

`getAemFragment` must treat this page as a failure even though it is a 200: for example, reject a response whose body contains "This page is currently unavailable" or that lacks the expected fragment markup.

### Retry against the internal dispatchers (on VPN, same day)

Hosts from `retail_desktop` `TRUtil.getCQHostName()` (see `AEM-FINDINGS.md`). Plain `curl`, no custom User-Agent.

| Host | Fragment | Status | Bytes | Time |
| --- | --- | --- | --- | --- |
| `http://dispatcher.stage.tirerack.net` | `en.headerResponsive.html` | 200 | 77,561 | 0.21 s |
| `http://dispatcher.stage.tirerack.net` | `en.seocontent.225.45.17.html` | 200 | 1,053 | 0.16 s |
| `http://dispatcher.stage.tirerack.net` | `.../whytirerack/_jcr_content/root/container/testtrack.html` | 404 | 133,370 | 0.83 s |
| `http://dispatchers-int.tirerack.com` (prod) | `en.headerResponsive.html` | 200 | 73,561 | 0.24 s |
| `http://dispatchers-int.tirerack.com` (prod) | `en.seocontent.225.45.17.html` | 200 | 1,053 | 0.14 s |
| `http://dispatchers-int.tirerack.com` (prod) | `.../whytirerack/_jcr_content/root/container/testtrack.html` | 404 | 131,714 | 0.33 s |

**Result: Step 0 passes on VPN.** Both dispatchers serve the real fragments to a server-side request, with no Akamai block. Open question 1 is answered: use an internal dispatcher host. Open question 2 is half answered: the dispatchers are reachable from a laptop on VPN, but the one component path tried still returns 404, so component-by-path is not confirmed (the path may be wrong).

The POC now needs VPN, which changes the plan's "no VPN" goal and the `AEM_HOST` decision.

## Step 1 — Scaffold (2026-11-11)

**Done.** `create-next-app` scaffolded into a temp folder and moved in. Packages installed with `jf npm install`. JFrog did not carry the template's Next 16.4.6, so versions are pinned to match wheelrack-next and wholesale-next: Next 16.0.1, React 19.2.0. The template's `cacheComponents` setting was removed (fed-standards). `getAemFragment` fetched the footer from the stage dispatcher: 27,469 characters, 172 ms; the reload was a cache hit in 3 ms.

## Step 2 — SEO blurb route (2026-11-11)

**Done.** `/tires/225-45-17` renders "About 225/45R17 Tires" in the server HTML with the title "225/45R17 Tires | Tire Rack". `/tires/abc` returns 404. A valid but unknown size (`255-35-19.5` → `en.seocontent.255.35.19_5.html`) returns 200 with an empty body from AEM, so the page shows only the host heading.

## Step 3 — Footer (2026-11-11)

**Done.** The footer fragment is in the root layout on every route. With `AEM_HOST` pointed at an unreachable address, every fetch timed out at about 5,000 ms and pages still rendered (200) with an empty footer slot. In dev, the 404 page draws the footer client-side from the RSC payload rather than in the server HTML.

## Step 4a — Asset proxy (2026-11-11)

**Done.** `next.config.ts` rewrites `/etc.clientlibs`, `/etc/designs` and `/content/dam` to `AEM_HOST`. All 36 root-relative asset paths in the three fragments return 200 through `localhost:3000`.

## Step 4b — Keep list and CSP (2026-11-11)

**Done.** `keepList.ts` holds 12 rules; `extractScripts.ts` strips every `<script>`, `<link>` and `<style>` from the fragments and keeps only matches. Server HTML has no script or stylesheet outside the keep list.

- In `next dev`, the raw fragment HTML (with the dropped tags as text) appears inside React's dev-only debug data. It never executes. The production build HTML has none of the dropped vendor names.
- Stage fragments contain no Akamai scripts (those are added by Akamai on the public host).

## Step 4c — Head libs (2026-11-11)

**Done.** Stylesheets render as `<link precedence="aem">`; scripts render as plain `<script>` elements in source order, after the stubs.

- **Deviation from the plan:** the plan named `next/script` `beforeInteractive`. Plain `<script>` elements in the server HTML were used instead, which the plan allowed as the alternative: the browser runs them in document order, exactly like the JSP. Console stamps confirm the order: stubs → `webApplicationBaseURL` → clientlibs-external → clientlibs-responsive → trust carousel → phone scripts.
- **CSP blocked:** `http://seals.resellerratings.com/seal.php` (a vendor seal in the footer, not in the earlier inventory) and `http://www.tirerack.com/images/liveperson/*` and `/images/css_elements/livechat/*` (plain `http://` image URLs inside the fragments). Only Google Fonts left localhost.
- **Style leaks (`/style-probe`):** AEM's CSS restyles every plain host element: Lato font and `rgb(60,56,55)` text everywhere, `h1` uppercase and weight 900, list bullets and padding removed, button border and background removed, input padding and border changed, `body` margin 0. A CSS-module class keeps its own properties but inherits AEM's font. Full list: `poc-evidence/step4c-style-probe-diffs.txt`; screenshots on and off.

## Step 5 — Header (2026-11-11)

**Done.** The header matches production at 1280 px and 375 px (`poc-evidence/step5-*`). Differences:

- **Fixed header covers content.** `#newHeader` is `position: fixed`, 174 px tall. On production, AEM's page grid adds `aem-GridColumn` classes so the header wrapper reserves 174 px; the bare fragment's wrapper is 119 px, so the page content starts about 55 px under the header. A host must reserve the header height.
- Live Chat badge shows a broken image (LivePerson dropped; its image URLs are `http://` and blocked by CSP).
- The header fragment contains two `<header>` elements. Neither AEM nor the JSP host has a skip link, so there is no skip target to match.
- `TypeError: Cannot read properties of undefined (reading 'auth')`: the kept Google-login script also calls `AppleID.auth`, and the Apple script was dropped on purpose (login is out of scope).

## Step 6 — Header behaviour audit (2026-11-11)

Calls the header makes to the Java app from `localhost:3000`, all 404:

| Call | Purpose | Status |
| --- | --- | --- |
| `/rest/v1/UserProfileService/getUser` (same-origin JSONP) | Sign-in state, "Hello, Sign In" | 404 |
| `/rest/v1/cartService/getCartDetails` (same-origin JSONP) | Cart count badge | 404 |
| `/includes/Components/querySuggestions.jsp` | Search suggestions; the search bar does not open without it | 404 |
| `/cart/HoldingArea.jsp` | Cart button navigation | 404 |
| `/images/icons/*.svg`, `/images/trans.gif` | Icons served by Tomcat, not AEM | 404 |

Because the JSONP calls are same-origin, jQuery fetches them by XHR and evaluates the 404 HTML, which causes two `SyntaxError: Unexpected token '<'` errors.

| Control | Localhost | Production |
| --- | --- | --- |
| Shop Products mega-menu (click) | Opens | Opens |
| Escape closes the menu | No | No |
| Account panel (click) | Opens; social icons missing | Opens |
| Escape closes the account panel | No | Not checked |
| Search | Does not open (needs `querySuggestions.jsp`) | Opens with suggestions |
| Cart | Navigates to `/cart/HoldingArea.jsp` (404) | Cart page |
| `aria-expanded` on header controls | None | None |
| Tab order (first three stops) | Enable Accessibility → Search → Order Tracking | Same |
| Visible focus indicator | None (`outline: none`) | None (same) |

The keyboard and ARIA gaps are the same on production, so they are existing AEM issues, not caused by the host.

- `s_gi is not defined` was thrown on every click once the analytics clientlib was dropped. `s_gi` is now stubbed with the other globals. It did not fix search.
- `phoneNumber is not defined`: the footer phone script expects a global the JSP sets. Not stubbed; recorded as part of the host contract.
- React reports hydration mismatches: AEM scripts add `class="ab-test-a"` to `<html>`, `class="hideLivePerson"` to `<body>`, and change the header and footer markup before React hydrates. React leaves the DOM as it is ("won't be patched up"). Recorded, not suppressed.
- No request left localhost during load or the interactions except Google Fonts; everything else to an outside host was blocked by CSP.

## Step 7 — Caching check (2026-11-11)

**Done, on `next build && next start`.** `next build` reports `/` and `/style-probe` as static with 1-minute revalidation, and `/tires/[size]` as SSG (an empty `generateStaticParams` was added so sizes render on first request and are then cached; without it the route was dynamic).

`getAemFragment` logs a line every time it runs; a cached page logs nothing. Requests to `/tires/225-45-17`:

| Request | When | `x-nextjs-cache` | AEM fetches |
| --- | --- | --- | --- |
| 2 and 3 | Within 60 s of the first | HIT | 0 |
| 4 | 66 s later | STALE (old page served, regenerated in the background) | 4: head 100 ms, SEO 101 ms, footer 150 ms, header 200 ms |
| 5 | 4 s after that | HIT (fresh) | 0 |

AEM is fetched at most once a minute per fragment, matching the Java tags. `Cache-Control: s-maxage=60, stale-while-revalidate` is sent, so a CDN in front would cache the same way.

## Step 8 — Write-up (2026-11-11)

**Done.** Summary, success criteria and production needs are at the top of this report.
