import { z } from 'zod';
import { announcementStatuses, evidenceLevels, userStatuses } from '@/types/company';
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const url = z.string().url().refine(v=>/^https?:\/\//.test(v)).nullable();
export const companyInputSchema = z.object({
  companyName: z.string().trim().min(1).max(200), business: z.string().max(2000).nullable(), techRoles: z.array(z.string().min(1)).default([]),
  thailandLocation: z.string().max(500).nullable(), workMode: z.string().max(100).nullable(), contact: z.string().max(2000).nullable(), applicationUrl: url,
  announcementStatus: z.enum(announcementStatuses), applicationWindow: z.string().max(1000).nullable(), applicationDeadline: date,
  internshipPeriod: z.string().max(1000).nullable(), programTypes: z.array(z.string().min(1)).default([]), qualificationsNotes: z.string().max(5000).nullable(),
  primarySourceUrl: url, secondarySourceUrl: url, verifiedAt: date, evidenceLevel: z.enum(evidenceLevels), userStatus: z.enum(userStatuses).nullable(),
  contactedAt: date, followUpAt: date, personalNotes: z.string().max(5000).nullable(),
}).strict();
export const patchSchema = z.object({ baseVersion: z.string().min(1), changes: companyInputSchema.partial() });
export const createSchema = z.object({ baseVersion: z.string().min(1), record: companyInputSchema });
