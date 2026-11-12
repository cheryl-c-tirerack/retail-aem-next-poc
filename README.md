# Retail AEM + Next.js POC

A Next.js app that renders Retail's AEM header, footer, head libraries and SEO content the way `retail_desktop` does: it fetches finished HTML fragments from AEM on the server and places them in the page.

## Docs

All POC docs live in the sibling folder **`../retail-aem-next-poc-docs/`**, not in this repo. New plans, reports and reviews go there too.

- Architecture: [ARCHITECTURE.md](../retail-aem-next-poc-docs/ARCHITECTURE.md) — how each AEM piece is fetched, stage vs prod, Java functions still needed
- Plan: [POC-PLAN.md](../retail-aem-next-poc-docs/POC-PLAN.md)
- Results: [POC-REPORT.md](../retail-aem-next-poc-docs/POC-REPORT.md)
- Background: [AEM-FINDINGS.md](../retail-aem-next-poc-docs/AEM-FINDINGS.md)
- Plan review: [plan-reviews/](../retail-aem-next-poc-docs/plan-reviews/)
- Screenshots (stay in this repo): [poc-evidence/](poc-evidence/)

## Run it

You must be on **VPN**. The app fetches from the internal stage dispatcher; the public site blocks server-side requests.

```bash
jf npm install
npm run dev
```

`.env.local` must contain:

```
AEM_HOST=http://dispatcher.stage.tirerack.net
```

## How to deploy

