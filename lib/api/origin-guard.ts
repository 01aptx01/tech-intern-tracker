import {getConfig} from '@/lib/excel/config';
export function guard(request:Request){const cfg=getConfig(); if(request.headers.get('origin')!==cfg.origin || request.headers.get('x-requested-with')!=='tech-intern-tracker' || !request.headers.get('content-type')?.includes('application/json')) return false; return true;}
