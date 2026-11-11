export type FragmentName = 'head' | 'header' | 'footer';

export type AemTag =
  | { kind: 'script'; src: string; code: '' }
  | { kind: 'script'; src: null; code: string }
  | { kind: 'stylesheet'; href: string }
  | { kind: 'style'; css: string };

export type KeepRule = {
  /** Stable id for the rendered element, and the name used in logs. */
  name: string;
  fragment: FragmentName;
  match: (tag: AemTag) => boolean;
};

const srcIncludes = (text: string) => (tag: AemTag) => tag.kind === 'script' && tag.src !== null && tag.src.includes(text);
const codeIncludes = (text: string) => (tag: AemTag) => tag.kind === 'script' && tag.src === null && tag.code.includes(text);
const hrefIncludes = (text: string) => (tag: AemTag) => tag.kind === 'stylesheet' && tag.href.includes(text);

/**
 * The only AEM tags the POC renders. Everything else in the fragments is dropped,
 * including anything AEM adds later (Adobe Launch, new vendors). See POC-PLAN.md, Tags to keep.
 */
export const KEEP_LIST: readonly KeepRule[] = [
  { name: 'aem-web-app-base-url', fragment: 'head', match: codeIncludes('webApplicationBaseURL') },
  { name: 'aem-clientlibs-external-css', fragment: 'head', match: hrefIncludes('clientlibs-external.min') },
  { name: 'aem-clientlibs-external-js', fragment: 'head', match: srcIncludes('clientlibs-external.min') },
  { name: 'aem-clientlibs-responsive-css', fragment: 'head', match: hrefIncludes('clientlibs-responsive.min') },
  { name: 'aem-clientlibs-responsive-js', fragment: 'head', match: srcIncludes('clientlibs-responsive.min') },
  { name: 'aem-google-fonts-lato', fragment: 'head', match: hrefIncludes('fonts.googleapis.com/css2') },
  { name: 'aem-head-inline-style', fragment: 'head', match: (tag) => tag.kind === 'style' },
  { name: 'aem-live-chat-button-observer', fragment: 'header', match: codeIncludes('lpButDivID') },
  { name: 'aem-google-login-helper', fragment: 'header', match: codeIncludes('openGoogleLogin') },
  { name: 'aem-trust-carousel', fragment: 'footer', match: codeIncludes('slideNum') },
  { name: 'aem-phone-contact-image', fragment: 'footer', match: codeIncludes('setPhoneContactImageNew') },
  { name: 'aem-footer-phone-number', fragment: 'footer', match: codeIncludes('footerPhoneNumber') },
];
