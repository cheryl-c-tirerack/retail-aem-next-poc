// BFF OpenAPI groups the POC generates types from, per environment.
// Specs are served unauthenticated at https://<host>/api-docs/<slug>.
module.exports = {
  host: 'https://dev.api.tirerack.com',
  slugs: ['vehicle', 'search-index'],
};
