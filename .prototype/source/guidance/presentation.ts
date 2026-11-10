export type GuidePanelEvent='visitor_opened'|'visitor_minimized'|'guide_action'|'step_changed';

export const initialGuideExpanded=false;

export function nextGuideExpanded(current:boolean,event:GuidePanelEvent){
 if(event==='visitor_opened')return true;
 if(event==='step_changed'||event==='guide_action'||event==='visitor_minimized')return false;
 return current;
}
