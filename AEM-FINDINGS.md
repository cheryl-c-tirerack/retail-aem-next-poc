# How retail_desktop (legacy Java/JSP Retail) pulls in AEM, and POC starting points

Read from a local clone of `tirerack/retail_desktop`, branch `master` at `59f5812eb` (2026-11-06), on 2026-11-11. Code was read, not run. The AEM URLs were then probed on the public site from a browser on 2026-11-11 (results in "Live check" and "Tags inside the fragments" below).

The POC built from these findings lives in `/Users/cherylcarpenter/CODE-tr-repo/retail-aem-next-poc`, with its plan in `POC-PLAN.md`.

## The mechanism: server-side HTML fragment includes

Tomcat fetches rendered HTML from the AEM Dispatcher over plain HTTP and writes it straight into the JSP output. No JSON, no model export, no experience-fragment API, no ESI/SSI. Everything goes through five JSP custom tags.

| Piece | File | What it does |
|---|---|---|
| HTTP client | `classes/com/tirerack/web/cqservice/CQServiceHandlerImpl.java` | `invokeCQ(url)`: Spring `RestTemplate` GET, `User-Agent: TireRack-Tomcat-<server>`, returns body as String. No auth headers. |
| Base tag | `classes/com/tirerack/web/jstl/AbstractTRTag.java` | `getContent(url)` wraps `invokeCQ`, returns null on error (page renders without the fragment). |
| Host resolver | `classes/com/tirerack/util/TRUtil.java` `getCQHostName()` (~line 2677) | local: `http://retail.localhost:8079`; ODE: Consul key `aem_host`, fallback `http://dispatcher.stage.tirerack.net`; indev: `http://www<N>.<host>.tirerack.net`; stage: `http://dispatcher.stage.tirerack.net`; prod: `http://dispatchers-int.tirerack.com`. |
| Tag library | `htdocs/WEB-INF/tlds/tirerack_jstl_library.tld` | prefix `tirerack` in 253 JSPs. |

## The AEM URLs Tomcat calls

All are `<dispatcher host>` + path. Selectors on the `en` page do the work.

| Tag | AEM path | Cache in Tomcat | Used by |
|---|---|---|---|
| `<tirerack:header>` (`HeaderTag`) | `/content/tirerack/desktop/en.headerResponsive.html` | 1 min, application scope (same HTML for every user) | 246 JSPs |
| `<tirerack:footer>` (`FooterTag`) | `/content/tirerack/desktop/en.footerResponsive.html` | 1 min, application scope | 246 JSPs |
| `<tirerack:javascript>` (`JavaScriptTag`) | `/content/tirerack/desktop/en.rsResponsiveJSincludes.html` | 1 min, application scope | `htdocs/includes/Components/headInclude.jsp` line 7, which 253 JSPs include in `<head>` |
| `<tirerack:CQResource url="...">` (`CQResourceTag`) | any path; in use: `/content/tirerack/desktop/en/whytirerack/_jcr_content/root/container/testtrack.html` and `/content/tirerack/desktop/en/parts/suspension/_jcr_content/root/container/lookatlowering.html` | 1 min per URL (in-memory map) | `htdocs/about/testTrack.jsp`, `htdocs/suspension/tech/lookatlowering.jsp` |
| `<tirerack:seocontenttsr>` (`SEOTireContent`) | `/content/tirerack/desktop/en.seocontent.<width>.<ratio>.<diameter>.html` (dots in values become `_`, slashes removed, empty becomes `0`) | none | `htdocs/tires/TireSearchResults.jsp` line 3709 |

The `application` and `responsive` tag attributes are declared but ignored by the tag classes; the URLs are hard-coded.

## Live check on the public site (https://www.tirerack.com, 2026-11-11, from a browser)

| Path | Result |
|---|---|
| `en.headerResponsive.html` | 200, HTML fragment, about 78 KB, `Cache-Control: max-age=3600` |
| `en.footerResponsive.html` | 200, HTML fragment, about 32 KB, `max-age=3600` |
| `en.rsResponsiveJSincludes.html` | 200, HTML fragment, about 15 KB, `max-age=3600` |
| `en.seocontent.225.45.17.html` | 200, HTML fragment, about 1 KB (`<div class="SEOcontainer">`), `max-age=3600` |
| `.../whytirerack/_jcr_content/root/container/testtrack.html` | 404 (full error page). Component-by-path is not exposed publicly; presumably only the internal dispatcher hosts serve it |
| `.../whytirerack.model.json` | 404. No JSON model export on the public site |

So a POC on `localhost:3000` can use `https://www.tirerack.com` as its AEM host for header, footer, head libs and SEO content, with no VPN and no AEM change. Caveats: this was a browser request; a server-side fetch from Node goes through Akamai and may be treated differently (bot rules). Asset URLs inside the fragments are root-relative (`/etc.clientlibs/...`), so the POC must rewrite them to the AEM host or proxy those paths.

## Tags inside the fragments (read 2026-11-11)

Every `<script>` and `<link>` in the three fragments, with what to do in the POC. Decision (Cheryl, 2026-11-11): remove all analytics tags. Other third-party tags that report to a vendor are removed too, so localhost sends nothing to production services.

### Head fragment (`en.rsResponsiveJSincludes.html`)

