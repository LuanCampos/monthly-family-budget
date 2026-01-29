export function makeMockSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      ...(overrides.user as object),
    },
    ...overrides,
  };
}
