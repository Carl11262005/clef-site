import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Exercise Firebase's actual publication inventory, without login or deployment.
// The optional integration check needs the Firebase CLI installed on PATH.
let listFiles;
try {
  const cli = realpathSync(execFileSync('which', ['firebase'], {encoding:'utf8'}).trim());
  ({listFiles} = createRequire(cli)('../listFiles.js'));
} catch {}
test('Firebase publishes all pages but never internal hidden-directory contents', {
  skip: !listFiles && 'Install firebase-tools on PATH to run the hosting integration check',
}, () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const config = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8'));
  const files = listFiles(root, config.hosting.ignore);
  const leaked = files.filter(file => file.split('/').some(segment => segment.startsWith('.')));
  assert.deepEqual(leaked, [], 'Internal files must not be selected for hosting');
  for (const page of ['index.html','venues/index.html','musicians/index.html','assets/website.css','assets/early-access.mjs']) {
    assert.ok(files.includes(page), 'Required public file must remain deployable: ' + page);
  }
});
