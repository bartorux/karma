# 🐾 Co dziś w misce?

Jednoplikowa aplikacja webowa (czysty HTML/CSS/JS, bez zależności) do planowania
dziennych porcji karmy dla psa według tabel dawkowania producentów i ich
energii metabolicznych. Działa na GitHub Pages:
**https://bartorux.github.io/karma/**

Dane trzymane są wyłącznie lokalnie w przeglądarce (`localStorage`) — nic nie
wychodzi do sieci.

## Funkcje

- **Tryby dnia**: 🏠 *Dom* — 3 posiłki suche (Rano / Południe / Wieczór);
  💼 *Praca* — 4 posiłki (Rano / Przedpołudnie / Popołudnie / Wieczór), drugi
  zawsze mokry, pozostałe suche.
- **Wybór karm** (zapamiętywany do następnej zmiany):
  - sucha: Brit VD GF Gastrointestinal lub Belcando Mastercraft Fresh Salmon,
  - mokra: Brit VD GF Gastrointestinal 400 g lub Brit VD GF GI Low Fat 400 g.
- **Suwaki udziału** — każdy posiłek ma udział w dziennej dawce; przesunięcie
  jednego suwaka proporcjonalnie bilansuje pozostałe (suma zawsze 100%).
  Posiłki oznaczone „Podano" są zamrożone i nie podlegają bilansowaniu.
- **Dokładne gramy** — gramaturę posiłku można też wpisać z klawiatury
  (pole obok nazwy posiłku); wpisana wartość jest przeliczana na udział
  i bilansuje resztę dnia tak samo jak suwak.
- **Ekstra posiłek** — dowolna gramatura, mokra lub sucha; liczy się jako
  podany i proporcjonalnie pomniejsza posiłki jeszcze niepodane. Usunięcie
  ekstra przywraca dokładnie odjęte udziały.
