// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

const props = {
  status: 'synced' as const,
  lastCheckedAt: '2026-09-03T10:30:00.000Z',
  fileModifiedAt: '2026-09-03T09:15:00.000Z',
  onSync: vi.fn(),
  onAdd: vi.fn(),
};

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.theme;
  window.localStorage.clear();
});

describe('DashboardHeader theme hydration', () => {
  it('hydrates without a mismatch when the saved client theme is light', async () => {
    const markup = renderToString(<DashboardHeader {...props} />);
    document.documentElement.dataset.theme = 'light';
    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.append(container);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let root: Root | undefined;

    await act(async () => {
      root = hydrateRoot(container, <DashboardHeader {...props} />);
    });

    expect(consoleError).not.toHaveBeenCalled();
    const themeButton = screen.getByRole('button', { name: 'ใช้ธีมมืด' });
    await userEvent.click(themeButton);
    expect(
      screen.getByRole('button', { name: 'ใช้ธีมสว่าง' }),
    ).toBeInTheDocument();

    await act(async () => root?.unmount());
    consoleError.mockRestore();
    container.remove();
  });
});
