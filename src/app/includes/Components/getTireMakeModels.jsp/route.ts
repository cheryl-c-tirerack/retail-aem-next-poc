import { NextResponse } from 'next/server';

// Contract 5: AEM uses this on Enter in search to route an exact "Make Model" match to a vehicle page.
// The BFF vehicles endpoints (src/lib/bff/vehicles.ts) are real, but they need a year, while this
// legacy contract is a single flat list of every make/model. That yearless list has no BFF endpoint
// yet, so the POC returns an empty list; an unmatched term falls through to normal search. The
// vehicles client is kept as the building block a real yearless endpoint would use. See plan Phase 2.
export function GET(): Response {
  return NextResponse.json([]);
}
