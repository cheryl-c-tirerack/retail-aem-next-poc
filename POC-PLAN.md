# Retail AEM + Next.js POC Plan

Written 2026-11-11 and revised the same day after plan review (`.claude/plan-reviews/POC-PLAN-plan-review.md`). The living copy of this plan is a Claude doc: https://claude.ai/artifact/MoGNABzhZd2cTXrrhyqE25. This file is a snapshot for use in this folder. Background and evidence are in `AEM-FINDINGS.md` beside it.

## Goal and scope

The POC shows whether an empty Next.js app on `localhost:3000` can render Retail's AEM content the same way the Java app does today: by fetching finished HTML fragments from AEM and placing them in the page. It needs no AEM change. It needs VPN, because Akamai blocks server-side fetches from the public site (Step 0, `POC-REPORT.md`).

It answers three questions:

1. Can Next.js fetch the AEM fragments server-side? (Answered at Step 0: not through Akamai; yes through the internal stage dispatcher on VPN.)
2. Do AEM's stylesheets and scripts work inside a Next.js document?
3. How much of the header works when the host is not the Java app?

| In scope | Out of scope |
| --- | --- |
| Header, footer and head libraries from AEM | Login, cart, vehicle selection, checkout |
| SEO tire-size blurb on a dynamic route | Rebuilding any AEM component in React |
| One-minute caching, matching the Java app | The React component library and a Retail theme |
| A written report of what worked and what broke | Deployment, Kubernetes, Flux |
| | Single authored components by path (needs an internal host) |
| | Automated tests (see Decisions) |

## What we know

The Java app (`retail_desktop`) gets AEM content as rendered HTML over plain HTTP and writes it into the JSP. It uses no JSON, no model export and no experience-fragment API. Five JSP tags share one HTTP client, and each caches its result for one minute.

The same URLs were checked on `https://www.tirerack.com` from a browser on November 11, 2026:

| AEM piece | Path under `/content/tirerack/desktop/` | Public result | Java tag |
| --- | --- | --- | --- |
| Header | `en.headerResponsive.html` | 200, fragment, about 78 KB | `<tirerack:header>`, 246 JSPs |
| Footer | `en.footerResponsive.html` | 200, fragment, about 32 KB | `<tirerack:footer>`, 246 JSPs |
| Head CSS and JS | `en.rsResponsiveJSincludes.html` | 200, fragment, 5 stylesheets, 7 scripts | `<tirerack:javascript>`, in 253 JSPs via `headInclude.jsp` |
| SEO tire blurb | `en.seocontent.<width>.<ratio>.<diameter>.html` | 200, fragment, about 1 KB | `<tirerack:seocontenttsr>`, tire search results |
| Single component | `en/whytirerack/_jcr_content/root/container/testtrack.html` | 404 | `<tirerack:CQResource>`, 2 JSPs |
| JSON model | `en/whytirerack.model.json` | 404 | Not used |

Two facts shape the POC:

- **The header HTML is the same for every user.** Cart count, vehicle and login state are filled in afterwards by AEM's JavaScript calling the Java app.
- **The header depends on the head fragment.** That fragment is what loads AEM's stylesheets and scripts onto a Java page.

## Approach

Next.js takes the Java app's seat: it fetches the same fragments from the same paths, on the server, and places them in the page. The AEM host is one environment variable, `AEM_HOST`, set to `http://dispatcher.stage.tirerack.net` for the POC, the same stage host `TRUtil.getCQHostName()` uses. It needs VPN. It has no `NEXT_PUBLIC_` prefix, so it never reaches the browser.

