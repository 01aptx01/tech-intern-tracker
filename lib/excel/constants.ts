export const MAIN_SHEET = "บริษัทฝึกงาน";
export const SUMMARY_SHEET = "สรุปและลำดับดำเนินการ";
export const SOURCES_SHEET = "คำอธิบายและแหล่งข้อมูล";
export const REQUIRED_SHEETS = [MAIN_SHEET, SUMMARY_SHEET, SOURCES_SHEET] as const;
export const HEADER_ROW = 4;
export const DATA_START_ROW = 5;
export const RECORD_ID_COLUMN = 23;
export const TECHNICAL_HEADER = "_record_id";

export const visibleHeaders = [
  "ลำดับ", "บริษัท", "ธุรกิจ", "สาย Tech ที่เกี่ยวข้อง", "ที่ตั้ง/สถานที่ฝึกในไทย", "รูปแบบทำงาน",
  "ข้อมูลติดต่อ HR / บริษัท", "ลิงก์สมัคร/อาชีพ", "สถานะประกาศ", "ช่วงเปิดรับ/Deadline", "วันปิดรับ",
  "ช่วงฝึกงาน/สหกิจ", "ประเภทโปรแกรม", "คุณสมบัติ/หมายเหตุ", "แหล่งอ้างอิงหลัก", "แหล่งอ้างอิงเสริม",
  "ตรวจสอบล่าสุด", "ระดับหลักฐาน", "สถานะของคุณ", "วันที่ติดต่อ", "ติดตามครั้งถัดไป", "หมายเหตุส่วนตัว",
] as const;
export const allHeaders = [...visibleHeaders, TECHNICAL_HEADER] as const;

export const fieldColumns = {
  order: 1, companyName: 2, business: 3, techRoles: 4, thailandLocation: 5, workMode: 6, contact: 7,
  applicationUrl: 8, announcementStatus: 9, applicationWindow: 10, applicationDeadline: 11, internshipPeriod: 12,
  programTypes: 13, qualificationsNotes: 14, primarySourceUrl: 15, secondarySourceUrl: 16, verifiedAt: 17,
  evidenceLevel: 18, userStatus: 19, contactedAt: 20, followUpAt: 21, personalNotes: 22, id: 23,
} as const;

export const dateFields = new Set(["applicationDeadline", "verifiedAt", "contactedAt", "followUpAt"]);
export const arrayFields = new Set(["techRoles", "programTypes"]);
