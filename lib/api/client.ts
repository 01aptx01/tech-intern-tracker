import type { ApiError, ApiSuccess } from "@/types/api";
import type { CompanyInput, CompanyRecord, WorkbookSnapshot } from "@/types/company";

export type CompaniesData = Pick<WorkbookSnapshot, "records" | "total" | "syncStatus" | "errorMessage">;
export type CompaniesResponse = ApiSuccess<CompaniesData>;

export class ClientApiError extends Error {
  constructor(public readonly detail: ApiError["error"], public readonly status: number) {
    super(detail.message);
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body = await response.json() as T | ApiError;
  if (!response.ok) throw new ClientApiError((body as ApiError).error, response.status);
  return body as T;
}

export const fetchCompanies = () => fetch("/api/companies", { cache: "no-store" }).then((response) => parse<CompaniesResponse>(response));

const mutationHeaders = { "Content-Type": "application/json", "X-Requested-With": "tech-intern-tracker" };
export const createCompany = (baseVersion: string, record: CompanyInput) => fetch("/api/companies", {
  method: "POST", headers: mutationHeaders, body: JSON.stringify({ baseVersion, record }),
}).then((response) => parse<ApiSuccess<{ record: CompanyRecord; records: CompanyRecord[]; total: number }>>(response));
export const patchCompany = (id: string, baseVersion: string, changes: Partial<CompanyInput>) => fetch(`/api/companies/${encodeURIComponent(id)}`, {
  method: "PATCH", headers: mutationHeaders, body: JSON.stringify({ baseVersion, changes }),
}).then((response) => parse<ApiSuccess<{ record: CompanyRecord; records: CompanyRecord[]; total: number }>>(response));
export const removeCompany = (id: string, baseVersion: string, confirmationName: string) => fetch(`/api/companies/${encodeURIComponent(id)}`, {
  method: "DELETE", headers: mutationHeaders, body: JSON.stringify({ baseVersion, confirmationName }),
}).then((response) => parse<ApiSuccess<{ records: CompanyRecord[]; total: number }>>(response));