This is a standard Next.js (Node) app — there is no pipeline yet (it's a POC). To run it like production:

```bash
jf npm install
npm run build
npm run start      # serves on port 3000
```

Requirements wherever it runs:

- **Node 22** (match local dev).
- **Network to an internal AEM dispatcher** — the host must reach `AEM_HOST`; the public site blocks server-side fetches. On a laptop that means VPN; on a server it means the dispatcher is routable from that box.
- **Env vars** (baked at build time, like the sibling Next apps — not injected at runtime): `AEM_HOST` (AEM dispatcher) and `BFF_URL` (retail BFF). Point these at the right environment before `npm run build`.

For a container, use a standard Node 22 image, `npm run build`, then `npm run start`. No special `output` mode is set.

## URLs that work

All on http://localhost:3000.

| URL | What you should see |
| --- | --- |
| http://localhost:3000/ | AEM header and footer, with a link to a tire size |
| http://localhost:3000/tires/225-45-17 | Header, the "About 225/45R17 Tires" blurb, footer |
| http://localhost:3000/tires/235-40-18 | Any real size works the same way; only sizes AEM has a blurb for show text |
| http://localhost:3000/tires/255-35-19.5 | Valid shape but AEM has no blurb, so only the heading shows |
| http://localhost:3000/tires/abc | 404 "Tire size not found" (on purpose) |
| http://localhost:3000/style-probe | Plain HTML elements with AEM's CSS applied, to show how it restyles them |
| http://localhost:3000/suspension/lowering | AEM "A Look at Lowering" content block rendered in the app shell |
| http://localhost:3000/welcome-modal | AEM welcome-modal content fragment rendered in the app shell |
| http://localhost:3000/aem/en/wheels | A whole AEM page ("Wheels & Rims") served as-is through the `/aem/[...path]` proxy |
| http://localhost:3000/sitemap.xml | AEM-generated sitemap, passed straight through |

These are the three ways AEM content reaches the app, matching how `retail_desktop` pulls it:

- **Fragments in the shell** (`getAemFragment` + `AemContent`) — header, footer, JS includes, the tire SEO blurb, the suspension block, the welcome modal. Same as the Java `<tirerack:header/>`, `<tirerack:seocontenttsr/>` and `<tirerack:CQResource/>` tags.
- **Whole AEM pages** (`/aem/[...path]`) — pages that ship their own `<html>`/header/footer, returned as-is.
- **XML** (`/sitemap.xml`).

Not on the stage dispatcher (so not wired up, but reachable via the same routes in prod): the `whytirerack` test-track block, `wheels/by-brand`, `customer-support/sales-form`, and `google` pages all return 404/403 on stage.

Asset paths starting with these are proxied to AEM:

- `/etc.clientlibs/...`
- `/etc/designs/...`
- `/content/dam/...`

`/images/...` (served by Tomcat on the real site) redirects the browser to `https://static.vordn.com/images/...`. It is a redirect, not a proxy, because Akamai blocks server-side requests to that host but serves browsers.

## BFF endpoints we hit

Calls go to the retail BFF (`bff-retail-desktop`) at `BFF_URL` (dev: `https://dev.api.tirerack.com`), server-side only. The client is `src/lib/bff/client.ts`.

| Endpoint | Where in code | Used for | Status |
| --- | --- | --- | --- |
| `GET /api/v1/vehicles/makes?year=` | `src/lib/bff/vehicles.ts` → `getMakes()` | Vehicle makes for a year | ✅ Real, verified against dev; no auth needed |
| `GET /api/v1/vehicles/models?year=&make=` | `src/lib/bff/vehicles.ts` → `getModels()` | Vehicle models for a year + make | ✅ Real, verified against dev; no auth needed |

These two back the search-on-Enter "Make Model" match (`getTireMakeModels.jsp`). They are **built and proven but not yet wired into a route** — the make/model contract still returns `[]` (it needs a single yearless list the BFF doesn't expose yet; see [JAVA-CONTRACT-PLAN.md](../retail-aem-next-poc-docs/JAVA-CONTRACT-PLAN.md), Phase 2). Everything else the header calls is stubbed, not a BFF call — see below.

## What does not work

Details and evidence for each item are in [POC-REPORT.md](../retail-aem-next-poc-docs/POC-REPORT.md).

### Now handled by Next.js (Java migration, Phase 1)

Next.js answers the URLs AEM's header calls — see `../retail-aem-next-poc-docs/JAVA-CONTRACT-PLAN.md`.

| What | Status |
| --- | --- |
| Search opens, with suggestions | ✅ Works (`querySuggestions.jsp` route) |
| Signed-in vs guest header | ✅ Works — sign in via the account panel (any email + password); `/poc/sign-out` resets. Login is a **stub** (no real auth call yet) |
| Cart count | 🟡 Shows `0` (no cart service exists yet) |
| Signed-in name | 🟡 Stub name "Test User" (the token carries no name) |

### Still needs backend work (Phase 2) or a later phase

| What | Why |
| --- | --- |
| Cart button → cart page | Goes to `/cart/HoldingArea.jsp`; no cart service exists in the new stack |
| Search results, brand/size match on Enter | Needs the service token / BFF catalog endpoints |
| Header and footer links to other site pages | Those pages are a later migration phase |

### Broken or different on the page

| What | Why |
| --- | --- |
| ~~Fixed header covers page content~~ Fixed (base layout) | AEM's header is `position: fixed`. `HeaderSpacer.client.tsx` measures the visible `header.newHeaderBar` into `--aem-header-h`; `globals.css` pads `<main>` (and gives it a max width + side gutters) so content clears the header at every width |
| Live Chat badge shows, but chat itself is not available | LivePerson (the chat service) is dropped |
| ResellerRatings seal in the footer is missing | A third-party image; the CSP blocks it |
| Host page elements look like AEM (Lato font, uppercase `h1`, no list bullets, unstyled buttons) | AEM's global CSS restyles every plain element; see `/style-probe` |
| Footer phone number is not filled in | `phoneNumber is not defined`: the JSP sets this global; it is not stubbed |
| Console error `Cannot read properties of undefined (reading 'auth')` | The kept Google-login script also calls the Apple sign-in script, which is dropped on purpose |
| Console `SyntaxError: Unexpected token '<'` (twice) | jQuery evaluates the 404 pages from the `/rest/v1/...` calls as script |
| React hydration warnings in the console | AEM's clientlibs mutate the DOM before React hydrates — an A/B-test class on `<html>`, changes to `<body>`, and edits to the header/footer markup. `suppressHydrationWarning` is set on `<html>`, `<body>`, and the two `data-aem` header/footer wrappers (the standard third-party-script fix); it affects only those elements, not the rest of the tree |

### Same on production (existing AEM gaps, not caused by this app)

- No skip link
- No `aria-expanded` on header menus and buttons
- Escape does not close the menu or the account panel
- No visible focus ring when tabbing through the header
