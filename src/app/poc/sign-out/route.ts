import { NextResponse } from 'next/server';

import { endSession } from '@/lib/session/session';

// POC convenience: clears the stub session and returns to the home page, so both header states
// can be demonstrated without a real sign-out flow.
export async function GET(request: Request): Promise<Response> {
  await endSession();
  return NextResponse.redirect(new URL('/', request.url));
}
