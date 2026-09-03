import { describe, expect, it } from 'vitest';
import {
  filterCompanies,
  matchesSearch,
  sortCompanies,
} from '@/lib/companies/filters';
import type { CompanyRecord } from '@/types/company';

const base: CompanyRecord = {
  id: '5fc69a3f-00ef-4d7f-b0b4-62169972867d',
  order: 1,
  companyName: 'บริษัท อัลฟ่า',
  fullCompanyName: 'บริษัท อัลฟ่า เทคโนโลยี จำกัด',
  business: 'ซอฟต์แวร์',
  techRoles: ['Software Engineer'],
  thailandLocation: 'กรุงเทพฯ',
  workMode: 'Hybrid',
  contact: null,
  applicationUrl: null,
  announcementStatus: 'เปิดรับ',
  applicationWindow: null,
  applicationDeadline: '2026-09-10',
  internshipPeriod: null,
  programTypes: ['Co-op'],
  openPrograms: ['Alpha Young Tech'],
  qualificationsNotes: null,
  primarySourceUrl: null,
  secondarySourceUrl: null,
  verifiedAt: null,
  evidenceLevel: 'A',
  userStatus: null,
  contactedAt: null,
  followUpAt: null,
  personalNotes: 'สนใจ backend',
};
it('searches Thai and English tokens across fields', () =>
  expect(matchesSearch(base, 'อัลฟ่า backend')).toBe(true));
it('uses AND across filter groups', () => {
  const result = filterCompanies([base], {
    query: '',
    announcementStatuses: ['เปิดรับ'],
    userStatuses: [],
    techRoles: ['Software Engineer'],
    programTypes: [],
    evidenceLevels: ['A'],
    locations: [],
    workModes: ['Hybrid'],
    deadline: 'all',
  });
  expect(result).toHaveLength(1);
});
describe('default sort', () =>
  it('puts open before rolling', () =>
    expect(
      sortCompanies([
        { ...base, announcementStatus: 'Rolling', companyName: 'B' },
        base,
      ])[0].announcementStatus,
    ).toBe('เปิดรับ')));

describe('expanded company search', () => {
  it('finds a record by full company name', () =>
    expect(matchesSearch(base, 'เทคโนโลยี จำกัด')).toBe(true));
  it('finds a record by open program', () =>
    expect(matchesSearch(base, 'Young Tech')).toBe(true));
});