1. **One fetch helper, server-only.** `getAemFragment(path)` in `src/lib/aem/getAemFragment.ts` starts with `import 'server-only'`. It does a GET against `AEM_HOST` with `next: { revalidate: 60 }` and `signal: AbortSignal.timeout(5000)`, and returns a result that says why a fetch failed, so a 403 from Akamai, a 404, a timeout and a network error can be told apart:

   ```ts
   type AemFragmentResult =
     | { ok: true; html: string }
     | { ok: false; status: number | 'timeout' | 'network'; path: string };
   ```

   The layout renders an empty slot when `ok` is `false`. A timeout counts as a failure, so a hung Akamai request cannot blank every page. It logs path, status and elapsed time on every outcome. It is the equivalent of `CQServiceHandlerImpl.invokeCQ`. A failed fetch leaves the slot empty, as the Java tags do.
2. **Root layout places header, head libs and footer.** `src/app/layout.tsx` fetches the three fragments in parallel. Header and footer go into the body with `dangerouslySetInnerHTML`, each in its own wrapper element. Route content goes in `<main>`, whose `id` matches the header's skip-link target (checked in step 5). The layout keeps `<html lang="en">` and replaces the default `create-next-app` metadata. The head fragment's stylesheets are rendered as JSX `<link rel="stylesheet" precedence="aem">` elements in source order, only for links on the keep list.
3. **Only scripts on a keep list run.** Scripts inside HTML set through `dangerouslySetInnerHTML` do not run, so nothing in the fragment HTML executes by itself. The helper extracts script tags from all three fragments and renders **only** the ones on the keep list below. Everything else, including any tag AEM adds later such as Adobe Launch, is dropped. The keep list lives in one file, `src/lib/aem/keepList.ts`.
4. **Script order is enforced, not hoped for.** The stubs (`s`, `window.dataLayer`, `window.sessionIsSet`, as `headInclude.jsp` does) and the two clientlib JS bundles render with `next/script` `strategy="beforeInteractive"`, which the root layout allows and which keeps source order. Kept inline scripts render after them with `afterInteractive`. Each script gets a stable `id` taken from its `src` or a short name from the keep list, never an array index. `document.write` cannot work in an injected script; if a kept script uses it, record that as a loading limit, not an AEM bug.
5. **A Content-Security-Policy header is the safety net.** `next.config.ts` sends a CSP through `headers()` that allows only `'self'`, `https://www.tirerack.com` and Google Fonts. If a kept clientlib bundle tries to load Adobe Launch or any other vendor while the page runs, the browser blocks it and logs a CSP violation in the console. Those violations are evidence for the report.

   ```ts
   const csp = [
     "default-src 'self'",
     "script-src 'self' 'unsafe-inline' https://www.tirerack.com",
     "style-src 'self' 'unsafe-inline' https://www.tirerack.com https://fonts.googleapis.com",
     "font-src 'self' https://fonts.gstatic.com",
     "img-src 'self' data: https://www.tirerack.com",
     "connect-src 'self'",
     "frame-src 'none'",
   ].join('; ');
   ```

   `'unsafe-inline'` is accepted for the POC because the kept inline scripts need it.
6. **AEM asset paths are proxied.** The fragments reference assets as root-relative paths such as `/etc.clientlibs/...` and `/etc/designs/...`. A `rewrites` rule in `next.config.ts` forwards `/etc.clientlibs/:path*`, `/etc/designs/:path*` and `/content/dam/:path*` to `AEM_HOST`, so the fragment HTML needs no editing. Because these are same-origin to the browser, CSP `'self'` covers them.
7. **A dynamic route renders the SEO blurb.** `/tires/[size]` awaits `params` (a Promise in current Next.js) and checks the size against a shape regex, `^(\d{2,3}(?:\.\d+)?)-(\d{2}(?:\.\d+)?)-(\d{2}(?:\.\d+)?)$`. A mismatch calls `notFound()`; it is never wrapped in `try/catch` or `Promise.allSettled`. A match such as `225-45-17` fetches `en.seocontent.225.45.17.html`, using the selector rules from `SEOTireContent.java`: dots in a value become underscores, slashes are removed, and an empty value becomes `0`. `generateMetadata` sets the title, for example "225/45R17 Tires | Tire Rack", and the page renders a host `<h1>` above the blurb.

