import { NextResponse } from 'next/server';

// Contract 4: AEM's search bar only opens when this returns a JSON array; the array feeds the
// autocomplete. The Java version returns top-5 searches + these categories + tire brands. Top
// searches (a SQL query) and brands have no BFF endpoint yet, so the POC returns the product
// categories, which AEM's own code also hardcodes. See the plan, Phase 2.
const PRODUCT_CATEGORIES = [
  'Tires',
  'Wheels',
  'Brakes',
  'Suspension',
  'Exterior Accessories',
  'Lighting',
  'Wipers',
  'TPMS',
  'Engine Tuning',
  'Rims',
];

export function GET(): Response {
  return NextResponse.json(PRODUCT_CATEGORIES);
}
