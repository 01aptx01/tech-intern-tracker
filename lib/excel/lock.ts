import fs from 'node:fs/promises'; import path from 'node:path';
export async function isWorkbookLocked(file:string){ try{ await fs.access(path.join(path.dirname(file),'~$'+path.basename(file))); return true; }catch{return false;} }
