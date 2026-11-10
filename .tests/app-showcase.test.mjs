import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync,createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.wasm':'application/wasm','.ttf':'font/ttf','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('website embeds the pinned conference prototype, with no production transports or public source maps',()=>{
 const audit=JSON.parse(read('../prototype/build-audit.json'));
 assert.equal(audit.prototypeCommit,'1c8dca44ae18bac0a0d957af91eb260b10c733f7');
 assert.equal(audit.realScreensImported,true);
 assert.deepEqual(audit.productionSdkModules,[]);
 assert.deepEqual(audit.unpinnedApplicationModules,[]);
 for(const route of ['venues','musicians']){
  const html=read(`../${route}/index.html`);
  assert.equal(html.includes('data-app-showcase'),false,'old screenshot selector removed');
  assert.ok(html.includes('id="benefits"'));
  assert.ok(html.includes('data-prototype'));
  assert.equal((html.match(/data-uid="c338b66b93"/g)||[]).length,1);
 }
});

test('prototype embeds are on-demand, role-specific, restartable, accessible without JS, and fit mobile',async()=>{
 const server=createServer((req,res)=>{
  let path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith(root)||!existsSync(path)){res.writeHead(404);res.end();return;}
  if(statSync(path).isDirectory())path=resolve(path,'index.html');
  res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');
  createReadStream(path).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 try{
  for(const [route,roles] of [['venues',['venue']],['musicians',['musician','band']]]){
   const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
   const writes=[],errors=[],badAssets=[];
   await page.route('**/*',r=>{
    const request=r.request();
    if(request.method()!=='GET'){writes.push(request.url());return r.abort();}
    // External signup/auth is excluded from this controlled demo check.
    if(!request.url().startsWith(base)&&!request.url().startsWith('https://tiles.openfreemap.org'))return r.abort();
    return r.continue();
   });
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.url().startsWith(base+'/prototype/')&&r.status()>=400)badAssets.push(r.url())});
   await page.goto(`${base}/${route}/#benefits`);
   assert.equal(await page.locator('iframe').getAttribute('src'),null,'no app bundle before launch');
   assert.equal(await page.getByRole('button',{name:'Restart Demo',exact:true}).isVisible(),false,'restart appears only once a demo has started');
   assert.equal(await page.getByRole('link',{name:'Open Full Screen'}).count(),0);
   await page.getByRole('button',{name:'Start Demo',exact:true}).click();
   const frame=page.frameLocator('iframe');
   for(const role of roles){
    if(role==='band')await page.getByRole('button',{name:'Band',exact:true}).click();
    await frame.getByRole('button',{name:'Start exploring',exact:true}).waitFor({timeout:45000});
    assert.match(await frame.locator('body').innerText(),role==='venue'?/Fill your next open night/:role==='band'?/Find your band’s next stage/:/Find your next stage/);
    await frame.getByRole('button',{name:'Start exploring',exact:true}).click();
    await frame.getByRole('tab',{name:role==='venue'?/Calendar/:/Discover/}).waitFor({timeout:20000});
    assert.ok(page.frames().some(f=>f.url().startsWith(base+'/prototype/')),'app navigation stays namespaced');
    for(const width of [320,375,430,768,1280]){
     await page.setViewportSize({width,height:1000});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route}/${role} overflow at ${width}`);
     assert.equal(await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`phone overflow at ${width}`);
    }
    await page.getByRole('button',{name:'Restart Demo',exact:true}).click();
    await frame.getByRole('button',{name:'Start exploring',exact:true}).waitFor({timeout:20000});
   }
   assert.deepEqual(writes,[],'demo never submits');assert.deepEqual(errors,[]);assert.deepEqual(badAssets,[]);
   await page.close();
   const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:375,height:900}});
   await nojs.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
   await nojs.goto(`${base}/${route}/#benefits`);
   assert.equal(await nojs.getByRole('link',{name:'Open Demo',exact:true}).isVisible(),true);
   assert.equal(await nojs.getByRole('button',{name:'Start Demo',exact:true}).isVisible(),false);
   await nojs.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
});
