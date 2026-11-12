'use client';

import { useEffect } from 'react';

/**
 * The AEM header is `position: fixed`, so it is lifted out of flow and the page body would slide
 * underneath it. On real AEM pages the page grid reserves the header's height; the bare fragment
 * does not. This measures the live header bar and publishes its height as `--aem-header-h` on
 * <html>, so globals.css can pad <main> to match at every width. No magic number.
 *
 * There are two header elements and AEM swaps which one is the visible bar by breakpoint:
 *   - `#newHeaderBar` — the compact bar, shown only at mobile widths (display:none on desktop).
 *   - `#newHeader`    — the full desktop nav; at mobile it becomes the off-canvas menu (a ~749px
 *                       box positioned off-screen), so it must NOT be measured there.
 * So: if the compact bar is visible (has height) we are mobile — use it; otherwise use #newHeader.
 * This mirrors AEM's own `maxHeaderHeight` choice in clientlibs-responsive (headerScroll).
 */
export const HeaderSpacer = () => {
  useEffect(() => {
    const fullHeader = document.querySelector<HTMLElement>('#newHeader');
    const compactBar = document.querySelector<HTMLElement>('#newHeaderBar');

    if (!fullHeader && !compactBar) {
      return;
    }

    const publishHeight = () => {
      const compactHeight = compactBar?.offsetHeight ?? 0;
      const height = compactHeight > 0 ? compactHeight : (fullHeader?.offsetHeight ?? 0);

      if (height > 0) {
        document.documentElement.style.setProperty('--aem-header-h', `${Math.round(height)}px`);
      }
    };

    publishHeight();

    const observer = new ResizeObserver(publishHeight);

    if (fullHeader) {
      observer.observe(fullHeader);
    }

    if (compactBar) {
      observer.observe(compactBar);
    }

    window.addEventListener('resize', publishHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publishHeight);
    };
  }, []);

  return null;
};

export default HeaderSpacer;
