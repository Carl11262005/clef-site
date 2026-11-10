import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, unlinkSync, symlinkSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=dirname(fileURLToPath(import.meta.url));
const preparation=spawnSync(process.execPath,[join(root,'prepare-source.mjs')],{stdio:'inherit'});
if(preparation.status!==0)process.exit(preparation.status||1);
const source=JSON.parse(readFileSync(join(root,'source.json'),'utf8'));
const frontend=resolve(root,'.source/frontend');
if(!existsSync(join(frontend,'node_modules/.bin/expo')))throw new Error('Install the existing frontend dependencies with npm ci first.');
if(!existsSync(join(root,'node_modules')))symlinkSync(join(frontend,'node_modules'),join(root,'node_modules'),'dir');
const run=(command,args)=>{const result=spawnSync(command,args,{cwd:root,stdio:'inherit',env});if(result.status!==0)process.exit(result.status||1);};
// Never inline local production env values into this public conference build.
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('EXPO_PUBLIC_')));
env.EXPO_NO_DOTENV='1'; env.CLEF_FRONTEND_DIR=frontend;
if(!process.argv.includes('--skip-install'))run('npm',['ci','--prefix','web-deps']);
run(join(frontend,'node_modules/.bin/tsc'),['--noEmit','--pretty','false']);
run(join(frontend,'node_modules/.bin/expo'),['export','--platform','web','--output-dir','output','--source-maps']);
const output=join(root,'output');
const walk=(dir)=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
mkdirSync(join(output,'welcome'),{recursive:true});
for(const name of readdirSync(join(root,'assets/welcome')))copyFileSync(join(root,'assets/welcome',name),join(output,'welcome',name));
const maps=walk(output).filter(f=>f.endsWith('.js.map'));
if(!maps.length)throw new Error('Missing build provenance map.');
const sources=maps.flatMap(f=>JSON.parse(readFileSync(f,'utf8')).sources);
const unpinned=sources.filter(s=>s.includes('frontend/')&&!s.includes('node_modules/')&&!s.includes('.source/frontend/'));
if(unpinned.length)throw new Error('Unpinned application source entered the demo: '+unpinned.join(', '));
if(!sources.some(s=>s.includes('.source/frontend/components/demo/demoStore.ts')))throw new Error('Pinned demo source missing from bundle.');
const forbidden=sources.filter(s=>/node_modules\/(?:@firebase\/|firebase\/|axios\/)/.test(s)||/frontend\/(?:firebaseConfig|hooks\/AppInitialization)\./.test(s));
if(forbidden.length)throw new Error(`Production transport entered demo bundle: ${forbidden.join(', ')}`);
for(const required of ['adapters/firebase.ts','adapters/transport.ts','components/demo/demoStore.ts','app/pipeline.tsx','app/venue/ApplyNightSheet.tsx'])if(!sources.some(s=>s.endsWith(required)))throw new Error(`Missing real demo source: ${required}`);
// Source maps are build evidence only, never public artifacts.
for(const f of maps)unlinkSync(f);
for(const f of walk(output).filter(f=>f.endsWith('.js')))writeFileSync(f,readFileSync(f,'utf8').replace(/\/\/# sourceMappingURL=.*$/gm,''));
// Static hosts may reject URL paths containing node_modules. Flatten only the
// exported hashed assets and rewrite their exact URLs; source stays untouched.
const assetFiles=walk(join(output,'assets'));
const assetNames=new Set();
const moves=assetFiles.map(file=>{
 const name=basename(file);
 if(assetNames.has(name))throw new Error(`Exported asset name collision: ${name}`);
 assetNames.add(name);
 return {file,from:'/'+relative(output,file),to:'/assets/'+name,name};
});
mkdirSync(join(output,'assets-flat'),{recursive:true});
for(const move of moves)copyFileSync(move.file,join(output,'assets-flat',move.name));
rmSync(join(output,'assets'),{recursive:true});renameSync(join(output,'assets-flat'),join(output,'assets'));
for(const file of walk(output).filter(f=>/\.(js|css)$/.test(f))){
 let content=readFileSync(file,'utf8');
 for(const move of moves)content=content.split(move.from).join(move.to);
 writeFileSync(file,content);
}
// The changed JS gets a fresh URL, so a visitor cannot reuse the previous build.
let exportedHtml=readFileSync(join(output,'index.html'),'utf8');
for(const file of walk(output).filter(f=>f.endsWith('.js'))){
 const name='entry-'+createHash('sha256').update(readFileSync(file)).digest('hex').slice(0,32)+'.js';
 const target=join(dirname(file),name);
 exportedHtml=exportedHtml.split('/'+relative(output,file)).join('/'+relative(output,target));
 renameSync(file,target);
}
writeFileSync(join(output,'index.html'),exportedHtml);
mkdirSync(join(output,'maplibre'),{recursive:true});
for(const name of ['maplibre-gl.mjs','maplibre-gl-shared.mjs','maplibre-gl-worker.mjs'])copyFileSync(join(root,'web-deps/node_modules/maplibre-gl/dist',name),join(output,'maplibre',name));
copyFileSync(join(root,'web-deps/node_modules/maplibre-gl/LICENSE.txt'),join(output,'maplibre/LICENSE.txt'));
copyFileSync(join(root,'web-deps/node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm'),join(output,'lottie-player.wasm'));
let html=readFileSync(join(output,'index.html'),'utf8');
const script=html.match(/<script src="([^"]+)" defer><\/script>/);
if(!script)throw new Error('Unexpected Expo HTML: missing app entry.');
writeFileSync(join(output,'bootstrap.mjs'),`try { window.__clefMapLibre=await import('/maplibre/maplibre-gl.mjs'); } catch {}\nimport(${JSON.stringify(script[1])}).catch(()=>{document.getElementById('root').innerHTML='<p style="padding:32px">CLEF could not load. <a href="/demo/">Try again</a> or contact <a href="mailto:carlton@clefapp.net">carlton@clefapp.net</a>.</p>';});\n`);
html=html.replace(script[0],'<script type="module" src="/bootstrap.mjs"></script>');
const csp="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://tiles.openfreemap.org; worker-src 'self' blob:; media-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
html=html.replace('<head>',`<head><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="theme-color" content="#f8f6f1"><meta name="referrer" content="no-referrer"><meta name="description" content="Explore CLEF's real app with sample data. No signup, no real changes.">`);
html=html.replace('</head>',`<style>
html,body{background:#f8f6f1}
.conference-loading{box-sizing:border-box;min-height:100dvh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:32px;background:#f8f6f1;color:#111;text-align:center;font-family:Arial,sans-serif}.conference-loading strong{font-size:44px;letter-spacing:-2px;color:#a04400}.conference-loading p{font-size:20px;margin:28px 0 10px}.conference-loading small{font-size:13px;color:#625b52}.conference-loading a{font-size:12px;color:#8e3d00;margin-top:28px;min-height:44px;display:flex;align-items:center}
.conference-tabs{display:flex;flex-direction:column;flex:1;min-height:0;position:relative}
.conference-tab-panel{display:flex;flex:1;min-height:0}.conference-tab-panel[data-state="inactive"]{display:none}
.conference-tabbar{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));left:12px;right:12px;display:flex;padding:5px;background:rgba(255,251,246,.95);backdrop-filter:blur(20px);border:1px solid #e7dfd5;border-radius:30px;box-shadow:0 4px 24px #0002;z-index:10}
.conference-tab{flex:1;min-width:0;border:0;background:none;padding:7px 2px;border-radius:24px;display:flex;flex-direction:column;align-items:center;gap:3px;font:10px Arial;color:#6c655d;cursor:pointer;position:relative}
.conference-tab[data-state="active"]{color:#c45100;background:#ffeddf}.conference-tab:focus-visible{outline:2px solid #111}.conference-tab-badge{position:absolute;right:4px;top:0;background:#ff6f00;color:#111;border-radius:12px;padding:2px 5px}
[aria-modal="true"]{padding-top:var(--conference-top,44px)!important;box-sizing:border-box}
</style></head>`);
html=html.replace('</head>','<style>.conference-loading,.conference-splash{position:fixed;inset:0;width:100%;height:100dvh;min-height:100dvh;z-index:2147483647}.conference-loading{background:#FF6F00}.conference-splash{pointer-events:none}.conference-loading strong{color:white;font-size:58px;letter-spacing:6px}.conference-loading a{color:white;position:absolute;bottom:24px}html:has(.conference-loading),body:has(.conference-loading){background:#FF6F00}</style></head>');
html=html.replace('<div id="root"></div>','<div id="root"><main class="conference-loading" aria-label="Loading CLEF"><strong>CLEF</strong><a href="/demo/">Reload if loading stalls</a></main></div>');
writeFileSync(join(output,'index.html'),html);
mkdirSync(join(output,'demo'),{recursive:true});writeFileSync(join(output,'demo/index.html'),html);
// This static host does not honor SPA rewrites. Give each included route an
// index document; fresh deep links safely return to the role chooser.
const dynamicRoutes={id:['demo-venue-lamplighter'],uid:['demo-act-copper-hollow'],chatId:['demo-venue-lamplighter_demo-act-copper-hollow','demo-conference-musician_demo-venue-lamplighter','demo-venue-lamplighter_demo-conference-musician']};
for(const routeFile of walk(join(root,'app')).filter(f=>f.endsWith('.tsx'))){
 const route=relative(join(root,'app'),routeFile).replace(/\.tsx$/,'').split('/').filter(part=>!part.startsWith('(')&&part!=='index');
 if(route.some(part=>part.startsWith('_')||part.startsWith('+')))continue;
 let concrete=[''];
 for(const part of route){
  const alternatives=part.startsWith('[')?dynamicRoutes[part.slice(1,-1)]:[part];
  if(!alternatives)throw new Error('Add a safe demo deep link for '+part);
  concrete=concrete.flatMap(prefix=>alternatives.map(value=>prefix+'/'+value));
 }
 for(const path of concrete){mkdirSync(join(output,path),{recursive:true});writeFileSync(join(output,path,'index.html'),html);}
}
// Also support hosts that do honor this conventional SPA rewrite file.
writeFileSync(join(output,'_redirects'),'/* /index.html 200\n');
writeFileSync(join(output,'build-audit.json'),JSON.stringify({releaseCommit:source.commit,unpinnedApplicationModules:unpinned,productionSdkModules:forbidden,realScreensImported:true,sourceModules:sources.length,networkAllowlist:['same-origin static assets','tiles.openfreemap.org'],data:'existing CLEF demo fixtures only'},null,2));
console.log('Built actual CLEF screens. Production Firebase and axios are absent. Output: '+output);
