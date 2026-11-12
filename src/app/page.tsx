import Link from 'next/link';

export default function Home() {
  return (
    <ul>
      <li>
        <Link href="/tires/225-45-17">225/45R17 tires</Link> — SEO content block
      </li>
      <li>
        <Link href="/suspension/lowering">A Look at Lowering</Link> — AEM content block in the app shell
      </li>
      <li>
        <Link href="/welcome-modal">Welcome modal</Link> — AEM content fragment
      </li>
      <li>
        {/* Hard navigation: /aem/[...path] is a route handler returning raw AEM HTML, not a React
            page, so next/link's client navigation would not work here. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/aem/en/wheels">Wheels landing page</a> — whole AEM page, served as-is
      </li>
      <li>
        <a href="/sitemap.xml">sitemap.xml</a> — AEM-generated sitemap
      </li>
    </ul>
  );
}