The stack is Next.js with the App Router and TypeScript, with no other dependencies. The React component library is left out on purpose, so any style clash seen is between AEM's CSS and a bare Next.js page.

## File map

| Action | Path | Purpose |
| --- | --- | --- |
| Create | `.env.local` | `AEM_HOST=http://dispatcher.stage.tirerack.net` (git-ignored) |
| Create | `next.config.ts` | Rewrites, CSP header, `logging: { fetches: { fullUrl: true } }` |
| Create | `src/lib/aem/getAemFragment.ts` | Server-only fetch with timeout and revalidate |
| Create | `src/lib/aem/keepList.ts` | The keep list, as one exported typed array |
| Create | `src/lib/aem/extractScripts.ts` | Pulls scripts and stylesheet links from fragment HTML and keeps only keep-list matches |
| Create | `src/lib/aem/seoSelector.ts` | Size shape check and `SEOTireContent.java` selector rules |
| Create | `src/app/aem-stubs.ts` | Stub source for `s`, `dataLayer` and `sessionIsSet` |
| Create | `src/app/layout.tsx` | Head links, scripts, header, `<main>`, footer |
| Create | `src/app/tires/[size]/page.tsx` | SEO blurb route with `generateMetadata` |
| Create | `src/app/tires/[size]/not-found.tsx` | Page for a malformed size |
| Create | `src/app/style-probe/page.tsx` | Plain host elements (h1 to h3, p, a, button, input, ul, table, a CSS-module div) to show what AEM's CSS restyles |
| Create | `POC-REPORT.md` | Step 8 write-up |
| Modify | `src/app/globals.css` | Emptied, so `create-next-app` adds no resets of its own |
| Untouched | `POC-PLAN.md`, `AEM-FINDINGS.md` | Reference docs |

## Tags to keep

Decision (Cheryl, November 11, 2026): the POC keeps only the tags below and drops everything else. This replaces the earlier remove list. Anything AEM adds later is dropped by default, and the CSP header blocks anything a kept bundle loads at runtime. The full inventory, including what is dropped and why, is in `AEM-FINDINGS.md`.

| Tag | Fragment | Identify by | Load as |
| --- | --- | --- | --- |
| `webApplicationBaseURL` config | Head | Inline contains `webApplicationBaseURL` | `beforeInteractive` |
| AEM clientlib CSS | Head | `href` contains `clientlibs-external.min` or `clientlibs-responsive.min` (`.css`) | `<link precedence="aem">` |
| AEM clientlib JS | Head | `src` contains `clientlibs-external.min` or `clientlibs-responsive.min` (`.js`) | `beforeInteractive`, external first |
| Google Fonts (Lato) and preconnects | Head | `fonts.googleapis.com`, `fonts.gstatic.com` | `<link>` |
| Inline `<style>` block | Head | `<style>` | Inline in `<head>` |
| Live-chat button observer | Header | Inline contains `lpButDivID` | `afterInteractive` |
| Google login helper | Header | Inline contains `openGoogleLogin` | `afterInteractive` |
| Trust carousel | Footer | Inline contains `slideNum` | `afterInteractive` |
| Phone number scripts | Footer | Inline contains `setPhoneContactImageNew` or `footerPhoneNumber` | `afterInteractive` |

Dropped tags include Adobe Analytics (`clientlibs-analytics.min`), GTM and Bing, `dataLayer` setup, Scarab, LivePerson, Meru, Google platform.js, UsableNet, DigiCert, both Akamai scripts, Sign in with Apple and the favicons.

**UsableNet is dropped for the POC only.** It is a user-facing accessibility service, not tracking. A production host must load it or an approved replacement.

## Steps

The order puts the cheapest test of the biggest unknown first. Each step can stop the POC early with a useful answer.