| Tag | Identify by | POC action |
|---|---|---|
| Inline `webApplicationBaseURL` config | inline text contains `webApplicationBaseURL` | Keep. Note it checks `location.hostname` for `tirerack` or `retail.localhost` |
| AEM clientlib CSS | `href` contains `clientlibs-external.min` and `clientlibs-responsive.min` (`.css`) | Keep |
| AEM clientlib JS | `src` contains `clientlibs-external.min` and `clientlibs-responsive.min` (`.js`) | Keep |
| Google Fonts (Lato) and preconnects | `fonts.googleapis.com`, `fonts.gstatic.com` | Keep |
| Favicons and manifest | `/images/favicon/...` | Drop; Next.js supplies its own (these paths are served by Tomcat, not AEM) |
| Inline `<style>` block | `<style>` | Keep |
| **Adobe Analytics clientlib** | `src` contains `clientlibs-analytics.min` | **Remove.** Stub the `s` object as `headInclude.jsp` does |
| **Emarsys Web Extend (Scarab)** | inline contains `ScarabQueue` (loads `cdn.scarabresearch.com`) | **Remove** |
| **LivePerson chat monitor** | inline contains `lpTag` | **Remove** |
| **Meru consent manager** | `merudata.app` in `src`/`href` (2 CSS, 3 JS) and inline containing `onConsentChange` | **Remove.** It governs tags that are removed anyway |
| **UsableNet accessibility service** | `src` contains `a42cdn.usablenet.com` (id `usntA42start`) | **Remove.** Not analytics, but a third-party production service |
| **Akamai service-worker installer** | inline starts with `// akam-sw.js install script` | **Remove.** Present in all three fragments |

### Header fragment (`en.headerResponsive.html`)

| Tag | Identify by | POC action |
|---|---|---|
| **Akamai edge script** | `src` matches `https://www.tirerack.com/public/<hex>` (async) | **Remove.** Likely Akamai's bot-detection sensor; inferred from the URL pattern, not confirmed |
| **Akamai service-worker installer** | as above | **Remove** |
| Live-chat button observer | inline contains `lpButDivID` | Keep; harmless without LivePerson |
| Sign in with Apple | `src` on `appleid.cdn-apple.com` | Drop; login is out of scope |
| Google login helper | inline contains `openGoogleLogin` | Keep; inert until clicked |

### Footer fragment (`en.footerResponsive.html`)

| Tag | Identify by | POC action |
|---|---|---|
| Trust carousel script | inline contains `slideNum` | Keep (needs jQuery from clientlibs-external) |
| Phone number scripts | inline contains `setPhoneContactImageNew` or `footerPhoneNumber` | Keep |
| **Google Tag Manager and Bing UET** | one inline containing `googletagmanager.com/gtm.js` and `bat.bing.com/bat.js` | **Remove** |
| **dataLayer setup** | inlines containing `window.dataLayer` | **Remove** |
| **Google platform.js** | inline contains `gPlatform` (loads `apis.google.com/js/platform.js`) | **Remove** |
| **DigiCert site seal** | inline contains `__dcid` (loads `seal.digicert.com`) | **Remove.** Not analytics, but calls a third party |
| **Akamai service-worker installer** | as above | **Remove** |

Not yet read: the contents of the `clientlibs-external` and `clientlibs-responsive` JS bundles. They may call analytics functions (`s.tl`, `dataLayer.push`). With `s` stubbed and GTM absent those calls have nowhere to send, but the Network tab should be checked in step 4 for any request to a non-Tire Rack host.

## What this implies

- The header and footer HTML are identical for all users. Anything personal (cart count, vehicle, login state) must be filled in client-side by AEM's JavaScript calling back to Tomcat. From `localhost:3000` those calls will be cross-origin or will 404 unless proxied, so expect the header to render but personalization to be inert in the POC.
- The `<head>` fragment (`rsResponsiveJSincludes`) is what brings AEM's clientlib CSS/JS onto a Java page. The header markup depends on it.
- Several inline scripts call `trGetCookie(...)` and `$`, both defined in the clientlibs. Clientlib JS must load before any kept inline script runs.
- `CQResourceTag` shows a single authored component can be fetched alone by its JCR path, but only from an internal dispatcher host.
- Host pages set small globals the AEM JS expects, e.g. `window.sessionIsSet = true` in `testTrack.jsp`, and a stub `s` (Adobe Analytics) object in `headInclude.jsp`.

## The reverse direction: AEM pages calling Tomcat

Eleven JSPs set `Access-Control-Allow-Origin` so AEM-rendered pages can pull them in by ajax: `includes/Components/Nav/AEM_persVehNav.jsp`, `promos.jsp`, `techArticle.jsp`, `comments.jsp`, `installerMap.jsp`, `installerMapByType.jsp`, `mobileInstallerMap.jsp`, `about/contact-form.jsp`, `videos/video_modalbox.jsp`, `modalPopups/changeSearchLayer.jsp`, `modalPopups/checkVehicleFitLayer.jsp`. Session/cart endpoints the AEM JS likely uses include `/CurrentVehicleServlet`, `/SetCurrentVehicleServlet`, `/rest/v1/cartService/getCartDetails`, `/ChatServlet` (web.xml). The AEM-side JS that calls them lives in the AEM repo (`tirerack-aem-desktop-content`, `.../clientlibs-internal/js/aem/globals.js`), not here.

Analytics: `AnalyticsDataLayer.populateCustomerInfo` + `includes/Components/google.jsp` reproduce on JSP pages the dataLayer keys that AEM's `dataLayerEnrichment.html` adds on AEM pages. A production Next.js host would need the same contract.

## Not in this repo (open)

- Which URL paths go to AEM vs Tomcat (load balancer / Dispatcher / Akamai rules).
- The AEM components, the selectors' HTL scripts (`headerResponsive`, `footerResponsive`, `rsResponsiveJSincludes`, `seocontent`), and clientlib sources.
- Whether Akamai allows a server-side (Node) fetch of the selector URLs.
- Whether the internal dispatcher hosts are reachable from a developer laptop (needed for component-by-path).
