// Globals the JSP host defines before AEM's scripts run (headInclude.jsp, testTrack.jsp).
// The analytics and dataLayer tags are dropped, so these keep AEM code that calls them from throwing.
export const AEM_STUBS = `
window.sessionIsSet = true;
if (typeof window.s === 'undefined') {
  window.s = { t: function () {}, tl: function () {}, clearVars: function () {}, visitor: { setCustomerIDs: function () {} } };
}
window.dataLayer = window.dataLayer || [];
console.info('[aem-order] aem-stubs');
`;
