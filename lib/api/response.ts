import {NextResponse} from 'next/server';
export const ok=(data:unknown,snapshot:{version:string;lastModifiedAt:string})=>NextResponse.json({data,meta:{version:snapshot.version,lastModifiedAt:snapshot.lastModifiedAt}},{headers:{'Cache-Control':'no-store'}});
export function fail(e:unknown){const x=e as {code?:string;message?:string;status?:number}; return NextResponse.json({error:{code:x.code||'INVALID_WORKBOOK',message:x.message||'เกิดข้อผิดพลาด',retryable:(x.status||500)>=500}},{status:x.status||500});}
