import { z } from 'zod';
import {
  announcementStatuses,
  evidenceLevels,
  userStatusValues,
} from '@/types/company';

const emptyToNull = (value: unknown) =>
  value === '' || value === undefined ? null : value;
const nullableText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable());
const dateOnly = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่ต้องเป็น YYYY-MM-DD')
    .nullable(),
);
const httpUrl = z.preprocess(
  emptyToNull,
  z
    .string()
    .url('URL ไม่ถูกต้อง')
    .refine(
      (value) => /^https?:\/\//i.test(value),
      'URL ต้องเริ่มด้วย http:// หรือ https://',
    )
    .nullable(),
);

export const companyInputSchema = z
  .object({
    companyName: z.string().trim().min(1, 'กรุณาระบุชื่อที่รู้จัก').max(200),
    fullCompanyName: nullableText(500),
    business: nullableText(2_000),
    techRoles: z.array(z.string().trim().min(1)).max(50),
    thailandLocation: nullableText(500),
    workMode: nullableText(100),
    contact: nullableText(2_000),
    applicationUrl: httpUrl,
    announcementStatus: z.enum(announcementStatuses),
    applicationWindow: nullableText(1_000),
    applicationDeadline: dateOnly,
    internshipPeriod: nullableText(1_000),
    programTypes: z.array(z.string().trim().min(1)).max(30),
    openPrograms: z.array(z.string().trim().min(1)).max(50),
    qualificationsNotes: nullableText(5_000),
    primarySourceUrl: httpUrl,
    secondarySourceUrl: httpUrl,
    verifiedAt: dateOnly,
    evidenceLevel: z.enum(evidenceLevels),
    userStatus: z.enum(userStatusValues).nullable(),
    contactedAt: dateOnly,
    followUpAt: dateOnly,
    personalNotes: nullableText(5_000),
  })
  .strict();

export const companyRecordSchema = companyInputSchema
  .extend({ id: z.string().uuid(), order: z.number().int().positive() })
  .strict();
export const createCompanySchema = z
  .object({ baseVersion: z.string().length(64), record: companyInputSchema })
  .strict();
export const patchCompanySchema = z
  .object({
    baseVersion: z.string().length(64),
    changes: companyInputSchema.partial(),
  })
  .strict();
export const deleteCompanySchema = z
  .object({
    baseVersion: z.string().length(64),
    confirmationName: z.string().min(1),
  })
  .strict();
