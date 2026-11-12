'use client';

import { useEffect, useRef } from 'react';

type AemBlockProps = {
  /** The AEM content block's HTML, including its <script> tags. */
  html: string;
  /** Optional global script this block's inline handlers need (e.g. /scripts/TR.js → changeTRTabs). */
  requireSrc?: string;
};

/**
 * Renders an AEM content block OUTSIDE React's hydration and runs its scripts.
 *
 * Why not dangerouslySetInnerHTML in a server component: the block mixes markup, inline data and a
 * component clientlib. React does not execute <script>s it renders, and any hydration mismatch makes
 * React re-render the subtree — throwing away the DOM the block's scripts bound their click handlers
 * to. So we render an empty div (no mismatch), then in an effect inject the HTML and re-create each
 * <script> so it actually executes (external loads, inline runs), in document order. Runs on first
 * load and on client-side navigation.
 */
export const AemBlock = ({ html, requireSrc }: AemBlockProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;

    if (!container) {
      return;
    }

    if (requireSrc && !document.querySelector(`script[src="${requireSrc}"]`)) {
      const prerequisite = document.createElement('script');
      prerequisite.src = requireSrc;
      document.head.appendChild(prerequisite);
    }

    container.innerHTML = html;

    container.querySelectorAll('script').forEach((original) => {
      const script = document.createElement('script');
      for (const attribute of Array.from(original.attributes)) {
        script.setAttribute(attribute.name, attribute.value);
      }
      script.textContent = original.textContent;
      original.replaceWith(script);
    });

    return () => {
      container.innerHTML = '';
    };
  }, [html, requireSrc]);

  return <div data-aem="content" ref={ref} suppressHydrationWarning />;
};

export default AemBlock;
