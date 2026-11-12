import 'server-only';

import { bffGet } from './client';
import type { VehicleMakesResponse } from './generated/vehicle-types/vehicleMakesResponse';
import type { VehicleModelsResponse } from './generated/vehicle-types/vehicleModelsResponse';

// Vehicles endpoints need no auth (verified 2026-11-11). They back the search-on-Enter make/model match.

export async function getMakes(year: number): Promise<string[]> {
  const result = await bffGet<VehicleMakesResponse>({ path: '/api/v1/vehicles/makes', searchParams: { year } });
  return result.ok ? result.data.makes.map((make) => make.name) : [];
}

export async function getModels(year: number, make: string): Promise<string[]> {
  const result = await bffGet<VehicleModelsResponse>({
    path: '/api/v1/vehicles/models',
    searchParams: { year, make },
  });
  return result.ok ? result.data.models.map((model) => model.name) : [];
}
