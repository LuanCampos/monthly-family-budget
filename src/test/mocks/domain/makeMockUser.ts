export function makeMockUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    ...overrides,
  };
}
