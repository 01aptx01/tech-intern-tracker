// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChartTooltip } from '@/components/dashboard/status-chart';

afterEach(cleanup);

describe('ChartTooltip', () => {
  it('renders a readable label and Thai value instead of the Recharts default', () => {
    render(<ChartTooltip active label="SWE" payload={[{ value: 27 }]} />);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('SWE');
    expect(tooltip).toHaveTextContent('จำนวน 27 บริษัท');
    expect(tooltip).toHaveClass('chart-tooltip');
  });

  it('stays hidden when no chart item is active', () => {
    render(
      <ChartTooltip active={false} label="SWE" payload={[{ value: 27 }]} />,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
