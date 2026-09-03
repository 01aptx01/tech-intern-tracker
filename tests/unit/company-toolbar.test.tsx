// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompanyToolbar } from '@/components/companies/company-toolbar';
import type { CompanyFilters } from '@/types/filters';

const filters: CompanyFilters = {
  query: '',
  announcementStatuses: [],
  userStatuses: [],
  techRoles: [],
  programTypes: [],
  evidenceLevels: [],
  locations: [],
  workModes: [],
  deadline: 'all',
};
const options = {
  techRoles: [],
  programTypes: [],
  locations: [],
  workModes: [],
};
afterEach(cleanup);
describe('CompanyToolbar keyboard search', () => {
  it('focuses search with a modifier shortcut and clears it with Escape', async () => {
    const onQuery = vi.fn();
    render(
      <CompanyToolbar
        query="alpha"
        onQuery={onQuery}
        filters={filters}
        onFilters={vi.fn()}
        options={options}
        resultCount={1}
        total={2}
      />,
    );
    const search = screen.getByRole('textbox', { name: 'ค้นหาบริษัท' });
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(search).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onQuery).toHaveBeenLastCalledWith('');
  });

  it('does not capture the slash character shortcut', async () => {
    render(
      <CompanyToolbar
        query=""
        onQuery={vi.fn()}
        filters={filters}
        onFilters={vi.fn()}
        options={options}
        resultCount={1}
        total={2}
      />,
    );
    const search = screen.getByRole('textbox', { name: 'ค้นหาบริษัท' });
    await userEvent.keyboard('/');
    expect(search).not.toHaveFocus();
  });
});
