import { Circle, CircleCheck, Clock3, RotateCw, SearchX } from "lucide-react";
import type { AnnouncementStatus } from "@/types/company";
const icons = { "เปิดรับ": CircleCheck, Rolling: RotateCw, "ยังไม่เปิดรอบ": Clock3, "ปิดรับแล้ว": Circle, "ไม่พบประกาศปัจจุบัน": SearchX } satisfies Record<AnnouncementStatus, typeof Circle>;
export function StatusBadge({ status }: { status: AnnouncementStatus }) { const Icon = icons[status]; return <span className={`status-badge status-${status}`}><Icon size={13} />{status}</span>; }
