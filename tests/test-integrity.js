// Bramka integralnosci index.html: skladnia JS, spojnosc ID i handlerow,
// brak znakow zepsutych przez edytor tekstu w pozycjach skladniowych CSS.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

let failures = 0;
function assert(name, cond, extra) {
  if (!cond) { failures++; console.log('FAIL ' + name + (extra ? ': ' + extra : '')); }
  else console.log('ok   ' + name);
}

// 1. Skladnia calego <script>
const sm = src.match(/<script>([\s\S]*?)<\/script>/);
assert('blok <script> istnieje', !!sm);
let syntaxOk = true, syntaxErr = '';
try { new Function(sm[1]); } catch (e) { syntaxOk = false; syntaxErr = String(e); }
assert('skladnia JS parsuje sie bez bledow', syntaxOk, syntaxErr);

// 2. Kazde getElementById('...') ma cel: statyczne id="..." albo generowane dynamicznie
const staticIds = new Set();
let m;
const idRe = /id="([^"]+)"/g;
while ((m = idRe.exec(src))) staticIds.add(m[1]);
const genPrefixes = ['meal-', 'grams-', 'fedbtn-', 'sharepct-', 'range-', 'dt-m-', 'dt-t-', 'dt-g-', 'act-btn-'];
const staticConcatPrefixes = ['refbody-', 'arrow-', 'act-btn-'];
const geRe = /getElementById\('([^']+)'\)/g;
const missing = [];
while ((m = geRe.exec(sm[1]))) {
  const id = m[1];
  if (staticIds.has(id)) continue;
  if (genPrefixes.some(p => id.startsWith(p))) continue;
  missing.push(id);
}
const geConcatRe = /getElementById\('([^']+)'\+/g;
const badConcat = [];
while ((m = geConcatRe.exec(sm[1]))) {
  if (genPrefixes.includes(m[1])) continue;
  if (staticConcatPrefixes.includes(m[1]) && [...staticIds].some(id => id.startsWith(m[1]))) continue;
  badConcat.push(m[1]);
}
assert('wszystkie getElementById maja cel', missing.length === 0, missing.join(','));
assert('wszystkie dynamiczne prefiksy ID znane', badConcat.length === 0, badConcat.join(','));

// 3. Inline handlery wskazuja na istniejace funkcje globalne
const handlerRe = /on(?:click|input|change)="([a-zA-Z_$][\w$]*)\(/g;
const fns = new Set();
const fnRe = /function\s+([a-zA-Z_$][\w$]*)\s*\(/g;
while ((m = fnRe.exec(sm[1]))) fns.add(m[1]);
const badHandlers = new Set();
while ((m = handlerRe.exec(src))) {
  const f = m[1];
  if (f === 'document') continue;
  if (!fns.has(f)) badHandlers.add(f);
}
assert('wszystkie inline handlery istnieja', badHandlers.size === 0, [...badHandlers].join(','));

// 4. Brak znakow zepsutych przez edytor tekstu w pozycjach skladniowych CSS
assert('brak "var(-" z polpauza', !src.includes('var(–'));
assert('brak cudzyslowow typograficznych', !/[‘’“”]/.test(src));

// 5. Zbalansowane nawiasy klamrowe w script (zgrubna kontrola)
const opens = (sm[1].match(/{/g) || []).length, closes = (sm[1].match(/}/g) || []).length;
assert('zbalansowane {} w script (' + opens + '/' + closes + ')', opens === closes);

console.log(failures ? failures + ' FAILURES' : 'INTEGRITY OK');
process.exit(failures ? 1 : 0);
