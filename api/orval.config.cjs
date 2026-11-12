// Generates TypeScript model types (no client) from the retail BFF OpenAPI specs.
// Run via `npm run api:updateDev`. See JAVA-CONTRACT-PLAN.md.
const ENV = process.env.API_ENV;
if (ENV !== 'dev' && ENV !== 'qa') {
  throw new Error(`API_ENV must be 'dev' or 'qa'; got: ${ENV}`);
}

const { host, slugs } = require(`./apiPaths.${ENV}.js`);

const buildConfig = (slug) => ({
  output: {
    mode: 'single',
    client: 'fetch',
    target: `../src/lib/bff/generated/${slug}.ts`,
    schemas: `../src/lib/bff/generated/${slug}-types`,
    mock: false,
  },
  input: { target: `${host}/api-docs/${slug}` },
  hooks: { afterAllFilesWrite: ['prettier --write'] },
});

module.exports = Object.fromEntries(slugs.map((slug) => [slug, buildConfig(slug)]));
