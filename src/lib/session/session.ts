import 'server-only';

import { cookies } from 'next/headers';

// POC stub session. A real build calls the BFF password grant and keeps its tokens here; the POC
// has no retail customer or tenant on dev (see JAVA-CONTRACT-PLAN.md), so this only records a
// stubbed signed-in user in one httpOnly cookie. getSession/startSession/endSession are the seam
// the real password grant and Auth.js replace later.

const COOKIE_NAME = 'poc-session';

export type PocSession = {
  signedIn: true;
  displayName: string;
  email: string;
  accountNumber: string;
};

// Stand-in identity until a BFF profile endpoint exists. Not a real customer.
const STUB_SESSION: PocSession = {
  signedIn: true,
  displayName: 'Test User',
  email: 'test.user@example.com',
  accountNumber: 'POC-0000',
};

export async function getSession(): Promise<PocSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PocSession;
  } catch {
    return null;
  }
}

export async function startSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(STUB_SESSION), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
