// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CompanyForm } from '@/components/companies/company-form';
import { ConflictDialog } from '@/components/sync/conflict-dialog';
import { emptyCompanyInput } from '@/lib/companies/mapper';
import type { CompanyRecord } from '@/types/company';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  cleanup();
});

const formProps = {
  busy: false,
  serverError: null,
  locked: false,
  mutationsDisabled: false,
  onSubmit: vi.fn(async () => undefined),
  onDelete: vi.fn(async () => undefined),
  onDraftChange: vi.fn(),
  onClose: vi.fn(),
};

describe('accessible modal lifecycle', () => {
  it('opens the company form modally, marks required fields, and restores focus', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'เปิดฟอร์ม';
    document.body.append(opener);
    opener.focus();

    const { unmount } = render(
      <CompanyForm
        {...formProps}
        record={null}
        initialValues={emptyCompanyInput()}
      />,
    );
    const dialog = await screen.findByRole('dialog', { name: 'เพิ่มบริษัทใหม่' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveClass('company-editor');
    expect(screen.getByRole('textbox', { name: /ชื่อที่รู้จัก/ })).toBeRequired();
    expect(screen.getByRole('textbox', { name: /ชื่อเต็ม/ })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /โครงการที่เปิดรับ/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /สถานะประกาศ/ }),
    ).toBeRequired();
    expect(screen.getByRole('combobox', { name: /ระดับหลักฐาน/ })).toBeRequired();
    expect(screen.getByRole('textbox', { name: /ชื่อที่รู้จัก/ })).toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
  });

  it('locks background scrolling and restores the previous position', async () => {
    document.documentElement.scrollTop = 240;
    const { unmount } = render(
      <CompanyForm
        {...formProps}
        record={null}
        initialValues={emptyCompanyInput()}
      />,
    );

    await screen.findByRole('dialog', { name: 'เพิ่มบริษัทใหม่' });
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-240px');

    unmount();
    expect(document.body.style.position).toBe('');
    expect(document.documentElement.scrollTop).toBe(240);
    document.documentElement.scrollTop = 0;
  });

  it('associates the delete confirmation instruction with its input', async () => {
    const record = {
      id: 'f13e013f-cf8f-40a8-bcdd-df152fa0fd37',
      order: 1,
      ...emptyCompanyInput(),
      companyName: 'Example Co',
    } satisfies CompanyRecord;
    render(
      <CompanyForm
        {...formProps}
        record={record}
        initialValues={emptyCompanyInput()}
      />,
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'ลบรายการนี้' }),
    );
    expect(
      screen.getByRole('textbox', { name: 'พิมพ์ Example Co เพื่อยืนยันการลบ' }),
    ).toBeInTheDocument();
  });

  it('moves focus into the conflict dialog and returns it on close', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'บันทึก';
    document.body.append(opener);
    opener.focus();

    const { unmount } = render(
      <ConflictDialog
        draft={{ companyName: 'Example' }}
        onReload={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      await screen.findByRole('alertdialog', {
        name: 'ไฟล์ Excel มีการเปลี่ยนแปลง',
      }),
    ).toHaveAttribute('open');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'โหลดข้อมูลล่าสุด' }),
      ).toHaveFocus(),
    );

    unmount();
    expect(opener).toHaveFocus();
  });
});
