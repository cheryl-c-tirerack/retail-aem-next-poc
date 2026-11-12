import type { Metadata } from 'next';

import { AemContent } from '@/lib/aem/AemContent';

// The welcome-modal is an AEM content page the Java site loads as a popup
// (/content/tirerack/desktop/en/welcome-modal). Here it is rendered inline to prove the fragment
// renders; wiring it up as an actual modal is a later UI task.
const WELCOME_MODAL_PATH = 'en/welcome-modal.html';

export const metadata: Metadata = {
  title: 'Welcome Modal (AEM content) | Tire Rack',
};

export default function WelcomeModalPage() {
  return (
    <>
      <h1>Welcome Modal (AEM content)</h1>
      <AemContent path={WELCOME_MODAL_PATH} />
    </>
  );
}
