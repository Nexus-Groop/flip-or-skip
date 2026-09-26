const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('site/v21_source.html', 'utf8');
const desktop = fs.readFileSync('site/desktop/index.html', 'utf8');
const mobile = fs.readFileSync('site/mobile/index.html', 'utf8');

assert.strictEqual(desktop, source, 'Desktop has drifted from the approved V21 baseline.');
assert.strictEqual(mobile, source, 'Mobile has drifted from the approved V21 baseline.');

const required = [
  'Should You Flip It?',
  'Export Breakdown',
  'id="exportModal"',
  'id="shareExport"',
  'id="saveExport"',
  'eBay — 13.6%',
  'Facebook Marketplace — 10%',
  'Amazon — 15%',
  '@media(max-width:650px)',
  '@media(max-width:420px)',
  'Quick Guide',
  'Cost Breakdown',
  'Profit Summary',
  'Quick Insights'
];

for (const marker of required) {
  assert(source.includes(marker), 'V21 marker missing: ' + marker);
}

console.log('PASS V21 lock: desktop and mobile exactly match approved V21.');
