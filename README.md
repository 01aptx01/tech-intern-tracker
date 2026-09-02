# Tech Internship Tracker

เว็บส่วนตัวสำหรับติดตามบริษัทฝึกงานสาย Tech ในประเทศไทย โดยอ่านและเขียนไฟล์ Excel เดิมโดยตรงบนเครื่อง local

## เริ่มใช้งาน

ต้องใช้ Node.js 22 ขึ้นไปและมีไฟล์ `.xlsx` ที่มีชีต `บริษัทฝึกงาน` โดย header อยู่แถว 4

```powershell
npm install
Copy-Item .env.example .env.local
# แก้ EXCEL_FILE_PATH และ EXCEL_BACKUP_DIR ใน .env.local
npm run dev
```

เปิด [http://127.0.0.1:3000](http://127.0.0.1:3000)

เว็บรองรับค้นหา กรองสถานะ เพิ่ม/แก้ไข/ลบบริษัท และ quick edit สถานะของคุณ การบันทึกทุกครั้งจะสร้าง backup ก่อนเขียนและตรวจ version ของไฟล์เพื่อป้องกันการเขียนทับข้อมูลจาก Excel ที่ถูกแก้ภายนอก ดาวน์โหลดไฟล์ปัจจุบันได้จากปุ่ม Download Excel

อย่าเปิด Excel ค้างขณะบันทึกจากเว็บ หากพบ version conflict ให้โหลดข้อมูลล่าสุดก่อนแก้ไขใหม่ Backup อยู่ใน `EXCEL_BACKUP_DIR`; หากต้องกู้คืน ให้ปิด server แล้วคัดลอก backup ที่ต้องการทับไฟล์หลัก

## ตรวจสอบคุณภาพ

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

ข้อมูล Excel และหมายเหตุส่วนตัวไม่ถูกส่งขึ้น cloud และไม่ควร commit `.env.local`, `.xlsx` หรือ backup เข้า Git

## Architecture

Next.js App Router (ผ่าน Vinext-compatible runtime), TypeScript strict, ExcelJS adapter ฝั่ง Node, guarded atomic writes, SHA-256 versioning และ API route สำหรับ companies, events, download และ health

License: MIT (ดู [LICENSE](./LICENSE))
