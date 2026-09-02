export function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const normalized = value.normalize("NFKC").trim();
    return normalized || null;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export function splitTags(value: unknown): string[] {
  const tokens = (cleanText(value) ?? "")
    .split(";")
    .map((token) => token.trim())
    .filter(Boolean);
  return [...new Map(tokens.map((token) => [token.normalize("NFKC").toLocaleLowerCase("th-TH"), token])).values()];
}

export const joinTags = (values: string[]) => values.map((value) => value.trim()).filter(Boolean).join("; ");
export const normalizeCompanyName = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("th-TH");
export const normalizeSearchText = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("th-TH");
export const normalizeSearch = normalizeSearchText;
export const safeExcelText = (value: string | null) => (value && /^[=+\-@]/.test(value) ? `'${value}` : value);
