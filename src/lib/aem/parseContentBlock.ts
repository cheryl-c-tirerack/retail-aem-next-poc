import 'server-only';

export type BlockScript = { src: string | null; code: string };

export type ParsedContentBlock = {
  /** The block markup with its <script> tags removed. */
  html: string;
  /** The block's scripts, in source order, to be rendered as real tags so they execute. */
  scripts: BlockScript[];
};

const SCRIPT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

function readAttribute(attributes: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(attributes);
  return match ? match[1] : null;
}

/**
 * Splits an AEM content block into its markup and its scripts.
 *
 * dangerouslySetInnerHTML does not execute <script> tags, so a block's inline data (e.g. the
 * `vehicles` array) and its component clientlib never run, leaving the block static. We pull the
 * scripts out here so the caller can render them as real React elements, in source order.
 * <link>/<style> are left in the markup — the browser does load those from innerHTML.
 */
export function parseContentBlock(blockHtml: string): ParsedContentBlock {
  const scripts: BlockScript[] = [];

  const html = blockHtml.replace(SCRIPT_PATTERN, (_raw, attributes: string, code: string) => {
    const src = readAttribute(attributes, 'src');
    scripts.push(src ? { src, code: '' } : { src: null, code });
    return '';
  });

  return { html, scripts };
}
