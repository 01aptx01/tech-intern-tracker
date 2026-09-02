"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { companiesKey } from "./use-companies";

export function useExcelEvents(onMessage: (message: string, kind?: "error" | "success") => void) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onmessage = (message) => {
      const event = JSON.parse(message.data) as { type: string; source?: string; message?: string; locked?: boolean };
      if (event.type === "workbook.changed") {
        void queryClient.invalidateQueries({ queryKey: companiesKey });
        if (event.source === "excel") onMessage("อัปเดตข้อมูลจาก Excel แล้ว", "success");
      }
      if (event.type === "sync.error") onMessage(event.message ?? "ซิงก์ Excel ไม่สำเร็จ", "error");
      if (event.type === "lock.changed" && event.locked === false) onMessage("Excel พร้อมบันทึกแล้ว", "success");
    };
    return () => events.close();
  }, [onMessage, queryClient]);
}
