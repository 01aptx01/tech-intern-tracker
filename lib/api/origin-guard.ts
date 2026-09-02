import { getExcelConfig } from "@/lib/excel/config";

export function isValidMutationRequest(request: Request) {
  const config = getExcelConfig();
  return request.headers.get("origin") === config.appOrigin
    && request.headers.get("x-requested-with") === "tech-intern-tracker"
    && request.headers.get("content-type")?.toLowerCase().startsWith("application/json") === true;
}
