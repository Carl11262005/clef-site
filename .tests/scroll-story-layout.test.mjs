import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium} = createRequire(import.meta.url)('playwright');
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('scroll scenes have opaque surfaces and never fade previous text through an incoming panel', async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const html = read('../index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'');
    await page.setContent(html.replace('</head>',`<style>${read('../assets/website.css')} html{scroll-behavior:auto}</style></head>`));
    await page.addScriptTag({type:'module',content:read('../assets/scroll-story.mjs')});
    const story = page.locator('[data-scroll-story]');
    await story.waitFor();
    for (const fraction of [0,.2,.4,.6,.8,1,.4,0]) {
      await story.evaluate((node,f)=>scrollTo(0,node.offsetTop+(node.offsetHeight-innerHeight)*f),fraction);
      await page.waitForTimeout(40);
      const surfaces = await page.locator('[data-story-scene]').evaluateAll(nodes=>nodes.map(node=>({background:getComputedStyle(node).backgroundColor,opacity:getComputedStyle(node).opacity})));
      for (const surface of surfaces) {
        assert.doesNotMatch(surface.background,/rgba\([^)]*,\s*0\)|transparent/, 'every scene needs its own opaque background');
        assert.equal(surface.opacity,'1','dim only the surface overlay, never the whole scene');
      }
    }
    await page.setViewportSize({width:375,height:800});
    await page.waitForTimeout(40);
    assert.equal(await story.getAttribute('data-story-enhanced'),null);
    assert.equal(await page.locator('[data-story-scene]').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).transform==='none')),true,'mobile scenes must remain in readable document flow');
  } finally {await browser.close();}
});
