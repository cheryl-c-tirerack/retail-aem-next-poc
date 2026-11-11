import { getAemFragment } from '@/lib/aem/getAemFragment';

// Step 1 check: proves the server can fetch an AEM fragment. Replaced by real content in later steps.
export default async function Home() {
  const footer = await getAemFragment('en.footerResponsive.html');

  return (
    <main>
      <h1>Retail AEM POC</h1>
      <p>
        {footer.ok
          ? `Footer fragment fetched: ${footer.html.length} characters.`
          : `Footer fetch failed: ${footer.status}`}
      </p>
    </main>
  );
}
