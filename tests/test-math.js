// Testy czystej matematyki wyciętej z index.html (blok TESTABLE-START..END)
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = src.match(/\/\*TESTABLE-START\*\/([\s\S]*?)\/\*TESTABLE-END\*\//);
if (!m) { console.error('FAIL: brak bloku TESTABLE'); process.exit(1); }
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

// ---- computeDaily: Belcando (points-interp — etykieta podaje PUNKTY wagowe
//      "Optimales Gewicht", nie przedzialy: 20 kg to wprost 240 g) ----
const bel = DRY_FOODS.belcando_salmon;
// kazdy punkt etykiety odwzorowany 1:1 (kolumna "Normale Aktivitaet")
[[3, 60], [5, 80], [10, 140], [15, 190], [20, 240], [25, 280], [35, 360], [50, 470], [65, 580], [80, 680]]
  .forEach(([kg, g]) => eq(`Belcando punkt etykiety ${kg} kg = ${g} g`, computeDaily(bel, kg).grams, g));
eq('Belcando 18 kg = 220 g (interpolacja 15-20)', computeDaily(bel, 18).grams, 220, 1e-9);
eq('Belcando 16 kg = 200 g', computeDaily(bel, 16).grams, 200, 1e-9);
eq('Belcando 19.9 kg = 239 g', computeDaily(bel, 19.9).grams, 239, 1e-9);
eq('Belcando 12 kg = 160 g', computeDaily(bel, 12).grams, 160, 1e-9);
eq('Belcando 2.9 kg clamp-low', computeDaily(bel, 2.9).note, 'clamped-low');
eq('Belcando 2.9 kg = 60 g', computeDaily(bel, 2.9).grams, 60);
eq('Belcando 80 kg bez ostrzezenia', computeDaily(bel, 80).note, null);
eq('Belcando 90 kg clamp-high 680', computeDaily(bel, 90).grams, 680);
eq('Belcando 90 kg note', computeDaily(bel, 90).note, 'clamped-high');
eq('Belcando 0.5 kg = 60 g', computeDaily(bel, 0.5).grams, 60);
// REGRESJA: bracket-step zaokraglal w gore do nastepnego punktu (18->240, 20->280)
assert('Belcando 18 kg nie jest juz dawka dla 20 kg', computeDaily(bel, 18).grams !== 240);
assert('Belcando 20 kg nie jest juz dawka dla 25 kg', computeDaily(bel, 20).grams !== 280);
assert('computeDaily nie zwraca juz pola bracket', computeDaily(bel, 18).bracket === undefined);

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
const belD = computeDaily(bel, 18).grams; // 220
let bg = allocateGrams([1 / 3, 1 / 3, 1 / 3], belD);
eq('Belcando dom: suma posilkow = 220', bg.reduce((a, b) => a + b, 0), 220);

// ---- energie karm i rownowartosc energetyczna (kotwica: tabela suchej) ----
eq('kcal: Brit sucha 3.93', DRY_FOODS.brit_gastro_dry.kcal, 3.93);
eq('kcal: Brit mokra 1.02', WET_FOODS.brit_gastro_wet.kcal, 1.02);
eq('kcal: LowFat 0.775', WET_FOODS.brit_gastro_lowfat_wet.kcal, 0.775);
// Belcando: rownanie predykcyjne FEDIAF ze skladnikow analitycznych z opakowania
// (bialko 27, tluszcz 15, popiol 6.5, wlokno 3.3, wilgotnosc 10 -> NFE 38.2)
eq('kcal: Belcando 3.72 (FEDIAF, nie mod. Atwater 3.56)', DRY_FOODS.belcando_salmon.kcal, 3.72);
assert('kcal: Belcando oznaczone jako szacunek', DRY_FOODS.belcando_salmon.kcalEstimated === true);
{
  const P = 27, F = 15, FIB = 3.3, NFE = 100 - 27 - 15 - 6.5 - 3.3 - 10;
  const GE = 5.7 * P + 9.4 * F + 4.1 * (NFE + FIB);
  const dE = 91.2 - 1.43 * (FIB / 90 * 100);
  const ME = (GE * dE / 100 - 1.04 * P) / 100;
  eq('Belcando NFE = 38.2%', NFE, 38.2, 1e-9);
  eq('Belcando ME wg FEDIAF = 3.72 kcal/g', ME, DRY_FOODS.belcando_salmon.kcal, 0.005);
}
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

// ---- normy energetyczne FEDIAF / AAHA ----
eq('masa metaboliczna 18 kg', metabolicKg(18), Math.pow(18, 0.75), 1e-12);
eq('masa metaboliczna 18 kg ~ 8.739', metabolicKg(18), 8.7389, 0.001);
eq('RER 18 kg = 611.7 kcal', rerKcal(18), 611.72, 0.01);
eq('RER 20 kg = 662.0 kcal', rerKcal(20), 662.02, 0.01);
eq('FEDIAF normal 18 kg = 961 kcal', fediafKcal(18, 'normal'), 961.27, 0.01);
eq('FEDIAF low 18 kg = 830 kcal', fediafKcal(18, 'low'), 830.19, 0.01);
eq('FEDIAF high 18 kg = 1136 kcal', fediafKcal(18, 'high'), 1136.05, 0.01);
eq('FEDIAF domyslnie normal przy nieznanej aktywnosci', fediafKcal(18, 'bzdura'), fediafKcal(18, 'normal'), 1e-12);
assert('metabolicKg(0) -> null', metabolicKg(0) === null);
assert('rerKcal(-1) -> null', rerKcal(-1) === null);

// wspolczynniki wzgledem RER (kontrola spojnosci norm)
eq('norma normal = 1.571 x RER', ACTIVITY_KCAL.normal / 70, 1.5714, 0.0001);
eq('norma low = 1.357 x RER', ACTIVITY_KCAL.low / 70, 1.3571, 0.0001);

// ---- werdykt kaloryczny ----
let vd = energyVerdict(723.1, 18, 'normal');   // plan Brit sucha
eq('werdykt Brit sucha 18kg: below', vd.level, 'below');
eq('werdykt Brit sucha 18kg: ~25% ponizej', vd.offPct, 25);
eq('werdykt Brit sucha 18kg przy niskiej aktywnosci', energyVerdict(723.1, 18, 'low').level, 'below');
eq('werdykt Brit sucha 18kg low: ~13%', energyVerdict(723.1, 18, 'low').offPct, 13);
eq('werdykt mokra tabela 18kg: ok', energyVerdict(933.3, 18, 'normal').level, 'ok');
// Belcando 18 kg = 220 g x 3.72 = 818.4 kcal = 93.7 kcal/kg^0.75
const belKcal18 = computeDaily(bel, 18).grams * bel.kcal;
eq('Belcando 18 kg = 818 kcal', belKcal18, 818.4, 0.01);
eq('werdykt Belcando 18kg: below', energyVerdict(belKcal18, 18, 'normal').level, 'below');
eq('werdykt Belcando 18kg: ~15% ponizej', energyVerdict(belKcal18, 18, 'normal').offPct, 15);
eq('werdykt Belcando 18kg przy niskiej aktywnosci: ok', energyVerdict(belKcal18, 18, 'low').level, 'ok');
eq('Belcando 18 kg = 93.7 kcal/kg^0.75', belKcal18 / metabolicKg(18), 93.65, 0.02);
// progi dokladnie na granicy -> ok
const tgt = fediafKcal(18, 'normal');
eq('prog 0.90 -> ok', energyVerdict(tgt * 0.90, 18, 'normal').level, 'ok');
eq('prog 1.10 -> ok', energyVerdict(tgt * 1.10, 18, 'normal').level, 'ok');
eq('ponizej progu -> below', energyVerdict(tgt * 0.899, 18, 'normal').level, 'below');
eq('powyzej progu -> above', energyVerdict(tgt * 1.101, 18, 'normal').level, 'above');
assert('werdykt bez planu -> null', energyVerdict(0, 18, 'normal') === null);

// ---- kalibracja tabel producentow (kcal/kg^0.75) ----
function tableKcalPerMetabolic(food, kg) {
  return computeDaily(food, kg).grams * food.kcal / metabolicKg(kg);
}
eq('Brit sucha 20 kg = 83 kcal/kg^0.75', tableKcalPerMetabolic(britDry, 20), 83.1, 0.1);
eq('Brit sucha 40 kg = 84 kcal/kg^0.75', tableKcalPerMetabolic(britDry, 40), 84.0, 0.1);
eq('Brit mokra 10 kg = 110 kcal/kg^0.75', tableKcalPerMetabolic(wetStd, 10), 109.7, 0.1);
eq('Brit mokra 30 kg = 110 kcal/kg^0.75', tableKcalPerMetabolic(wetStd, 30), 109.8, 0.1);
eq('LowFat 30 kg = 110 kcal/kg^0.75', tableKcalPerMetabolic(wetLF, 30), 110.0, 0.1);
eq('Belcando 17.5 kg = 93 kcal/kg^0.75', tableKcalPerMetabolic(bel, 17.5), 93.47, 0.1);
eq('Belcando 20 kg = 94 kcal/kg^0.75', tableKcalPerMetabolic(bel, 20), 94.40, 0.1);
// Tabela Belcando jest kalibrowana ~89-98 kcal/kg^0.75, czyli na poziomie
// FEDIAF "malo aktywny" (95) — producent NIE zawyza dawek.
[3, 5, 10, 15, 20, 25, 35, 50, 65, 80].forEach(kg => {
  const v = tableKcalPerMetabolic(bel, kg);
  assert(`Belcando kalibracja ${kg} kg w 88-98 kcal/kg^0.75 (${v.toFixed(1)})`, v >= 88 && v <= 98);
});

// ---- poziomy redukcji wg AAHA ----
eq('redukcja 1.0 x RER(18) = 611.7', reductionKcal(18, 1.0), 611.72, 0.01);
eq('redukcja 1.2 x RER(18) = 734.1', reductionKcal(18, 1.2), 734.06, 0.01);
eq('redukcja 1.4 x RER(18) = 856.4', reductionKcal(18, 1.4), 856.40, 0.01);
eq('mnoznik spoza listy -> fallback 1.0', reductionKcal(18, 0.7), rerKcal(18), 1e-12);
eq('mnoznik undefined -> fallback 1.0', reductionKcal(18, undefined), rerKcal(18), 1e-12);
assert('reductionKcal(0) -> null', reductionKcal(0, 1.0) === null);
assert('REDUCTION_FACTORS = 1.0..1.4', JSON.stringify(REDUCTION_FACTORS) === '[1,1.1,1.2,1.3,1.4]');
assert('isReductionFactor odrzuca 1.05', isReductionFactor(1.05) === false);

// ---- deficyt wzgledem utrzymania dla wagi AKTUALNEJ ----
// pies 20 kg, cel 18 kg: to deficyt wobec MER(20 kg) decyduje o tempie chudniecia
eq('utrzymanie 20 kg normal = 1040 kcal', fediafKcal(20, 'normal'), 1040.32, 0.01);
eq('plan AAHA 612 kcal -> deficyt 41%', deficitVsMaintenance(rerKcal(18), 20, 'normal').pct, 41);
eq('plan z tabeli 818 kcal -> deficyt 21%', deficitVsMaintenance(belKcal18, 20, 'normal').pct, 21);
// REGRESJA: stary plan (240 g x 3.72 = 892.8 kcal) dawal tylko 14% deficytu
eq('stary plan 240 g -> deficyt tylko 14%', deficitVsMaintenance(240 * bel.kcal, 20, 'normal').pct, 14);
assert('deficyt bez planu -> null', deficitVsMaintenance(0, 20, 'normal') === null);
assert('deficyt bez wagi -> null', deficitVsMaintenance(612, 0, 'normal') === null);

// ---- podstawa celu energetycznego: dry / wet / fediaf / redukcja ----
function dailyKcalByBasis(basis, kg, dryFood, wetFood, activity, factor) {
  if (basis === 'redukcja') return reductionKcal(kg, factor);
  if (basis === 'fediaf') return fediafKcal(kg, activity);
  if (basis === 'wet') return computeDaily(wetFood, kg).grams * wetFood.kcal;
  return computeDaily(dryFood, kg).grams * dryFood.kcal;
}
// REGRESJA: podstawa 'dry' daje dokladnie wartosc z tabeli suchej (zachowanie sprzed zmiany)
let kc = dailyKcalByBasis('dry', 18, britDry, wetLF, 'normal');
eq('basis dry 18kg -> 184 g suchej (regresja)', kc / britDry.kcal, 184, 1e-9);
eq('basis dry 20kg -> 200 g suchej (regresja)', dailyKcalByBasis('dry', 20, britDry, wetLF, 'normal') / britDry.kcal, 200, 1e-9);
eq('basis dry 18kg -> 723 kcal', kc, 723.12, 0.01);
eq('basis wet 18kg -> 936 kcal', dailyKcalByBasis('wet', 18, britDry, wetLF, 'normal'), 936.2, 0.01);
eq('basis fediaf 18kg -> 961 kcal', dailyKcalByBasis('fediaf', 18, britDry, wetLF, 'normal'), 961.27, 0.01);
eq('basis redukcja 1.0 18kg -> 612 kcal', dailyKcalByBasis('redukcja', 18, britDry, wetLF, 'normal', 1.0), 611.72, 0.01);
// scenariusz z pytania: pies 20 kg, cel 18 kg, Belcando, redukcja 1.0 -> 164 g/dzien
eq('redukcja 1.0 na Belcando 18kg -> 164 g', reductionKcal(18, 1.0) / bel.kcal, 164.4, 0.1);
eq('redukcja 1.2 na Belcando 18kg -> 197 g', reductionKcal(18, 1.2) / bel.kcal, 197.3, 0.1);
// niezmiennik: obie gramatury niosa te sama energie, niezaleznie od podstawy
['dry', 'wet', 'fediaf', 'redukcja'].forEach(basis => {
  const k = dailyKcalByBasis(basis, 18, britDry, wetLF, 'normal', 1.0);
  const dG = k / britDry.kcal, wG = k / wetLF.kcal;
  assert('niezmiennik energii, basis ' + basis,
    Math.abs(dG * britDry.kcal - k) < 1e-9 && Math.abs(wG * wetLF.kcal - k) < 1e-9);
});

// ---- dzien bez mokrej ma te sama energie co mieszany ----
const kcDay = dailyKcalByBasis('dry', 18, britDry, wetLF, 'normal');
// tryb dom: 3 posilki suche, udzialy 1/3
const domG = allocateGrams([1 / 3, 1 / 3, 1 / 3], kcDay / britDry.kcal);
assert('dzien suchy = cel energetyczny (+/-2 kcal)',
  Math.abs(domG.reduce((a, b) => a + b, 0) * britDry.kcal - kcDay) < 2);
// tryb praca z mokrym suwakiem na 0% -> pozostale przejmuja udzial
let z = { rano: 1 / 3, przedpoludnie: 0, popoludnie: 1 / 3, wieczor: 1 / 3 };
const zeroWetG = allocateGrams([z.rano, z.popoludnie, z.wieczor], kcDay / britDry.kcal);
eq('mokry posilek na 0% -> suma suchych = pelna dawka', zeroWetG.reduce((a, b) => a + b, 0), 184);
assert('mokry na 0% = ta sama energia co dzien suchy',
  Math.abs(zeroWetG.reduce((a, b) => a + b, 0) * britDry.kcal - kcDay) < 2);

console.log(failures ? `\n${failures} FAILURES` : '\nALL TESTS PASSED');
process.exit(failures ? 1 : 0);
