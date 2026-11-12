import { getAemFragment } from './getAemFragment';

/**
 * Renders a rendered AEM content fragment inside the app shell, the way retail_desktop's
 * <tirerack:CQResource> tag drops an authored AEM block into an otherwise-Java page.
 *
 * This is for content *fragments* (a block authored under a page), not whole AEM pages — those
 * ship their own <html>/<head>/header/footer and are served through the /aem/[...path] proxy.
 */
export async function AemContent({ path }: { path: string }) {
  const result = await getAemFragment(path);

  if (!result.ok) {
    return <p>This AEM content is not available right now (status: {String(result.status)}).</p>;
  }

  return <div data-aem="content" dangerouslySetInnerHTML={{ __html: result.html }} />;
}

export default AemContent;