| Step | What to do | Done when |
| --- | --- | --- |
| 0. Server fetch check | From a terminal, `curl` the SEO blurb and header URLs on `www.tirerack.com` three times: with a plain user agent, a Tomcat-style one (`TireRack-Tomcat-<server>`, as the Java app sends), and the one `wholesale-next/src/app/actions/aemSdk.ts` sends. Record which pass | At least one user agent returns 200 with fragment HTML for both. If all are blocked, first ask whoever set up the wholesale user agent whether it is an Akamai allowlist entry, then raise open question 1 **Done 2026-11-11:** public host blocked for every user agent; stage and prod dispatchers pass on VPN (`POC-REPORT.md`) |
| 1. Scaffold | `create-next-app` refuses a folder that already has files, so scaffold into a temporary sibling folder (`npx create-next-app@latest ../aem-poc-tmp --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*"`), then move its contents into this folder. `git init`, add `.env.local` to `.gitignore`, add `AEM_HOST`, write `getAemFragment` | The app runs on `localhost:3000` and the helper logs a fragment's length, status and time |
| 2. SEO blurb route | Build `/tires/[size]` with the shape check, `notFound()` and `generateMetadata` | `/tires/225-45-17` shows the "About 225/45R17 Tires" block in View Source, with the right title. `/tires/abc` returns 404 |
| 3. Footer | Fetch and place the footer in the root layout, unstyled. Its inline scripts are inert text until step 4c | Footer markup appears on every route. With `AEM_HOST` unreachable, every route still renders with an empty slot |
| 4a. Asset proxy | Add the rewrites | `/etc.clientlibs` and `/etc/designs` URLs return 200 through `localhost:3000` |
| 4b. Keep list and CSP | Write `keepList.ts` and `extractScripts.ts`; add the CSP header | View Source shows no script or link outside the keep list |
| 4c. Head libs | Place the head stylesheets and kept scripts, with the stubs and clientlib JS as `beforeInteractive` | The footer is styled; no 404s for `/etc.clientlibs` or `/etc/designs`; scripts run in source order (a `console.log` stamp per script shows the order); CSP violations, if any, are recorded; `/style-probe` is screenshotted with AEM's stylesheets on and off, and every changed style is listed |
| 5. Header | Fetch and place the header; load its kept scripts. Find its skip link and target id; give `<main>` that id; check there are no duplicate `<header>` or `<footer>` landmarks | Side-by-side screenshots of `www.tirerack.com` and `localhost:3000` (header and footer) are saved at 375 px and 1280 px, using Playwright MCP so they can be repeated, and they match; the desktop menu, the mobile hamburger, and search open and close; the skip link lands on `<main>`; console errors and hydration warnings are recorded |
| 6. Header behaviour audit | Click through search, menus, cart icon, vehicle selector and sign-in. Repeat keyboard-only (Tab, Enter/Space, Escape). Keep the Network tab open with Preserve log and filter `-domain:localhost` | A list of every call the header makes to the Java app, with its status from localhost. Keyboard and `aria-expanded` differences from production are listed. No request went to a host outside the CSP list |
| 7. Caching check | Run `next build && next start`, not `next dev`. Reload within 60 seconds, wait more than 60 seconds and reload, then reload again | The fetch log shows HIT, then one MISS after 60 seconds, then HIT with fresh content. `next build` reports `/` and `/tires/[size]` as static or ISR, not dynamic |
| 8. Write-up | Record results against the success criteria in `POC-REPORT.md` | Report saved to the project |

Each code step (1 to 5) ends with one commit. Stage named paths only, never `git add .`, and use a conventional message such as `feat(poc): add getAemFragment server fetch helper`, with a one-line reason in the body.

Steps 0 to 2 are about half a day. Steps 3 to 5 are the real test and may take two to three days, depending on how AEM's scripts behave. These are estimates, not measured.

## Risks

