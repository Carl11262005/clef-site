import React from 'react';
// Native iOS spinner equivalent for this browser-only build. The released
// SetTimeEditor still owns validation, chosen times and save behavior.
export function DateTimePicker({value,onValueChange,testID}:{value:Date;onValueChange:(event:unknown,date:Date)=>void;testID?:string}){
 const clock=[value.getHours(),value.getMinutes()].map(part=>String(part).padStart(2,'0')).join(':');
 return <input type="time" aria-label="Choose performance time" data-testid={testID} value={clock} style={{boxSizing:'border-box',width:'100%',minHeight:58,padding:16,font:'600 20px system-ui',border:'1px solid #DCCFBF',borderRadius:16,background:'#FFF7ED',color:'#1A1208'}} onChange={event=>{if(!event.target.value)return;const [hours,minutes]=event.target.value.split(':').map(Number);const next=new Date(value);next.setHours(hours,minutes,0,0);onValueChange(event,next);}}/>;
}
