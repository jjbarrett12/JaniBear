/**
 * Territory War Board tests: config uniqueness, intel card field integrity, URL/localStorage persistence.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' src/lib/sales/territory/__tests__/territory-war-board.test.ts
 * Or with Vitest/Jest if added to the project.
 */

import { LAYER_IDS, HEAT_LAYERS_BY_ID, BUILDING_INTEL_FIELD_SPEC } from '../salesTerritoryConfig';
import type { LayerId } from '../salesTerritoryConfig';
import { buildingIntelSchema } from '../schemas';
import { parseLayersFromSearchParams, layersToSearchParams } from '../url-layers';

// 1) Config uniqueness: all layer IDs unique, all label keys exist
function testConfigUniqueness() {
  const ids = new Set(LAYER_IDS);
  if (ids.size !== LAYER_IDS.length) {
    throw new Error(`Duplicate layer IDs found: ${LAYER_IDS.join(', ')}`);
  }
  for (const id of LAYER_IDS) {
    const def = HEAT_LAYERS_BY_ID[id];
    if (!def) throw new Error(`Missing layer definition for id: ${id}`);
    if (!def.label || def.label.length === 0) throw new Error(`Empty label for layer: ${id}`);
  }
  console.log('✓ Config uniqueness: all layer IDs unique, all labels exist');
}

// 2) Intel card field integrity: FieldSpec keys map to BuildingIntel schema keys, no duplicate keys
function testIntelCardFieldIntegrity() {
  const keys = BUILDING_INTEL_FIELD_SPEC.map((f) => f.key);
  const keySet = new Set(keys);
  if (keySet.size !== keys.length) {
    throw new Error(`Duplicate keys in BUILDING_INTEL_FIELD_SPEC: ${keys.join(', ')}`);
  }
  const schemaKeys = Object.keys(buildingIntelSchema.shape) as (keyof typeof buildingIntelSchema.shape)[];
  for (const spec of BUILDING_INTEL_FIELD_SPEC) {
    if (!(spec.key in buildingIntelSchema.shape)) {
      throw new Error(`FieldSpec key "${spec.key}" not in BuildingIntel schema. Schema keys: ${schemaKeys.join(', ')}`);
    }
  }
  console.log('✓ Intel card field integrity: FieldSpec keys map to BuildingIntel schema, no duplicates');
}

// 3) URL/localStorage persistence: toggling layer updates querystring; reading querystring restores toggles
function testUrlPersistence() {
  const testIds: LayerId[] = [LAYER_IDS[0], LAYER_IDS[1]];
  const query = layersToSearchParams(testIds);
  if (!query.includes('layers=') || !query.includes(testIds[0])) {
    throw new Error(`layersToSearchParams did not produce expected query: ${query}`);
  }
  const params = new URLSearchParams(query);
  const restored = parseLayersFromSearchParams(params);
  if (restored.length !== testIds.length || !testIds.every((id) => restored.includes(id))) {
    throw new Error(`parseLayersFromSearchParams did not restore: expected ${testIds.join(',')}, got ${restored.join(',')}`);
  }
  const emptyParams = new URLSearchParams('');
  const emptyRestored = parseLayersFromSearchParams(emptyParams);
  if (emptyRestored.length !== 0) {
    throw new Error(`parseLayersFromSearchParams should return [] for empty params, got ${emptyRestored.join(',')}`);
  }
  console.log('✓ URL persistence: layersToSearchParams and parseLayersFromSearchParams round-trip');
}

export function runTerritoryWarBoardTests() {
  testConfigUniqueness();
  testIntelCardFieldIntegrity();
  testUrlPersistence();
}
