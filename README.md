# Tech Internship Tracker

เว็บแอปส่วนตัวสำหรับค้นหา คัดกรอง และติดตามการสมัครฝึกงานสาย Tech ในประเทศไทย โดยใช้ไฟล์ Excel เดิมเป็น source of truth ข้อมูลถูกอ่านและเขียนบนเครื่องเท่านั้น ไม่ต้องมีฐานข้อมูลหรือบัญชี cloud

## ความสามารถหลัก

- Dashboard จากข้อมูลจริง พร้อม KPI, กราฟสถานะ, กลุ่มสายงาน และ deadline 30 วัน
- ค้นหาภาษาไทย/อังกฤษ, filter หลายเงื่อนไข, sort และ pagination
- เพิ่ม แก้ไข ลบ และ quick edit สถานะ โดยบันทึกกลับ `.xlsx`
- ตรวจการเปลี่ยนแปลงจาก Microsoft Excel และ refresh หน้าเว็บผ่าน Server-Sent Events
- SHA-256 version conflict protection, owner-lock detection และ atomic file replacement
- สร้าง backup ก่อนทุก write และเก็บ 20 รุ่นล่าสุด
- Responsive UI สำหรับ desktop, tablet และ mobile พร้อม light/dark theme
- รักษา 3 ชีต, table, สูตรสรุป, validation, conditional formatting, hyperlink และคอลัมน์ UUID ที่ซ่อนอยู่

## สิ่งที่ต้องมี

- Windows 10/11 (สภาพแวดล้อมใช้งานหลัก)
- Node.js 22 หรือใหม่กว่า
- npm
- Workbook `.xlsx` ที่มีชีตต่อไปนี้:
  - `บริษัทฝึกงาน`
  - `สรุปและลำดับดำเนินการ`
  - `คำอธิบายและแหล่งข้อมูล`
- Header ของชีตหลักอยู่แถว 4 และตรงกับ schema 22 คอลัมน์ของโปรเจกต์

## ติดตั้ง

```powershell
git clone https://github.com/01aptx01/tech-intern-tracker.git
Set-Location tech-intern-tracker
npm install
Copy-Item .env.example .env.local
```

แก้ `.env.local` ให้เป็น absolute path ของเครื่อง:

```dotenv
EXCEL_FILE_PATH=C:\absolute\path\to\tech_internship_thailand_2569_2570.xlsx
EXCEL_BACKUP_DIR=C:\absolute\path\to\backups
APP_ORIGIN=http://127.0.0.1:3000
```

ตรวจ configuration และโครงสร้าง workbook:

```powershell
npm run verify:environment
npm run inspect:workbook
```

## เปิดใช้งาน

```powershell
npm run dev
```

เปิด [http://127.0.0.1:3000](http://127.0.0.1:3000) แอป bind เฉพาะ `127.0.0.1` จึงไม่เปิดให้เครื่องอื่นในเครือข่ายเข้าถึง

สำหรับ production build:

```powershell
npm run build
npm start
```

## ใช้งานร่วมกับ Excel

1. เปิดเว็บและแก้ข้อมูลจากหน้า dashboard ได้ตามปกติ
2. หากต้องการแก้จาก Microsoft Excel ให้บันทึกไฟล์ก่อน หน้าเว็บจะตรวจพบและโหลดข้อมูลใหม่อัตโนมัติ
3. ก่อนบันทึกจากเว็บควรปิด workbook ใน Microsoft Excel เพราะ Excel สร้าง owner-lock file เพื่อป้องกันการเขียนพร้อมกัน
4. เมื่อเกิด version conflict แอปจะไม่ overwrite ไฟล์ ให้เลือกโหลดข้อมูลล่าสุดก่อน
5. ดาวน์โหลด workbook ปัจจุบันได้จากปุ่มดาวน์โหลดบน header

ทุก record มี UUID ในคอลัมน์ `_record_id` ที่ซ่อนไว้ ระบบสร้างหรือซ่อม UUID ให้อัตโนมัติพร้อม backup โดยไม่ใช้เลขแถวหรือชื่อบริษัทเป็น primary key

## Backup และการกู้คืน

ระบบสร้าง backup ก่อน initialize UUID และก่อน add/edit/delete ทุกครั้ง ชื่อไฟล์มี UTC timestamp และเก็บ 20 รุ่นล่าสุดใน `EXCEL_BACKUP_DIR`

วิธีกู้คืน:

1. ปิด development/production server
2. ปิด workbook ใน Microsoft Excel
3. สำรองไฟล์หลักรุ่นปัจจุบันไว้อีกที่หนึ่ง
4. คัดลอก backup ที่ต้องการมาทับ path ใน `EXCEL_FILE_PATH`
5. เปิด server แล้วรัน `npm run inspect:workbook`

## ตรวจสอบคุณภาพ

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run verify
```

Integration tests สร้าง workbook จำลองใน temporary directory จึงไม่อ่านหรือเขียน Excel จริง GitHub Actions ทดสอบทั้ง Windows และ Linux และ build บน Ubuntu

## Troubleshooting

### Workbook not found

ตรวจว่า `EXCEL_FILE_PATH` เป็น absolute path, ลงท้าย `.xlsx` และไม่มี quote เกินมา จากนั้น restart server เพราะ environment variables ถูกอ่านตอนเริ่ม process

### Workbook locked

บันทึกและปิด workbook ใน Microsoft Excel แล้วกด “ลองบันทึกอีกครั้ง” Draft ใน form จะยังไม่หาย ระบบไม่ queue mutation และไม่สร้างแถวซ้ำ

### Header mismatch หรือ Invalid workbook

ตรวจชื่อทั้ง 3 ชีต, header แถว 4 และจำนวนคอลัมน์ ระบบจะหยุดเขียนทันทีเมื่อ schema ไม่ตรงหรือพบ formula error เพื่อป้องกันข้อมูลเสีย

### Version conflict

ไฟล์ถูกเปลี่ยนหลังหน้าเว็บโหลด เลือก “โหลดข้อมูลล่าสุด” แล้วตรวจ draft อีกครั้ง ห้ามแก้ hash หรือบังคับ overwrite

### Port 3000 ถูกใช้งาน

ปิด process เดิมที่ใช้ port 3000 แล้วเริ่มใหม่ ค่า `APP_ORIGIN` ต้องตรงกับ URL ที่ browser เปิดเพื่อให้ mutation ผ่าน origin guard

## ความเป็นส่วนตัวและความปลอดภัย

- Workbook, backup, `.env.local`, personal notes และ contact data ถูก ignore จาก Git
- ไม่มีการส่ง workbook ไปยัง cloud และ server ไม่ fetch URL ที่อยู่ใน Excel
- Mutation รับเฉพาะ JSON จาก `APP_ORIGIN` พร้อม custom request header
- API ไม่รับ file path จาก query, body หรือ header
- Text ถูกเขียนเป็น literal เพื่อป้องกัน formula injection และ UI ไม่ใช้ `dangerouslySetInnerHTML`
- External links เปิดด้วย `noopener noreferrer`

## สถาปัตยกรรม

- Next.js App Router + React Server Components สำหรับ initial snapshot
- TypeScript strict, TanStack Query, React Hook Form + Zod, Recharts
- ExcelJS adapter ฝั่ง Node.js พร้อม mutex, backup, temporary verification และ rollback-safe replacement
- Chokidar singleton เฝ้า workbook/owner lock และส่ง event ผ่าน SSE
- Excel เป็น source of truth; ไม่มี database, authentication หรือ cloud storage

## License

[MIT](./LICENSE)
