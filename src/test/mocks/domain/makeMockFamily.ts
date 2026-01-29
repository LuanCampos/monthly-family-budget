// src/test/mocks/domain/makeMockFamily.ts
export function makeMockFamily(overrides = {}) {
  return {
    id: 'family-1',
    name: 'Test Family',
    isOffline: false,
    ...overrides,
  };
}
