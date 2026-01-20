import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocks
import { NotFound } from './NotFound';
import { logger } from '@/lib/logger';

describe('NotFound', () => {
  it('should render 404 page', () => {
    render(
      <MemoryRouter initialEntries={['/non-existent-page']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });

  it('should render return to home link', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFound />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /return to home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('should log navigation warning', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-path']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotFound />
      </MemoryRouter>
    );

    expect(logger.warn).toHaveBeenCalledWith('navigation.404', expect.any(Object));
  });
});
