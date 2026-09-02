import { getExcelRepository } from "@/lib/excel/repository";

export async function ensureServerReady() {
  return getExcelRepository().initialize();
}
