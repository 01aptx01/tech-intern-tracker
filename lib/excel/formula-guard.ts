import { safeExcelText } from "@/lib/companies/normalize";
export const toSafeTextCell = (value: string | null) => safeExcelText(value);