- **Waga docelowa (odchudzanie)** — opcjonalne pole; gdy ustawione, wszystkie
  dawki liczone są z tabel dla wagi docelowej zamiast aktualnej (patrz sekcja
  „Odchudzanie" niżej).
- **Kontrola kaloryczna** — cel dnia w kcal, przelicznik na kg^0,75, RER i norma
  FEDIAF wg aktywności psa, z werdyktem „poniżej / w normie / powyżej"; do tego
  wybór podstawy celu (tabela suchej, tabela mokrej albo norma FEDIAF).
- **Dziennik dnia** — czas podania, sumy mokrej/suchej, postęp x/N,
  automatyczny reset o północy (ustawienia zostają).
- **Tabelki referencyjne** wybranych karm z podświetleniem wiersza dla wagi,
  z której liczone są dawki (docelowej, gdy jest ustawiona).

## Model dawkowania

**Wszystko liczy się od jednego dziennego celu energetycznego (kcal).**
Tabele producentów nie są między sobą równoważne energetycznie (dla psa 18 kg:
sucha Brit VD GI ≈ 723 kcal/dzień, mokre tabele ≈ 936 kcal — różnica ~30%),
dlatego aplikacja nie miesza tabel, tylko wyprowadza obie gramatury z celu:

```
dailyKcal = wg wybranej podstawy (tabela suchej | tabela mokrej | norma FEDIAF)
gramySuchej = dailyKcal / kcalSuchej      gramyMokrej = dailyKcal / kcalMokrej
gramy posiłku = udział × gramyDanegoTypu
```

Konsekwencja: **dzień czysto suchy i dzień mieszany niosą dokładnie tyle samo
energii**. Pominięcie mokrej (tryb dom albo suwak mokrego posiłku na 0%) nie
wymaga żadnej rekompensaty — pozostałe posiłki przejmują jego udział.

Podstawa celu jest wybierana w karcie „Kontrola kaloryczna"; domyślnie to
tabela suchej karmy. Tabele niewybrane jako podstawa pokazywane są
informacyjnie w podsumowaniu i w tabelkach referencyjnych.

Energie metaboliczne (dane producenta, [britvetdiets.com](https://britvetdiets.com/diets/31-gastrointestinal)):

| Karma | ME |
|---|---|
| Brit VD GF Gastrointestinal sucha | 3930 kcal/kg |
| Brit VD GF Gastrointestinal mokra 400 g | 1020 kcal/kg |
| Brit VD GF GI Low Fat mokra 400 g | 775 kcal/kg |
| Belcando Mastercraft Fresh Salmon | ~3560 kcal/kg (szacunek ze składu analitycznego — producent nie publikuje ME; aplikacja pokazuje wtedy notkę) |

Udziały to floaty sumujące się do 1 (minus udziały ekstra) — są jedynym
źródłem prawdy, pozycje suwaków i pola gramów to ich zaokrąglona projekcja.

Gramy per posiłek są rozdzielane **metodą największych reszt** w obrębie grupy
typu karmy, żeby suma posiłków była równa zaokrąglonej dawce dziennej.

### Bilansowanie suwaka

Posiłek `k` ustawiony na `f`, w obrębie niepodanych posiłków `U`
(budżet grupy `S = Σ udziałów U` jest stały):

```
f = clamp(f, 0, S);  R = S − s_k
R > 0:  s_j' = s_j · (S − f) / R      dla j ∈ U \ {k}
R = 0:  s_j' = (S − f) / |U \ {k}|
```

Zmiana suwaków zapisuje się jako domyślny podział dla trybu tylko wtedy, gdy
nie ma aktywnych ekstra (wtedy suma = 1); przy aktywnych ekstra zmiana
obowiązuje tylko do końca dnia.

### Ekstra posiłek

`e = gramy / dawkaDzienna(typu)` — dla suchej dawka wprost z tabeli, dla
mokrej równowartość energetyczna celu (jak przy posiłkach mokrych);
od niepodanych odejmowane proporcjonalnie
(`factor = max(0, (S − e)/S)`), z zapisem dokładnych odjęć per posiłek
(`deductions`) — dzięki temu usunięcie ekstra jest wiernie odwracalne.
Nadwyżka ponad budżet dnia (`overshoot`) wyświetla ostrzeżenie o przekroczeniu
dziennej dawki.

### Zmiana trybu w środku dnia

Podane posiłki, których nie ma w nowym trybie (np. „Południe" z trybu dom),
są konwertowane na wpisy ekstra (z gramaturą i czasem), a udziały nowego trybu
odbudowywane z ustawień i ponownie pomniejszane o wszystkie ekstra.

## Konwencje tabel dawkowania

| Karma | Rodzaj tabeli | Liczenie |
|---|---|---|
| Brit VD GF Gastrointestinal (sucha) | punkty wagowe 2–80 kg | interpolacja liniowa między punktami; poza zakresem wartość skrajna + ostrzeżenie |
| Belcando Mastercraft Fresh Salmon | przedziały wagowe (kolumna „aktywność normalna") | **stała wartość dla całego przedziału**, wiernie wg producenta; konwencja `[lo, hi)` — waga graniczna należy do wyższego przedziału (18 kg → 15–20 → 240 g, ale 20 kg → 20–25 → 280 g); powyżej 80 kg wartość skrajna + ostrzeżenie |
| Brit VD mokre (obie) | przedziały 5–60 kg z zakresem gramatur | **tylko informacyjnie** — gramatura posiłków mokrych wynika z kotwicy kalorycznej, nie z tej tabeli; wartość informacyjna interpolowana liniowo wewnątrz przedziału, poza 5–60 kg ekstrapolowana i oznaczana „(poza tabelą)" |

## localStorage

```js
// 'karma_settings_v6' — trwałe ustawienia
{ v:6, weight, targetWeight,          // targetWeight: null = odchudzanie wyłączone
  dryFoodId, wetFoodId, mode:'dom'|'praca',
  activity:'low'|'normal'|'high',     // 95 | 110 | 130 kcal/kg^0,75
  energyBasis:'dry'|'wet'|'fediaf',   // podstawa dziennego celu energetycznego
  dogCount:1..4,                      // tylko do zużycia karmy, nie zmienia porcji
  shares:{ dom:[⅓,⅓,⅓], praca:[.25,.25,.25,.25] } }

// 'karma_day_v2' — dziennik bieżącego dnia (reset o północy)
{ date:'YYYY-MM-DD', mode,
  shares:{ rano:f, ... },                      // dzisiejsze efektywne udziały
  meals:{ rano:{fed,time,wetG,dryG}|null, ... },
  extras:[ {id,type,grams,time,share,deductions:[{mealId,amount}],overshoot,label} ] }
  // share = ułamek dziennego celu energetycznego w chwili dodania ekstra
```

Przy pierwszym uruchomieniu nowej wersji stare klucze `brit_v5` (waga)
i `brit_day_v1` (dzisiejszy dziennik) są migrowane i usuwane.
Wszystkie odczyty są defensywne — uszkodzone dane wracają do wartości
domyślnych zamiast psuć aplikację.

Reset dnia: `setTimeout` do północy + kontrola daty przy `visibilitychange`
i w każdym handlerze zmieniającym stan (odporność na uśpienie komputera).

## Testy

Czysta matematyka dawkowania (blok między `/*TESTABLE-START*/`
a `/*TESTABLE-END*/` w `index.html`) jest testowana bez przeglądarki:

```
node tests/test-math.js                               # Node.js
node tests/test-integrity.js
osascript -l JavaScript tests/test-math-jxa.js        # macOS bez Node (z katalogu repo)
osascript -l JavaScript tests/test-integrity-jxa.js
```

`test-math` (131 asercji) pokrywa wartości referencyjne tabel, granice
przedziałów, bilansowanie suwaków (w tym suwak na 100% i z powrotem), ekstra
posiłki z wiernym cofaniem, zaokrąglanie gramów, normy FEDIAF/AAHA, progi
werdyktu, kalibrację tabel oraz niezmiennik energii dnia (mieszany = suchy).

`test-integrity` sprawdza sam plik: parsowanie `<script>`, spójność
`getElementById` z markupem, istnienie funkcji z inline handlerów oraz brak
półpauz i cudzysłowów typograficznych w pozycjach składniowych CSS
(tak zepsuła się poprzednia wersja pliku).

## Kontrola kaloryczna

Osobna karta pokazuje, gdzie plan leży względem norm weterynaryjnych — bo same
tabele producentów potrafią się różnić o ~25% i nie mówią, czy pies dostaje
tyle, ile powinien.

Miarą jest **masa metaboliczna** (kg^0,75), której używają FEDIAF i AAHA:

| Odniesienie | kcal/kg^0,75 | × RER |
|---|---|---|
| RER (zapotrzebowanie spoczynkowe) | 70 | 1,00 |
| AAHA — poziom redukcji masy | 70 | 1,00 |
| FEDIAF — pies mało aktywny (<1 h) | 95 | 1,36 |
| FEDIAF — aktywność normalna (1–3 h) | 110 | 1,57 |
| FEDIAF — pies aktywny (>3 h) | 130 | 1,86 |

Kalibracja tabel użytych w aplikacji (kcal/kg^0,75):

| Tabela | Wartość | Ocena |
|---|---|---|
| Brit VD GI **sucha** | ~83 | poniżej dolnej granicy FEDIAF |
| Brit VD GI mokra | 107–110 | norma FEDIAF |
| Brit VD GI Low Fat mokra | 107–110 | norma FEDIAF |
| Belcando Mastercraft (środek przedziału) | ~100 | dolna część normy |

Obie mokre tabele Brit są wyskalowane dokładnie na 110 kcal/kg^0,75, a sucha
tabela tego samego producenta leży ~25% niżej — stąd możliwość wyboru podstawy
celu.

Werdykt porównuje cel dnia z normą FEDIAF dla wybranej aktywności
(tolerancja ±10%: `poniżej` / `w normie` / `powyżej`).

> **Werdykt „poniżej" nie jest poleceniem dokarmiania.** Normy to średnia
> populacyjna, a indywidualne zapotrzebowanie waha się ±20–25%. Rozstrzyga
> kondycja ciała (żebra wyczuwalne, ale niewidoczne; talia widoczna z góry)
> i trend masy ciała, nie tabela.

Wszystkie porcje w aplikacji są **na jednego psa** — tabele producentów są per
pies. Ustawienie „liczba psów" nie zmienia porcji w misce, służy wyłącznie do
policzenia dziennego zużycia karmy.

## Odchudzanie — jak liczy aplikacja i dlaczego

Zgodnie z wytycznymi weterynaryjnymi (AAHA, VCA, Cornell, APOP):

1. **Dawkowanie na wagę docelową, nie aktualną** — po ustawieniu pola
   „Waga docelowa" wszystkie dawki (i podświetlenie tabelek) liczone są
   dla niej. To standardowe zalecenie producentów i lecznic.
2. **Bezpieczne tempo: 1–2% masy ciała tygodniowo** — szybsza utrata wagi
   wymaga kontroli weterynaryjnej; aplikacja przypomina o tym w podsumowaniu
   i o cotygodniowym ważeniu o stałej porze.
3. **Przysmaki maks. 10% dziennej dawki** — gdy suma ekstra posiłków
   przekroczy 10% dziennego zapotrzebowania przy aktywnym odchudzaniu,
   aplikacja pokazuje ostrzeżenie.
4. **Duża redukcja = weterynarz** — cel poniżej 80% aktualnej wagi wyświetla
   osobne ostrzeżenie (redukcja >20% masy powinna przebiegać pod nadzorem).

Aplikacja nie wylicza zapotrzebowania RER/MER — mechanizmem redukcji jest
tabela producenta odczytana dla wagi docelowej (energie karm służą tylko do
przeliczania mokrej na równowartość suchej, patrz „Model dawkowania").
Karma Brit VD GF Gastrointestinal **Low Fat** ma obniżoną kaloryczność
(775 kcal/kg) i dobrze pasuje do planów redukcyjnych.

Źródła: [FEDIAF Nutritional Guidelines](https://europeanpetfood.org/wp-content/uploads/2022/03/Updated-Nutritional-Guidelines.pdf),
[Energy Requirements of Adult Dogs: A Meta-Analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4196927/),
[AAHA Weight Management Guidelines](https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/weight-reduction-in-the-obese-pet/),
[VCA — Creating a Weight Reduction Plan for Dogs](https://vcahospitals.com/know-your-pet/creating-a-weight-reduction-plan-for-dogs),
[Cornell — Obesity and weight loss in dogs](https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/canine-health-topics/obesity-and-weight-loss-dogs),
[Association for Pet Obesity Prevention](https://www.petobesityprevention.org/weight-loss-dogs).

## Zastrzeżenie

Aplikacja tylko przelicza tabele producentów — nie zastępuje porady
weterynaryjnej. Dawkowanie, zwłaszcza przy diecie (Gastrointestinal / Low Fat)
i odchudzaniu, skonsultuj z weterynarzem.
