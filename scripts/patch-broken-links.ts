import fs from 'node:fs/promises';
import path from 'node:path';
import { createBackup } from '@/lib/excel/backup';
import { getExcelConfig } from '@/lib/excel/config';
import { isWorkbookLocked } from '@/lib/excel/lock';
import { loadWorkbookState } from '@/lib/excel/reader';
import { preparePatch, saveAndVerify } from '@/lib/excel/writer';
import { AppError } from '@/lib/api/errors';
import type { CompanyRecord } from '@/types/company';

async function main() {
  const config = getExcelConfig();
  console.log('Using workbook:', config.filePath);

  if (await isWorkbookLocked(config.filePath)) {
    throw new AppError('WORKBOOK_LOCKED', 'Excel กำลังเปิดใช้งานไฟล์นี้อยู่ กรุณาปิดไฟล์ก่อน', 423, true);
  }

  // 1. Create backups
  const backupName = await createBackup(config.filePath, config.backupDir);
  console.log('Created backup in backupDir:', backupName);

  const localBackup = path.join(
    path.dirname(config.filePath),
    `${path.basename(config.filePath, '.xlsx')}.pre-patch-backup.xlsx`
  );
  await fs.copyFile(config.filePath, localBackup);
  console.log('Created local backup:', localBackup);

  // 2. Load state
  const state = await loadWorkbookState(config.filePath);
  console.log(`Loaded state with ${state.records.length} records.`);

  // 3. Define updates
  const patchMap: Record<number, Partial<CompanyRecord>> = {
    // 68: Swiftlet (Server Down / Cloudflare 522)
    68: {
      announcementStatus: 'ไม่พบประกาศปัจจุบัน',
      evidenceLevel: 'C',
      qualificationsNotes: '[ตรวจ 05/09/2569: ลิงก์เสีย - เซิร์ฟเวอร์ต้นทางไม่ตอบสนอง Cloudflare Error 522 Connection Timed Out] หลักฐาน B: เดิมสมัครได้ตามแหล่งที่ตรวจพบ. บริษัทพัฒนาซอฟต์แวร์ผู้จัดงาน RubyConf Thailand เน้น Clean Code',
      verifiedAt: '2026-09-05',
    },
    // 69: Opendream (Broken 404 -> update to homepage)
    69: {
      applicationUrl: 'https://opendream.co.th/',
      qualificationsNotes: '[ตรวจ 05/09/2569: ลิงก์รับสมัครเดิมเสีย 404 ปรับเป็นหน้าหลักบริษัท] เน้นสร้างดิจิทัลโซลูชันเพื่อสร้างผลกระทบเชิงบวกต่อสังคมและสาธารณสุข',
      verifiedAt: '2026-09-05',
    },
    // 29: Shopee Thailand (Indeed Bot Shield -> Official Career Portal)
    29: {
      applicationUrl: 'https://careers.shopee.co.th/',
      qualificationsNotes: '[ตรวจ 05/09/2569: อัปเดตลิงก์สมัครเป็น Shopee Careers Portal ทางการ] หลักฐาน B: สมัครได้ตามแหล่งที่ตรวจพบ แต่ต้องเปิดตรวจ JD/Apply button และเงื่อนไขล่าสุดอีกครั้งก่อนสมัคร. Business Intelligence Intern (SPX Express): ใช้ Python/SQL, analytics และ automation; มี role automation intern อื่นใน SPX ด้วย',
      verifiedAt: '2026-09-05',
    },
    // 80: Pacifica Elements (Closed on WorkMundi)
    80: {
      announcementStatus: 'ปิดรับแล้ว',
      qualificationsNotes: '[ตรวจ 05/09/2569: ปิดรับแล้ว - หน้า WorkMundi ระบุ This job has closed] ช่วยดูแล endpoint, software, access, POS และ IT asset',
      verifiedAt: '2026-09-05',
    },
    // 94: M.J. Bangkok Valve & Fitting (Expired on JobThai)
    94: {
      announcementStatus: 'ปิดรับแล้ว',
      qualificationsNotes: '[ตรวจ 05/09/2569: ปิดรับแล้ว - ประกาศรับสมัครบน JobThai หมดอายุแล้ว] เหมาะ IT Support/Infrastructure; มีค่าตอบแทนรายวันตามประกาศ',
      verifiedAt: '2026-09-05',
    },
    // 95: BEAUTRIUM (Expired on JobThai)
    95: {
      announcementStatus: 'ปิดรับแล้ว',
      qualificationsNotes: '[ตรวจ 05/09/2569: ปิดรับแล้ว - ประกาศรับสมัครตำแหน่ง IT Support Intern บน JobThai หมดอายุแล้ว] งาน support ผู้ใช้/อุปกรณ์/ระบบร้าน',
      verifiedAt: '2026-09-05',
    },
    // 98: Bangkok Payment Solutions (Expired on JobThai)
    98: {
      announcementStatus: 'ปิดรับแล้ว',
      qualificationsNotes: '[ตรวจ 05/09/2569: ปิดรับแล้ว - ประกาศรับสมัครบน JobThai หมดอายุแล้ว] บริษัทสาย payment solution; ประกาศที่พบมีทั้ง Developer/Programmer และ IT Support',
      verifiedAt: '2026-09-05',
    },
    // 136: Schneider Electric Thailand (Closed on LinkedIn)
    136: {
      announcementStatus: 'ปิดรับแล้ว',
      qualificationsNotes: '[ตรวจ 05/09/2569: ปิดรับแล้ว - ประกาศบน LinkedIn ปิดรับสมัครแล้ว (No longer accepting applications)] ประกาศระบุ IT/Data Science/CS/AI และ Digital Manufacturing',
      verifiedAt: '2026-09-05',
    },
    // 155: Cleverse (Broken 404 -> update to homepage)
    155: {
      applicationUrl: 'https://cleverse.com/',
      qualificationsNotes: '[ตรวจ 05/09/2569: ลิงก์รับสมัครเดิมเสีย 404 ปรับเป็นหน้าหลักบริษัท] Venture builder โฟกัส Web3, DeFi, AI และ cutting-edge tech วัฒนธรรม builder จัดจ้าน',
      verifiedAt: '2026-09-05',
    },
    // 159: Beryl 8 Plus (Broken 404 -> update to homepage)
    159: {
      applicationUrl: 'https://www.beryl8.com/',
      qualificationsNotes: '[ตรวจ 05/09/2569: ลิงก์รับสมัครเดิมเสีย 404 ปรับเป็นหน้าหลักบริษัท] พาร์ทเนอร์ระดับสูงของ Salesforce ในภูมิภาค เชี่ยวชาญระบบ Enterprise Cloud & Data Integration',
      verifiedAt: '2026-09-05',
    },
    // 164: AppMan (Broken 404 -> update to valid career page)
    164: {
      applicationUrl: 'https://www.appman.co.th/career/',
      qualificationsNotes: '[ตรวจ 05/09/2569: แก้ไขลิงก์เสียเดิมเป็น https://www.appman.co.th/career/] ผู้สร้าง AgentMate และผู้นำเทคโนโลยี Optical Character Recognition (OCR) สแกนเอกสารด้วย AI',
      verifiedAt: '2026-09-05',
    },
    // 174: Beam (Broken 404 -> update to homepage)
    174: {
      applicationUrl: 'https://beamcheckout.com/',
      qualificationsNotes: '[ตรวจ 05/09/2569: ลิงก์รับสมัครเดิมเสีย 404 ปรับเป็นหน้าหลักบริษัท] สตาร์ทอัพ FinTech ด้าน Frictionless Checkout ทำงานแนว Fast-paced บรรยากาศ Silicon Valley',
      verifiedAt: '2026-09-05',
    },
  };

  let updatedCount = 0;
  const expectedRecords: CompanyRecord[] = [];

  for (const record of state.records) {
    const patch = patchMap[record.order];
    if (patch) {
      const nextRecord: CompanyRecord = { ...record, ...patch };
      const fields = Object.keys(patch) as (keyof CompanyRecord)[];
      preparePatch(state, nextRecord, fields);
      expectedRecords.push(nextRecord);
      updatedCount++;
      console.log(`Patched [ID ${record.order}] ${record.companyName}:`, patch);
    } else {
      expectedRecords.push(record);
    }
  }

  console.log(`Applying updates to ${updatedCount} records...`);

  // 4. Save and verify
  await saveAndVerify(state, config.filePath, expectedRecords, (actual) => {
    let allPassed = true;
    for (const [orderStr, patch] of Object.entries(patchMap)) {
      const order = Number(orderStr);
      const row = actual.find((r) => r.order === order);
      if (!row) {
        console.error(`Missing row for order ${order}`);
        allPassed = false;
        continue;
      }
      for (const [k, v] of Object.entries(patch)) {
        const actualVal = typeof (row as any)[k] === 'string' ? (row as any)[k].normalize('NFKC') : (row as any)[k];
        const expectedVal = typeof v === 'string' ? v.normalize('NFKC') : v;
        if (actualVal !== expectedVal) {
          console.error(`Mismatch for order ${order}, field ${k}: actual="${actualVal}" vs expected="${expectedVal}"`);
          allPassed = false;
        }
      }
    }
    return allPassed;
  });

  console.log('Successfully saved and verified workbook!');

  // 5. Re-check reload
  const reloaded = await loadWorkbookState(config.filePath);
  console.log(`Reload verification: Successfully reloaded ${reloaded.records.length} records!`);
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
