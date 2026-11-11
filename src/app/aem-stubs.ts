// Globals the JSP host defines before AEM's scripts run (headInclude.jsp, testTrack.jsp).
// The analytics and dataLayer tags are dropped, so these keep AEM code that calls them from throwing.
export const AEM_STUBS = `
window.sessionIsSet = true;
if (typeof window.s === 'undefined') {
  window.s = { t: function () {}, tl: function () {}, clearVars: function () {}, visitor: { setCustomerIDs: function () {} } };
}
// AEM's clientlibs call s_gi() on clicks (trFireAfterPageAnalytics); found in Step 6.
if (typeof window.s_gi === 'undefined') {
  window.s_gi = function () { return window.s; };
}
window.dataLayer = window.dataLayer || [];
console.info('[aem-order] aem-stubs');
`;
