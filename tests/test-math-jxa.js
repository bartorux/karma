// Testy czystej matematyki wyciętej z index.html (blok TESTABLE-START..END)
ObjC.import('Foundation');
const pwd = $.NSProcessInfo.processInfo.environment.objectForKey('PWD').js;
const src = $.NSString.stringWithContentsOfFileEncodingError(pwd + '/index.html', $.NSUTF8StringEncoding, null).js;
const m = src.match(/\/\*TESTABLE-START\*\/([\s\S]*?)\/\*TESTABLE-END\*\//);
if (!m) { throw new Error('FAIL: brak bloku TESTABLE'); }
eval(m[1]);

let failures = 0;
function eq(name, actual, expected, tol = 0) {
  const ok = tol ? Math.abs(actual - expected) <= tol : actual === expected;
  if (!ok) { failures++; console.log(`FAIL ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`); }
  else console.log(`ok   ${name}`);
}
function assert(name, cond) {
  if (!cond) { failures++; console.log(`FAIL ${name}`); } else console.log(`ok   ${name}`);
}

// ---- computeDaily: Brit sucha (points-interp) ----
const britDry = DRY_FOODS.brit_gastro_dry;
eq('Brit sucha 12 kg = 136 g', computeDaily(britDry, 12).grams, 136, 1e-9);
eq('Brit sucha 2 kg = 30 g', computeDaily(britDry, 2).grams, 30);
eq('Brit sucha 80 kg = 570 g', computeDaily(britDry, 80).grams, 570);
eq('Brit sucha 1 kg clamp-low', computeDaily(britDry, 1).note, 'clamped-low');
eq('Brit sucha 1 kg = 30 g', computeDaily(britDry, 1).grams, 30);
eq('Brit sucha 90 kg clamp-high', computeDaily(britDry, 90).note, 'clamped-high');
eq('Brit sucha 15 kg = 160 g (punkt)', computeDaily(britDry, 15).grams, 160);
eq('Brit sucha 18 kg = 184 g', computeDaily(britDry, 18).grams, 184, 1e-9);
assert('Brit sucha 0 kg -> null', computeDaily(britDry, 0) === null);
assert('Brit sucha NaN -> null', computeDaily(britDry, NaN) === null);

// ---- computeDaily: Belcando (bracket-step wg tabeli producenta, konwencja [lo,hi):
//      waga graniczna nalezy do wyzszego przedzialu) ----
const bel = DRY_FOODS.belcando_salmon;
eq('Belcando 18 kg = 240 g (przedzial 15-20)', computeDaily(bel, 18).grams, 240);
eq('Belcando 16 kg = 240 g', computeDaily(bel, 16).grams, 240);
eq('Belcando 20 kg = 280 g (granica -> przedzial 20-25)', computeDaily(bel, 20).grams, 280);
eq('Belcando 19.9 kg = 240 g', computeDaily(bel, 19.9).grams, 240);
eq('Belcando 12 kg = 190 g', computeDaily(bel, 12).grams, 190);
eq('Belcando 3 kg = 80 g (granica -> przedzial 3-5)', computeDaily(bel, 3).grams, 80);
eq('Belcando 2.9 kg = 60 g', computeDaily(bel, 2.9).grams, 60);
eq('Belcando 5 kg = 140 g (granica -> przedzial 5-10)', computeDaily(bel, 5).grams, 140);
eq('Belcando 10 kg = 190 g (granica -> przedzial 10-15)', computeDaily(bel, 10).grams, 190);
eq('Belcando 65 kg = 680 g (granica -> przedzial 65-80)', computeDaily(bel, 65).grams, 680);
eq('Belcando 80 kg = 680 g', computeDaily(bel, 80).grams, 680);
eq('Belcando 80 kg bez ostrzezenia', computeDaily(bel, 80).note, null);
eq('Belcando 90 kg clamp-high 680', computeDaily(bel, 90).grams, 680);
eq('Belcando 90 kg note', computeDaily(bel, 90).note, 'clamped-high');
eq('Belcando 0.5 kg = 60 g', computeDaily(bel, 0.5).grams, 60);
assert('Belcando 12 kg bracket 10-15', JSON.stringify(computeDaily(bel, 12).bracket) === '[10,15]');
assert('Belcando 18 kg bracket 15-20', JSON.stringify(computeDaily(bel, 18).bracket) === '[15,20]');
assert('Belcando 20 kg bracket 20-25', JSON.stringify(computeDaily(bel, 20).bracket) === '[20,25]');

// ---- computeDaily: mokre (bracket-interp) ----
const wetStd = WET_FOODS.brit_gastro_wet, wetLF = WET_FOODS.brit_gastro_lowfat_wet;
eq('Brit mokra 12 kg = 682.5 g', computeDaily(wetStd, 12).grams, 682.5, 1e-9);
eq('LowFat 12 kg = 902 g', computeDaily(wetLF, 12).grams, 902, 1e-9);
eq('Brit mokra 5 kg = 360 g', computeDaily(wetStd, 5).grams, 360);
eq('Brit mokra 10 kg = 605 g (styk przedzialow)', computeDaily(wetStd, 10).grams, 605);
eq('Brit mokra 60 kg = 2320 g', computeDaily(wetStd, 60).grams, 2320);
// ekstrapolacja
const w4 = computeDaily(wetStd, 4);
eq('Brit mokra 4 kg ekstrapolacja = 311 g', w4.grams, 360 - 49, 1e-9);
eq('Brit mokra 4 kg note', w4.note, 'extrapolated');
const w62 = computeDaily(wetStd, 62);
eq('Brit mokra 62 kg ekstrapolacja', w62.grams, 2320 + 2 * (2320 - 1380) / 30, 1e-6);
assert('Brit mokra 1 kg >= 0 (clamp)', computeDaily(wetStd, 1).grams >= 0);
eq('LowFat 30 kg = 1820 g (styk)', computeDaily(wetLF, 30).grams, 1820);

// ---- rebalanceShares ----
function sum(o, ids) { return ids.reduce((a, id) => a + o[id], 0); }
const ids3 = ['a', 'b', 'c'];
let s = { a: 1 / 3, b: 1 / 3, c: 1 / 3 };
let r = rebalanceShares(s, ids3, 'a', 0.5);
eq('rebalance: a=0.5', r.a, 0.5, 1e-9);
eq('rebalance: b=c=0.25', r.b, 0.25, 1e-9);
eq('rebalance: suma=1', sum(r, ids3), 1, 1e-9);
// suwak na 100% i z powrotem (galaz R=0)
r = rebalanceShares(s, ids3, 'a', 1);
eq('rebalance do 100%: a=1', r.a, 1, 1e-9);
eq('rebalance do 100%: b=0', r.b, 0, 1e-9);
r = rebalanceShares(r, ids3, 'a', 0.4); // R=0 -> równy podział reszty
eq('rebalance z 100% w dól: a=0.4', r.a, 0.4, 1e-9);
eq('rebalance z 100% w dól: b=0.3 (równy podzial)', r.b, 0.3, 1e-9);
eq('rebalance z 100% w dól: suma=1', sum(r, ids3), 1, 1e-9);
// wyzerowany posilek zostaje na 0
s = { a: 0, b: 0.5, c: 0.5 };
r = rebalanceShares(s, ids3, 'b', 0.6);
eq('sticky zero: a=0', r.a, 0, 1e-12);
eq('sticky zero: c=0.4', r.c, 0.4, 1e-9);
// grupa niepodanych (a nakarmione, budzet grupy staly)
s = { a: 0.4, b: 0.3, c: 0.3 };
r = rebalanceShares(s, ['b', 'c'], 'b', 0.5); // S_U=0.6, f=clamp(0.5,0,0.6)=0.5
eq('grupa unfed: b=0.5', r.b, 0.5, 1e-9);
eq('grupa unfed: c=0.1', r.c, 0.1, 1e-9);
eq('grupa unfed: a nietkniete', r.a, 0.4, 1e-12);
// clamp powyzej budzetu grupy
r = rebalanceShares(s, ['b', 'c'], 'b', 0.9);
eq('clamp do S_U: b=0.6', r.b, 0.6, 1e-9);
eq('clamp do S_U: c=0', r.c, 0, 1e-9);
// posilek spoza unfed -> bez zmian
r = rebalanceShares(s, ['b', 'c'], 'a', 0.9);
eq('k poza unfed: bez zmian', JSON.stringify(r), JSON.stringify(s));

// ---- applyExtra ----
s = { a: 1 / 3, b: 1 / 3, c: 1 / 3 };
let ax = applyExtra(s, ids3, 0.3);
eq('extra: suma po odjeciu = 0.7', sum(ax.shares, ids3), 0.7, 1e-9);
eq('extra: overshoot=0', ax.overshoot, 0);
eq('extra: 3 deductions', ax.deductions.length, 3);
let dedSum = ax.deductions.reduce((a, d) => a + d.amount, 0);
eq('extra: suma deductions = 0.3', dedSum, 0.3, 1e-9);
// cofniecie: oddaje dokladnie
let restored = { ...ax.shares };
ax.deductions.forEach(d => restored[d.mealId] += d.amount);
eq('extra remove: suma wraca do 1', sum(restored, ids3), 1, 1e-12);
eq('extra remove: a wraca do 1/3', restored.a, 1 / 3, 1e-12);
// overshoot
ax = applyExtra(s, ids3, 1.2);
eq('extra overshoot: suma=0', sum(ax.shares, ids3), 0, 1e-9);
eq('extra overshoot: 0.2', ax.overshoot, 0.2, 1e-9);
// wszystko nakarmione (unfed puste)
ax = applyExtra(s, [], 0.2);
eq('extra przy pustym unfed: overshoot=e', ax.overshoot, 0.2, 1e-12);
eq('extra przy pustym unfed: shares bez zmian', sum(ax.shares, ids3), 1, 1e-9);

// ---- allocateGrams ----
let g = allocateGrams([1 / 3, 1 / 3, 1 / 3], 200);
eq('alloc 200g/3: suma=200', g.reduce((a, b) => a + b, 0), 200);
assert('alloc 200g/3: wartosci 66/67', g.every(x => x === 66 || x === 67));
g = allocateGrams([0.25, 0.25, 0.25], 190); // grupa sucha w trybie praca (3 z 4 posilkow)
eq('alloc grupy 75% z 190: suma = round(142.5) = 143', g.reduce((a, b) => a + b, 0), 143);
g = allocateGrams([0.5, 0.3, 0.2], 136);
eq('alloc 136: suma=136', g.reduce((a, b) => a + b, 0), 136);
eq('alloc 136: [68,41,27]', JSON.stringify(g), JSON.stringify([68, 41, 27]));
g = allocateGrams([0, 0, 0], 200);
eq('alloc zerowych udzialow: [0,0,0]', JSON.stringify(g), JSON.stringify([0, 0, 0]));
g = allocateGrams([1], 682.5);
eq('alloc pojedynczy mokry: 683', g[0], 683);

// ---- scenariusz: dom 3 posilki, Belcando 18 kg ----
const belD = computeDaily(bel, 18).grams; // 240
let bg = allocateGrams([1 / 3, 1 / 3, 1 / 3], belD);
eq('Belcando dom: suma posilkow = 240', bg.reduce((a, b) => a + b, 0), 240);

// ---- energie karm i rownowartosc energetyczna (kotwica: tabela suchej) ----
eq('kcal: Brit sucha 3.93', DRY_FOODS.brit_gastro_dry.kcal, 3.93);
eq('kcal: Brit mokra 1.02', WET_FOODS.brit_gastro_wet.kcal, 1.02);
eq('kcal: LowFat 0.775', WET_FOODS.brit_gastro_lowfat_wet.kcal, 0.775);
assert('kcal: Belcando oznaczone jako szacunek', DRY_FOODS.belcando_salmon.kcalEstimated === true);
eq('equiv: identycznosc', energyEquivGrams(100, 3.93, 3.93), 100, 1e-12);
eq('equiv: 184g suchej -> LowFat', energyEquivGrams(184, 3.93, 0.775), 184 * 3.93 / 0.775, 1e-9);
eq('equiv: 184g suchej -> mokra std ~709 g', energyEquivGrams(184, 3.93, 1.02), 708.94, 0.01);

// ---- scenariusz zlozony: praca 4 posilki, 18 kg, Brit sucha + LowFat ----
const dryD = computeDaily(britDry, 18).grams;           // 184
const wetTab = computeDaily(wetLF, 18).grams;           // tabela mokrej (informacyjnie): 1208
const wetEq = energyEquivGrams(dryD, 3.93, 0.775);      // 933.06 g = energia dziennej suchej
eq('scenariusz: sucha 18kg = 184', dryD, 184, 1e-9);
eq('scenariusz: LowFat tabela 18kg = 1208', wetTab, 1208, 1e-9);
eq('scenariusz: LowFat rownowartosc = 933.06', wetEq, 933.058, 0.01);
let shares = { rano: .25, przedpoludnie: .25, popoludnie: .25, wieczor: .25 };
const dryG = allocateGrams([shares.rano, shares.popoludnie, shares.wieczor], dryD);
const wetG = allocateGrams([shares.przedpoludnie], wetEq);
eq('scenariusz: sucha suma = 138', dryG.reduce((a, b) => a + b, 0), 138); // round(184*0.75)
eq('scenariusz: mokry posilek = 233', wetG[0], 233); // round(933.06*0.25)
// zachowanie energii: dzien mieszany = energia czysto suchego dnia (+/- zaokraglenia)
const kcalMixed = dryG.reduce((a, b) => a + b, 0) * 3.93 + wetG[0] * 0.775;
const kcalPureDry = dryD * 3.93; // 723.12
assert('scenariusz: energia mieszana ~= czysto sucha (+/-1.5 kcal)', Math.abs(kcalMixed - kcalPureDry) < 1.5);
// ekstra 50 g suchej -> e = 50/184
const e = 50 / dryD;
ax = applyExtra(shares, ['rano', 'przedpoludnie', 'popoludnie', 'wieczor'], e);
eq('scenariusz: suma po ekstra', sum(ax.shares, Object.keys(shares)), 1 - e, 1e-9);
// ekstra mokra 100 g -> udzial liczony z rownowartosci energetycznej
const eWet = 100 / wetEq;
ax = applyExtra(shares, ['rano', 'przedpoludnie', 'popoludnie', 'wieczor'], eWet);
eq('scenariusz: ekstra mokra 100g = ~10.7% dnia', eWet, 0.1072, 0.0005);
eq('scenariusz: suma po ekstra mokrej', sum(ax.shares, Object.keys(shares)), 1 - eWet, 1e-9);

console.log(failures ? `\n${failures} FAILURES` : '\nALL TESTS PASSED');
if (failures) throw new Error(failures + ' FAILURES');
