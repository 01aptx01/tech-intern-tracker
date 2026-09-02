import {getConfig} from '@/lib/excel/config'; import {downloadWorkbook} from '@/lib/excel/repository';
export const runtime='nodejs';
export async function GET(){const bytes=await downloadWorkbook(); return new Response(bytes as BodyInit,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="tech_internship_thailand_2569_2570.xlsx"`,'Cache-Control':'no-store'}})}
