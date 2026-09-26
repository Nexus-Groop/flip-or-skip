const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync('../site/shared/calculator.js', 'utf8');
const sandbox = { console, Intl, Number, Object, Math, parseFloat: parseFloat };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const C = sandbox.FlipOrSkipCalculator;
const cases = [
  ['basic eBay', C.calculate({buy:30,sale:60,shipping:5,other:2,marketplace:'ebay',target:40}), 14.44, 'BUY'],
  ['poshmark under 15', C.calculate({buy:5,sale:10,marketplace:'poshmark',target:40}), 2.05, 'BUY'],
  ['custom fee', C.calculate({buy:20,sale:50,marketplace:'custom',customRate:7.5,customFixed:.5,target:40}), 25.75, 'BUY']
];
let failures=0;
for (const [name,r,profit,verdict] of cases) {
  const ok=Math.abs(r.profit-profit)<1e-9 && r.verdict===verdict;
  console.log((ok?'PASS':'FAIL'), name, 'profit=',r.profit,'verdict=',r.verdict);
  if(!ok) failures++;
}
process.exitCode=failures?1:0;
