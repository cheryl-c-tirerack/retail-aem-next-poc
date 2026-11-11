# Retail AEM + Next.js POC Report

Plan: `POC-PLAN.md`. Status: **Step 0 passes on VPN** through the internal dispatcher. The public host is blocked by Akamai.

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