| Risk | Why it might happen | Shows up at | If it happens |
| --- | --- | --- | --- |
| Akamai blocks server-side fetches | Happened at Step 0: the public site returns a block page as HTTP 200 | Step 0 | Resolved: use the internal stage dispatcher on VPN. `getAemFragment` also treats the block page as a failure, in case the host is ever switched back |
| A fetch hangs | VPN drops or the dispatcher is slow | Steps 1 to 3 | The 5-second timeout turns it into an empty slot; the log records the elapsed time |
| Header personalization is inert | Cart, vehicle and login calls go to the Java app, which is not on `localhost:3000` | Step 6 | Expected. Record the calls; they are the session contract a real host must meet |
| AEM scripts assume a Java page | They expect globals such as `window.sessionIsSet` and the analytics `s` object, and may use `document.write` | Step 5 | The stubs load `beforeInteractive`; record anything that still fails |
| A kept bundle calls a dropped tag | Kept inline scripts call `trGetCookie` and `$` from the clientlibs, and the unread clientlibs may call `s`, `dataLayer` or load Adobe Launch | Steps 4c and 5 | Clientlib JS loads first; `s` and `dataLayer` are stubbed; CSP blocks any outside load; record console errors and CSP violations |
| React hydration warnings | AEM scripts change header markup after load | Step 5 | Keep the fragments in server components with no client state, each in its own wrapper; record warnings as findings |
| AEM CSS restyles the Next.js page | Global selectors and resets in AEM's stylesheets | Step 4c | Compare `/style-probe` with AEM's stylesheets on and off, since the bare page alone gives AEM nothing to restyle. Record which rules leak, including focus outlines. This is the evidence for the style-contract question |

## Success criteria

The POC succeeds if it gives a clear yes or no on each line, with evidence.

- [ ] Next.js fetches all four fragments server-side from the stage dispatcher
- [ ] The SEO blurb and a size-specific title are in the server-rendered HTML of `/tires/[size]`
- [ ] Header and footer match production visually at 375 px and 1280 px, shown by saved side-by-side screenshots
- [ ] Header menus and search open and close, by mouse and by keyboard, with `aria-expanded` matching production
- [ ] Every header call to the Java app is listed with its purpose and status
- [ ] AEM is fetched at most once a minute per fragment, shown on a production build
- [ ] No browser request goes to any host outside the CSP list during load and the step 6 interactions
- [ ] Style leaks between AEM's CSS and the host page are listed

The report states what worked, what broke and why, and what a production version would need: a session and cart contract, an internal AEM host, cache invalidation on publish, the landmark and skip-link contract the JSP provided, and UsableNet (or an approved replacement) restored.

## Open questions

| # | Question | Suggested owner | Blocks |
| --- | --- | --- | --- |
| 1 | Will Akamai allow server-side fetches of the fragment URLs, or is an internal dispatcher host needed? **Answered:** the internal dispatchers work on VPN. | Web Systems / DevOps | Done |
| 2 | Is an internal dispatcher host reachable from a developer laptop? It would allow single components by path, which the public site returns as 404. | Web Systems / DevOps | Follow-up scope |
| 3 | Which calls does the header's JavaScript make to the Java app, and what do they return? The source is in the AEM repo, `tirerack-aem-desktop-content`. | AEM developer | Step 6 |

## Decisions

| Date | Decision |
| --- | --- |
| November 11, 2026 | Remove all analytics tags from the fragments, plus other third-party tags that report to a vendor. |
| November 11, 2026 | The POC lives in its own folder, `/Users/cherylcarpenter/CODE-tr-repo/retail-aem-next-poc`, beside the other repos. `POC-PLAN.md` and `AEM-FINDINGS.md` sit at its root. |
| November 11, 2026 | Local AEM (`retail.localhost:8079`) is not used. The AEM host is the stage dispatcher, `http://dispatcher.stage.tirerack.net`, on VPN, because Akamai blocks server-side fetches from `https://www.tirerack.com`. |
| November 11, 2026 | Use a keep list instead of a remove list, plus a CSP header as a safety net. The main concern is Adobe Launch, which is not in the fragments but could be loaded at runtime by a kept bundle. |
| November 11, 2026 | No automated tests in the POC. Verification is the Done-when checks and success criteria. |
