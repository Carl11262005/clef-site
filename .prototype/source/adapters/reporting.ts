// Local diagnostics only; never send telemetry from the public demo.
export const reportFailure=(context:string,error?:unknown)=>console.log('[conference]',context,error);
export const recordError=reportFailure;
export const initCrashReporting=()=>{};
export const setCrashUser=()=>{};
export const logCrashBreadcrumb=()=>{};
export const isCrashReportingAvailable=()=>false;
export const triggerTestCrash=()=>false;
