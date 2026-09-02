import {getSnapshot} from '@/lib/excel/repository';
export async function ensureServerReady(){return getSnapshot();}
