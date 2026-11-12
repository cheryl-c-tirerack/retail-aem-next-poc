import { AemBlock } from './AemBlock.client';
import { getAemFragment } from './getAemFragment';

/**
 * Fetches a rendered AEM content fragment on the server, the way retail_desktop's
 * <tirerack:CQResource> tag does, and hands it to AemBlock to render and run on the client.
 *
 * This is for content *fragments* (an authored block), not whole AEM pages — those ship their own
 * <html>/<head>/header/footer and are served through the /aem/[...path] proxy.
 */
export async function AemContent({ path, requireSrc }: { path: string; requireSrc?: string }) {
  const result = await getAemFragment(path);

  if (!result.ok) {
    return <p>This AEM content is not available right now (status: {String(result.status)}).</p>;
  }

  return <AemBlock html={result.html} requireSrc={requireSrc} />;
}

export default AemContent;
