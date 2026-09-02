import fs from 'node:fs/promises';
import crypto, { randomUUID } from 'node:crypto';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { getConfig } from './config';
import { SHEET, HEADER_ROW, DATA_START, headers } from './constants';
import { cleanText, splitTags } from '@/lib/companies/normalize';
import { excelDateToString } from './date';
import type { CompanyRecord, WorkbookSnapshot } from '@/types/company';
import { createBackup } from './backup';

const cellText = (v: unknown): unknown => { if (v && typeof v === 'object' && 'text' in v) return String((v as {text:string}).text); if (v && typeof v === 'object' && 'result' in v) return (v as {result:unknown}).result; return v; };
export async function readWorkbook(fileOverride?: string): Promise<WorkbookSnapshot> {
  const cfg=getConfig(); const file=fileOverride||cfg.file; const stat=await fs.stat(file); const bytes=await fs.readFile(file);
  const version=crypto.createHash('sha256').update(bytes as unknown as Buffer).digest('hex'); const wb=new ExcelJS.Workbook(); await wb.xlsx.load(bytes as never);
  const ws=wb.getWorksheet(SHEET); if(!ws) throw new Error(`Missing worksheet ${SHEET}`);
  const map=new Map<string,number>(); let hasIdHeader=false; for(let c=1;c<=headers.length;c++){const expected=headers[c-1]; const actual=cleanText(ws.getCell(HEADER_ROW,c).value); if(c===2 && !actual) throw new Error('Header row 4 does not match expected workbook schema'); if(c===23 && actual==='_record_id') hasIdHeader=true; map.set(expected,c);}
  const records:CompanyRecord[]=[];
  for(let r=DATA_START;r<=ws.rowCount;r++){const row=ws.getRow(r); const name=cleanText(cellText(row.getCell(map.get('บริษัท')!).value)); const id=map.has('_record_id')?cleanText(cellText(row.getCell(map.get('_record_id')!).value)):null; if(!name&&!id) continue; if(!name) continue;
    const val=(h:string)=>cellText(row.getCell(map.get(h)!).value);
    records.push({id:id||randomUUID(),order:Number(val('ลำดับ'))||records.length+1,companyName:name,business:cleanText(val('ธุรกิจ')),techRoles:splitTags(val('สาย Tech ที่เกี่ยวข้อง')),thailandLocation:cleanText(val('ที่ตั้ง/สถานที่ฝึกในไทย')),workMode:cleanText(val('รูปแบบทำงาน')),contact:cleanText(val('ข้อมูลติดต่อ HR / บริษัท')),applicationUrl:cleanText(val('ลิงก์สมัคร/อาชีพ')),announcementStatus:(cleanText(val('สถานะประกาศ'))||'ไม่พบประกาศปัจจุบัน') as CompanyRecord['announcementStatus'],applicationWindow:cleanText(val('ช่วงเปิดรับ/Deadline')),applicationDeadline:excelDateToString(val('วันปิดรับ')),internshipPeriod:cleanText(val('ช่วงฝึกงาน/สหกิจ')),programTypes:splitTags(val('ประเภทโปรแกรม')),qualificationsNotes:cleanText(val('คุณสมบัติ/หมายเหตุ')),primarySourceUrl:cleanText(val('แหล่งอ้างอิงหลัก')),secondarySourceUrl:cleanText(val('แหล่งอ้างอิงเสริม')),verifiedAt:excelDateToString(val('ตรวจสอบล่าสุด')),evidenceLevel:(cleanText(val('ระดับหลักฐาน'))||'C') as CompanyRecord['evidenceLevel'],userStatus:(cleanText(val('สถานะของคุณ'))||null) as CompanyRecord['userStatus'],contactedAt:excelDateToString(val('วันที่ติดต่อ')),followUpAt:excelDateToString(val('ติดตามครั้งถัดไป')),personalNotes:cleanText(val('หมายเหตุส่วนตัว'))});
  }
  const ids=new Set<string>(); let needs=!hasIdHeader; for(const rec of records){if(ids.has(rec.id)){rec.id=randomUUID();needs=true;} ids.add(rec.id);} if(needs){await initializeIds(file,records,wb,ws,map); return readWorkbook(file);}
  return {records,version,lastModifiedAt:stat.mtime.toISOString(),total:records.length,sourceFileName:path.basename(file),syncStatus:'synced'};
}
async function initializeIds(file:string,records:CompanyRecord[],wb:ExcelJS.Workbook,ws:ExcelJS.Worksheet,map:Map<string,number>){const cfg=getConfig(); await createBackup(file,cfg.backupDir); const idCol=map.get('_record_id')||23; ws.getCell(HEADER_ROW,idCol).value='_record_id'; ws.getColumn(idCol).hidden=true; let i=0; for(let r=DATA_START;r<=ws.rowCount;r++){const name=cleanText(ws.getCell(r,map.get('บริษัท')!).value); if(name) ws.getCell(r,idCol).value=records[i++]?.id||randomUUID();} const tmp=`${file}.${randomUUID()}.tmp.xlsx`; await wb.xlsx.writeFile(tmp); await fs.rename(tmp,file);}
