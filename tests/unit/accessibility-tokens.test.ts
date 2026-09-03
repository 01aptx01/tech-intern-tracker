import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('../../app/globals.css', import.meta.url),
  'utf8',
);

function variables(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))?.[1];
  if (!block) throw new Error(`Missing CSS variable block: ${selector}`);
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})/gi)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

function luminance(hex: string) {
  const expanded =
    hex.length === 4 ? `#${hex.slice(1).replace(/./g, '$&$&')}` : hex;
  const channels = expanded
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255);
  if (!channels || channels.length !== 3)
    throw new Error(`Expected a hex color, received ${hex}`);
  const [red, green, blue] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort(
    (left, right) => right - left,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('WCAG color tokens', () => {
  const themes = [variables(':root'), variables(":root[data-theme='light']")];

  it.each(themes)(
    'keeps control boundaries and focus indicators at 3:1',
    (theme) => {
      expect(
        contrast(theme['control-border'], theme.surface),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(theme['focus-ring'], theme.surface),
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(themes)(
    'keeps status text at 4.5:1 against its status surface',
    (theme) => {
      for (const status of ['success', 'info', 'warning', 'danger']) {
        expect(
          contrast(theme[`status-${status}`], theme[`status-${status}-bg`]),
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it.each(themes)(
    'keeps KPI and chart colors distinguishable from the surface',
    (theme) => {
      for (const token of [
        'primary',
        'tone-indigo',
        'tone-amber',
        'tone-sky',
        'tone-green',
      ]) {
        expect(contrast(theme[token], theme.surface)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
      for (const token of [
        'chart-success',
        'chart-info',
        'chart-warning',
        'chart-danger',
        'chart-neutral',
      ]) {
        expect(contrast(theme[token], theme.surface)).toBeGreaterThanOrEqual(3);
      }
    },
  );
});
