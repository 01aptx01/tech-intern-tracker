export const cleanText = (v: unknown): string | null => { const s = typeof v === 'string' ? v.normalize('NFKC').trim() : v == null ? '' : String(v).trim(); return s ? s : null; };
export const splitTags = (v: unknown): string[] => [...new Set((cleanText(v) ?? '').split(';').map(x=>x.trim()).filter(Boolean))];
export const normalizeCompanyName = (v: string) => v.normalize('NFKC').trim().toLocaleLowerCase('th-TH');
export const safeExcelText = (v: string | null) => v && /^[=+\-@]/.test(v) ? `'${v}` : v;
