"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchCompanies, type CompaniesResponse } from "@/lib/api/client";
export const companiesKey = ["companies"] as const;
export function useCompanies(initialData: CompaniesResponse) {
  return useQuery({ queryKey: companiesKey, queryFn: fetchCompanies, initialData, refetchInterval: 30_000 });
}
