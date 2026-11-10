// Rebuild the supplied prototype without changing the app checkout or website runtime.
import {cpSync,readFileSync,writeFileSync,mkdtempSync,existsSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const stage=mkdtempSync(join(tmpdir(),'clef-website-demo-build-'));
cpSync(join(here,'source'),stage,{recursive:true});
const edit=(name,from,to)=>{
 const file=join(stage,name),text=readFileSync(file,'utf8');
 if(!text.includes(from))throw new Error(`Upstream integration no longer matches ${name}`);
 writeFileSync(file,text.replace(from,to));
};
const config=JSON.parse(readFileSync(join(stage,'app.json'),'utf8'));
config.expo.experiments.baseUrl='/prototype';
writeFileSync(join(stage,'app.json'),JSON.stringify(config,null,2));
// Metro shares the app's dependency directory across isolated builds. Clear its
// route-context cache so a previous temporary source path cannot be reused.
edit('build.mjs',"['export','--platform','web','--output-dir','output','--source-maps']","['export','--platform','web','--output-dir','output','--source-maps','--clear']");
edit('app/index.tsx'," const [step,setStep]=useState(0);\n const [role,setRole]=useState<DemoPersona|null>(null);",` const requestedRole=new URLSearchParams(window.location.search).get('role');
 const initialRole:DemoPersona|null=requestedRole==='venue'||requestedRole==='musician'||requestedRole==='band'?requestedRole:null;
 const [step,setStep]=useState(initialRole?2:0);
 const [role,setRole]=useState<DemoPersona|null>(initialRole);`);
edit('guidance/EarlyAccessLink.tsx',"import React from 'react';","import React from 'react';\nimport {useDemoStore} from '@/components/demo/demoStore';");
edit('guidance/EarlyAccessLink.tsx'," return <a", " const role=useDemoStore(s=>s.role);\n return <a");
edit('guidance/EarlyAccessLink.tsx','href="https://clefapp.net/#signup" target="_blank" rel="noopener noreferrer" aria-label="Get early access (opens in a new tab)"',`href={role==='venue'?'/venues/#signup':'/musicians/#signup'} target="_parent" aria-label="Get early access on this website"`);
if(process.env.CLEF_DEMO_WEB_DEPS)cpSync(resolve(process.env.CLEF_DEMO_WEB_DEPS),join(stage,'web-deps/node_modules'),{recursive:true});
else {
 const install=spawnSync('npm',['ci','--prefix','web-deps','--ignore-scripts'],{cwd:stage,stdio:'inherit'});
 if(install.status!==0)process.exit(install.status||1);
}
const build=spawnSync(process.execPath,['build.mjs','--skip-install'],{cwd:stage,env:process.env,stdio:'inherit'});
if(build.status!==0)process.exit(build.status||1);
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
// Expo scopes its router and generated URLs. These are the conference source's
// explicitly root-relative assets, which also need the website namespace.
for(const file of walk(join(stage,'output')).filter(f=>/\.(html|js|mjs|css)$/.test(f))){
 let value=readFileSync(file,'utf8');
 for(const path of ['/welcome/','/maplibre/','/lottie-player.wasm','/bootstrap.mjs'])value=value.split(path).join('/prototype'+path);
 value=value.replaceAll('href="/demo/"','href="/prototype/demo/"');
 // Bootstrap imports Expo's UMD bundle, whose relative resource URLs are scoped.
 writeFileSync(file,value);
}
const audit=JSON.parse(readFileSync(join(stage,'output/build-audit.json'),'utf8'));
audit.prototypeRepository='https://github.com/Clef-App-LLc/clef-conference-demo';
audit.prototypeCommit='1c8dca44ae18bac0a0d957af91eb260b10c733f7';
audit.websiteBase='/prototype';
writeFileSync(join(stage,'output/build-audit.json'),JSON.stringify(audit,null,2));
// Drop standalone-host rewrites: website routes belong to the marketing site.
rmSync(join(stage,'output/_redirects'),{force:true});
if(existsSync(join(root,'prototype')))rmSync(join(root,'prototype'),{recursive:true});
cpSync(join(stage,'output'),join(root,'prototype'),{recursive:true});
console.log('Website prototype built at '+join(root,'prototype')+'; build workspace: '+stage);
