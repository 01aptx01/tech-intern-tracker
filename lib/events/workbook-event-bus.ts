export type WorkbookEvent={type:'workbook.changed';version:string;at:string}|{type:'sync.error';at:string;message:string};
type Listener=(e:WorkbookEvent)=>void;
class Bus{private listeners=new Set<Listener>(); subscribe(fn:Listener){this.listeners.add(fn);return()=>this.listeners.delete(fn)} emit(e:WorkbookEvent){for(const l of this.listeners) l(e)}}
export const eventBus=new Bus();
