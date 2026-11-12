import { Fragment } from 'react';

import { getAemFragment } from './getAemFragment';
import { parseContentBlock } from './parseContentBlock';

/**
 * Renders a rendered AEM content fragment inside the app shell, the way retail_desktop's
 * <tirerack:CQResource> tag drops an authored AEM block into an otherwise-Java page.
 *
 * The block's own scripts (inline data + component clientlib) are rendered as real <script> tags,
 * in source order, so they actually run — dangerouslySetInnerHTML alone would leave the block
 * static. This is for content *fragments*, not whole AEM pages (those go through /aem/[...path]).
 */
export async function AemContent({ path }: { path: string }) {
  const result = await getAemFragment(path);

  if (!result.ok) {
    return <p>This AEM content is not available right now (status: {String(result.status)}).</p>;
  }

  const { html, scripts } = parseContentBlock(result.html);

  return (
    <>
      <div data-aem="content" dangerouslySetInnerHTML={{ __html: html }} />
      {scripts.map((script, index) => (
        <Fragment key={script.src ? `${script.src}-${index}` : `inline-${index}`}>
          {script.src ? (
            // eslint-disable-next-line @next/next/no-sync-scripts -- AEM block scripts must run in document order; next/script would defer/reorder them
            <script src={script.src} />
          ) : (
            <script dangerouslySetInnerHTML={{ __html: script.code }} />
          )}
        </Fragment>
      ))}
    </>
  );
}

export default AemContent;
