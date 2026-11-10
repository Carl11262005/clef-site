import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({chromium} = require('playwright')); } catch { /* Browser checks require optional Playwright. */ }
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('mobile menu bars become a visible X and return when closed on every page', {skip: !chromium}, async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const css = read('../assets/website.css');
    for (const route of ['../index.html', '../venues/index.html', '../musicians/index.html']) {
      const html = read(route);
      const menu = html.match(/<details class="mobile-menu"[\s\S]*?<\/details>/)?.[0];
      assert.ok(menu, `${route} has a mobile menu`);
      const page = await browser.newPage({viewport: {width: 375, height: 812}});
      await page.setContent(`<style>${css}</style>${menu}`);
      const summary = page.locator('.mobile-menu summary');
      const lines = page.locator('.menu-lines');
      const appearance = () => lines.evaluate(node => {
        const before = getComputedStyle(node, '::before');
        const after = getComputedStyle(node, '::after');
        return {beforeContent: before.content, afterContent: after.content,
          beforeTransform: before.transform, afterTransform: after.transform};
      });
      const closed = await appearance();
      assert.notEqual(closed.beforeContent, 'none', 'first menu stroke must exist');
      assert.notEqual(closed.afterContent, 'none', 'second menu stroke must exist');
      await summary.click();
      assert.equal(await page.locator('.mobile-menu').getAttribute('open'), '');
      await page.waitForTimeout(260);
      const opened = await appearance();
      assert.notEqual(opened.beforeTransform, closed.beforeTransform, 'first stroke rotates');
      assert.notEqual(opened.afterTransform, closed.afterTransform, 'second stroke rotates');
      await summary.click();
      assert.equal(await page.locator('.mobile-menu').getAttribute('open'), null);
      await page.waitForTimeout(260);
      const shut = await appearance();
      assert.equal(shut.beforeTransform, closed.beforeTransform);
      assert.equal(shut.afterTransform, closed.afterTransform);
      await page.emulateMedia({reducedMotion: 'reduce'});
      await summary.click();
      assert.equal(await lines.evaluate(node => getComputedStyle(node, '::before').transitionDuration), '0s',
        'reduced motion must change the icon immediately');
      await summary.click();
      assert.equal(await page.locator('.mobile-menu').getAttribute('open'), null);
      await page.close();
    }
  } finally { await browser.close(); }
});

test('pipeline action reads as a separate, directional button', {skip: !chromium}, async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 375, height: 812}});
    await page.setContent(`<style>${read('../assets/venue-demo.css')}</style>
      <div class="venue-demo"><section class="venue-demo-card venue-demo-pipeline-card">
      <button class="venue-demo-app-button venue-demo-on-orange" type="button">
      <span>Open Booking Pipeline</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
      </button></section></div>`);
    const card = page.locator('.venue-demo-pipeline-card');
    const action = page.locator('.venue-demo-on-orange');
    const styles = await action.evaluate(node => ({button: getComputedStyle(node).backgroundColor,
      text: getComputedStyle(node).color, borderRadius: getComputedStyle(node).borderRadius,
      display: getComputedStyle(node).display}));
    const cardColor = await card.evaluate(node => getComputedStyle(node).backgroundImage);
    assert.notEqual(styles.button, 'rgba(0, 0, 0, 0)', 'button must have its own filled surface');
    assert.notEqual(styles.text, 'rgb(255, 255, 255)', 'button label must contrast with its surface');
    assert.notEqual(styles.borderRadius, '0px', 'button must have a distinct silhouette');
    assert.match(cardColor, /linear-gradient/);
    assert.equal(await action.locator('svg').count(), 1, 'button must show its direction');
  } finally { await browser.close(); }
});
