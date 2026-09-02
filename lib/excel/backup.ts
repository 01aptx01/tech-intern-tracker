import fs from "node:fs/promises";
import path from "node:path";

const KEEP_COUNT = 20;
export async function createBackup(filePath: string, backupDir: string) {
  try {
    await fs.mkdir(backupDir, { recursive: true });
    const base = path.basename(filePath, ".xlsx");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = path.join(backupDir, `${base}.${stamp}.xlsx`);
    await fs.copyFile(filePath, outputPath, fs.constants.COPYFILE_EXCL);
    const backups = (await fs.readdir(backupDir))
      .filter((name) => name.startsWith(`${base}.`) && name.endsWith(".xlsx"))
      .sort()
      .reverse();
    for (const oldName of backups.slice(KEEP_COUNT)) await fs.unlink(path.join(backupDir, oldName));
    return outputPath;
  } catch (cause) {
    throw Object.assign(new Error("สร้าง backup ไม่สำเร็จ จึงยกเลิกการบันทึก", { cause }), { code: "BACKUP_FAILED", status: 500 });
  }
}
