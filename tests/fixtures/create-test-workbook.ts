import ExcelJS from "exceljs";
import { allHeaders, MAIN_SHEET, SOURCES_SHEET, SUMMARY_SHEET, visibleHeaders } from "@/lib/excel/constants";

const records = [
  [1, "Alpha Tech", "Software", "Software Engineer; QA", "Bangkok", "Hybrid", "hr@alpha.example", "https://example.com/alpha", "เปิดรับ", "Sep 2026", new Date(Date.UTC(2026, 8, 20, 12)), "Jan-May 2027", "Co-op", "Year 3+", "https://example.com/alpha/source", null, new Date(Date.UTC(2026, 8, 3, 12)), "A", null, null, null, null],
  [2, "Beta Data", "Analytics", "Data Engineer; AI", "Chiang Mai", "On-site", null, "https://example.com/beta", "Rolling", "Rolling", null, "Flexible", "Internship", null, "https://example.com/beta/source", null, new Date(Date.UTC(2026, 8, 3, 12)), "B", "ติดต่อแล้ว", new Date(Date.UTC(2026, 8, 1, 12)), null, "Called HR"],
];

export async function createTestWorkbook(filePath: string, options: { includeIds?: boolean } = {}) {
  const workbook = new ExcelJS.Workbook();
  const main = workbook.addWorksheet(MAIN_SHEET, { views: [{ state: "frozen", ySplit: 4 }] });
  main.mergeCells("A1:V1"); main.getCell("A1").value = "ฐานข้อมูลฝึกงาน";
  main.mergeCells("A2:V2"); main.getCell("A2").value = "ตรวจสอบล่าสุด | 2 บริษัท | ชุดทดสอบ";
  visibleHeaders.forEach((header, index) => main.getCell(4, index + 1).value = header);
  records.forEach((record, rowIndex) => record.forEach((value, columnIndex) => main.getCell(5 + rowIndex, columnIndex + 1).value = value as ExcelJS.CellValue));
  if (options.includeIds) {
    main.getCell(4, 23).value = allHeaders[22];
    main.getCell(5, 23).value = "5fc69a3f-00ef-4d7f-b0b4-62169972867d";
    main.getCell(6, 23).value = "31f67315-1124-4c66-9668-99404fd4e8c5";
    main.getColumn(23).hidden = true;
  }
  main.addTable({ name: "InternshipTracker", ref: "A4", headerRow: true, totalsRow: false, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: visibleHeaders.map((name) => ({ name })), rows: records });
  for (let row = 5; row <= 6; row += 1) {
    main.getCell(row, 19).dataValidation = { type: "list", allowBlank: true, formulae: ['"ไม่รับ,ติดต่อแล้ว,กำลังดำเนินการ,รับแล้ว,เลยช่วง,ไม่มี"'] };
    [11, 17, 20, 21].forEach((column) => main.getCell(row, column).numFmt = "yyyy-mm-dd");
    for (let column = 1; column <= 22; column += 1) {
      main.getCell(row, column).alignment = { vertical: "top", wrapText: true };
      main.getCell(row, column).border = { bottom: { style: "thin", color: { argb: "FF213A4C" } } };
    }
  }
  main.addConditionalFormatting({ ref: "I5:I6", rules: [{ type: "containsText", operator: "containsText", text: "เปิดรับ", style: { font: { color: { argb: "FF22C55E" } } }, priority: 1 }] });
  main.addConditionalFormatting({ ref: "S5:S6", rules: [{ type: "containsText", operator: "containsText", text: "รับแล้ว", style: { font: { color: { argb: "FF22C55E" } } }, priority: 2 }] });
  main.columns = visibleHeaders.map((_, index) => ({ width: index === 1 ? 28 : 18 }));

  const summary = workbook.addWorksheet(SUMMARY_SHEET);
  summary.getCell("A1").value = SUMMARY_SHEET;
  summary.getCell("A4").value = "ตัวชี้วัด"; summary.getCell("B4").value = "จำนวน";
  summary.getCell("A5").value = "บริษัททั้งหมด"; summary.getCell("B5").value = { formula: `COUNTA(${MAIN_SHEET}!B5:B6)`, result: 2 };
  ["SWE", "AI/Data", "QA", "DevOps/Cloud", "Cybersecurity", "IT/Infrastructure"].forEach((name, index) => { summary.getCell(5 + index, 4).value = name; summary.getCell(5 + index, 5).value = 0; });
  summary.getCell("A17").value = "รายการเร่งด่วน";
  ["บริษัท", "สถานะประกาศ", "ช่วงเปิดรับ", "วันปิดรับ", "ช่องทางสมัคร", "สถานะของคุณ"].forEach((value, index) => summary.getCell(18, index + 1).value = value);
  workbook.addWorksheet(SOURCES_SHEET).getCell("A1").value = SOURCES_SHEET;
  await workbook.xlsx.writeFile(filePath);
}
