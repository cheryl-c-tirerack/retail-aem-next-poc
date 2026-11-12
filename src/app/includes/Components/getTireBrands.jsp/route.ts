import { NextResponse } from 'next/server';

// Contract 6: AEM uses this on Enter in search to route an exact brand match to /tires/brands/<brand>.
// service-catalog-tire is not exposed by the retail BFF yet, so the POC returns an empty list; an
// unmatched term falls through to normal search. See the plan, Phase 2.
export function GET(): Response {
  return NextResponse.json([]);
}
