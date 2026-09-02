import {describe,it,expect} from 'vitest'; import {splitTags,normalizeCompanyName} from '@/lib/companies/normalize';
describe('normalize',()=>{it('splits and deduplicates tags',()=>expect(splitTags(' SWE; AI/Data ; SWE; ')).toEqual(['SWE','AI/Data']));it('normalizes names',()=>expect(normalizeCompanyName(' Agoda ')).toBe('agoda'))});
