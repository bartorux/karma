# 🐾 Co dziś w misce?

Jednoplikowa aplikacja webowa (czysty HTML/CSS/JS, bez zależności) do planowania
dziennych porcji karmy dla psa według tabel dawkowania producentów i ich
energii metabolicznych. Działa na GitHub Pages:
**https://bartorux.github.io/karma/**

Dane trzymane są wyłącznie lokalnie w przeglądarce (`localStorage`) — nic nie
wychodzi do sieci. Strona nie pobiera też żadnych zasobów zewnętrznych (czcionki są
systemowe), więc działa offline po pierwszym wczytaniu.

## Funkcje

- **Tryby dnia**: 🏠 *Dom* — 3 posiłki suche (Rano / Południe / Wieczór);
  💼 *Praca* — 4 posiłki (Rano / Przedpołudnie / Popołudnie / Wieczór), drugi
  zawsze mokry, pozostałe suche.
- **Wybór karm** (zapamiętywany do następnej zmiany):
  - sucha: Brit VD GF Gastrointestinal, Belcando Mastercraft Fresh Salmon
    lub Purizon Single Meat Adult łosoś ze szpinakiem,
  - mokra: Brit VD GF Gastrointestinal 400 g lub Brit VD GF GI Low Fat 400 g.
- **Suwaki udziału** — każdy posiłek ma udział w dziennej dawce; przesunięcie
  jednego suwaka proporcjonalnie bilansuje pozostałe (suma zawsze 100%).
  Posiłki oznaczone „Podano" są zamrożone i nie podlegają bilansowaniu.
- **Dokładne gramy** — gramaturę posiłku można też wpisać z klawiatury
  (pole obok nazwy posiłku); wpisana wartość jest przeliczana na udział
  i bilansuje resztę dnia tak samo jak suwak.
- **Ekstra posiłek** — dowolna gramatura, mokra lub sucha, z opcjonalną
  etykietą („przysmak", „kość"); liczy się jako podany i proporcjonalnie
  pomniejsza posiłki jeszcze niepodane. Usunięcie ekstra przywraca dokładnie
  odjęte udziały.
- **Cel planu** — jawny wybór **Utrzymanie / Redukcja**, a dopiero pod nim
  pola pasujące do wyboru (patrz „Cel planu i źródło normy" niżej).
- **Kontrola kaloryczna** — cel dnia w kcal, przelicznik na kg^0,75, RER
  i norma FEDIAF, z werdyktem „poniżej / w normie / powyżej". Przy redukcji
  werdykt zastępuje **deficyt względem utrzymania dla wagi aktualnej**.
- **Dziennik dnia** — czas podania, sumy mokrej/suchej, postęp x/N,
  automatyczny reset o północy (ustawienia zostają).
  Cofnięcie „Podano" i usunięcie ekstra wymagają potwierdzenia.
- **Tabelki referencyjne** wybranych karm z podświetleniem wiersza dla wagi,
  z której liczone są dawki (docelowej przy redukcji). Karma mokra — selektor
  i tabelka — pokazuje się tylko wtedy, gdy dzień faktycznie jej używa.

## Model dawkowania

**Wszystko liczy się od jednego dziennego celu energetycznego (kcal).**
Tabele producentów nie są między sobą równoważne energetycznie (dla psa 18 kg:
sucha Brit VD GI ≈ 723 kcal/dzień, mokre tabele ≈ 936 kcal — różnica ~30%),
dlatego aplikacja nie miesza tabel, tylko wyprowadza obie gramatury z celu:

```
dailyKcal = wg celu i źródła normy (patrz „Cel planu i źródło normy")
gramySuchej = dailyKcal / kcalSuchej      gramyMokrej = dailyKcal / kcalMokrej
gramy posiłku = udział × gramyDanegoTypu
```

Konsekwencja: **dzień czysto suchy i dzień mieszany niosą dokładnie tyle samo
energii**. Pominięcie mokrej (tryb dom albo suwak mokrego posiłku na 0%) nie
wymaga żadnej rekompensaty — pozostałe posiłki przejmują jego udział.

Wynika stąd też, że **tabela mokrej karmy nigdy nie wyznacza dziennego celu** —
gramatura mokrego posiłku bierze się z gęstości energetycznej
(`dailyKcal / kcalMokrej`). Tabela mokrej jest wyłącznie informacyjna.

## Cel planu i źródło normy

Karta „Cel planu" rozdziela dwa niezależne pytania: **jaki masz cel** i
**skąd bierzemy normę**.

```
CEL:  [ Utrzymanie ]              [ Redukcja ]
        │                           │
        ├─ Norma wg:                ├─ Waga docelowa
        │   • tabela producenta     └─ Poziom: 1,0–1,4 × RER wagi docelowej
        │   • norma FEDIAF
        │
        └─ Aktywność ───────────────── Aktywność
```

Waga docelowa działa **tylko** przy celu „Redukcja" — samo jej wpisanie nie
zmienia po cichu dawkowania.

Przy redukcji źródło jest **jedno**: mnożnik × RER wagi docelowej. Tabela
producenta odczytana dla wagi docelowej to liczba **utrzymaniowa** (≈1,34 × RER),
więc jako źródło redukcji byłaby redundantna wobec mnożnika i myląca — przy
aktywności „normalna" dawała 1,54 × RER, czyli deficyt ok. 10%. Szczegóły
w sekcji „Odchudzanie".

### Rola aktywności

| Cel / źródło | Czy aktywność zmienia dawkę? |
|---|---|
| utrzymanie, tabela producenta | **tak**, jeśli producent ma kolumny aktywności (Belcando) |
| utrzymanie, norma FEDIAF | **tak** — 95 / 110 / 130 kcal/kg^0,75 |
| redukcja | **nie** — RER jest z definicji energią spoczynkową |

Przy redukcji opartej na RER aktywność nadal ma znaczenie, ale dla **oceny**,
nie dla dawki: decyduje, jak głęboki jest deficyt względem utrzymania dla wagi
aktualnej. Dla psa 20 kg na planie 612 kcal to kolejno 32% / 41% / 50%.

Energie metaboliczne (dane producenta, [britvetdiets.com](https://britvetdiets.com/diets/31-gastrointestinal)):

| Karma | ME |
|---|---|
| Brit VD GF Gastrointestinal sucha | 3930 kcal/kg |
| Brit VD GF Gastrointestinal mokra 400 g | 1020 kcal/kg |
| Brit VD GF GI Low Fat mokra 400 g | 775 kcal/kg |
| Belcando Mastercraft Fresh Salmon | ~3720 kcal/kg (szacunek — producent nie publikuje ME; aplikacja pokazuje wtedy notkę) |
| Purizon Single Meat Adult łosoś ze szpinakiem | 3835 kcal/kg (deklaracja producenta: ME FEDIAF 2016, 16,04 MJ/kg) |

Belcando liczone **równaniem predykcyjnym FEDIAF/NRC** ze składników
analitycznych z opakowania (białko 27%, tłuszcz 15%, popiół 6,5%, włókno 3,3%,
wilgotność 10% → NFE 38,2%):

```
GE  = 5,7×27 + 9,4×15 + 4,1×(38,2+3,3)   = 465,1 kcal/100 g
dE% = 91,2 − 1,43 × (3,3/90×100)         = 86,0%
ME  = 465,1×0,860 − 1,04×27              = 371,6 kcal/100 g → 3,72 kcal/g
```

Zmodyfikowany wzór Atwatera (3,5/8,5/3,5) dałby 3,56 kcal/g, ale FEDIAF zaleca
dla karm pełnoporcjowych równanie predykcyjne — i to ono zgadza się z kalibracją
tabeli producenta (patrz „Normy energetyczne").

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

Usunięcie ekstra przeplanowuje dzień (`replanDay`): wagi niepodanych posiłków
to ich udziały plus wszystko, co odjęły im ekstra (czyli podział sprzed ekstra,
razem z ręcznymi zmianami suwaków). Niepodane dostają budżet
`1 − Σ udziałów podanych`, a pozostałe ekstra są nakładane od nowa, z nowymi
`deductions` i `overshoot`. Odjęcie od posiłku, który w międzyczasie podano,
przechodzi więc na niepodane, zamiast przepaść, a ostrzeżenie o przekroczeniu
nie zostaje po usunięciu innego ekstra.

### Zmiana trybu w środku dnia

Podane posiłki, których nie ma w nowym trybie (np. „Południe" z trybu dom),
są konwertowane na wpisy ekstra (z gramaturą i czasem). Podane posiłki obecne
w obu trybach (Rano, Wieczór) **zachowują udział, z jakim je podano** — ich gramy
są zamrożone. Niepodane dzielą resztę dnia (`1 − Σ podanych`) proporcjonalnie
do domyślnego podziału nowego trybu, a potem wszystkie ekstra są nakładane
od nowa (`replanDay`). Energia dnia się zgadza: podane + plan = cel.

## Konwencje tabel dawkowania

| Karma | Rodzaj tabeli | Liczenie |
|---|---|---|
| Brit VD GF Gastrointestinal (sucha) | punkty wagowe 2–80 kg | interpolacja liniowa między punktami; poza zakresem wartość skrajna + ostrzeżenie |
| Belcando Mastercraft Fresh Salmon | punkty wagowe 3–80 kg, **dwie kolumny aktywności** | interpolacja liniowa między punktami; etykieta podaje **punkty** („Optimales Gewicht"), nie przedziały, więc 20 kg to wprost 240 g (kolumna „Normale") albo 275 g („Erhöhte"); poza zakresem wartość skrajna + ostrzeżenie |
| Purizon Single Meat Adult łosoś | przedziały 1–80 kg, których końce się łączą (1–5 kg: 28–85 g, 5–15 kg: 85–195 g, …) | traktowane jak **punkty** na granicach przedziałów i interpolowane liniowo (20 kg → 238 g); jedna kolumna, aktywność nie zmienia dawki z tabeli; „80 kg +: 670 g +" → wartość skrajna + ostrzeżenie |
| Brit VD mokre (obie) | przedziały 5–60 kg z zakresem gramatur | **tylko informacyjnie** — gramatura posiłków mokrych wynika z kotwicy kalorycznej, nie z tej tabeli; wartość informacyjna interpolowana liniowo wewnątrz przedziału, poza 5–60 kg ekstrapolowana i oznaczana „(poza tabelą)" |

## localStorage

```js
// 'karma_settings_v7' — trwałe ustawienia
{ v:7, weight, targetWeight,          // targetWeight liczy się tylko przy goal:'redukcja'
  dryFoodId, wetFoodId, mode:'dom'|'praca',
  activity:'low'|'normal'|'high',     // 95 | 110 | 130 kcal/kg^0,75
  goal:'utrzymanie'|'redukcja',       // cel planu
  maintenanceSource:'tabela'|'fediaf',        // źródło normy przy utrzymaniu
  reductionFactor:1.0|1.1|1.2|1.3|1.4,        // mnożnik RER przy redukcji
  shares:{ dom:[⅓,⅓,⅓], praca:[.25,.25,.25,.25] } }
// maintenanceSource dotyczy wyłącznie celu 'utrzymanie'; przy redukcji
// źródłem jest zawsze RER wagi docelowej.

// 'karma_day_v2' — dziennik bieżącego dnia (reset o północy)
{ date:'YYYY-MM-DD', mode,
  shares:{ rano:f, ... },                      // dzisiejsze efektywne udziały
  meals:{ rano:{fed,time,wetG,dryG}|null, ... },
  extras:[ {id,type,grams,time,share,deductions:[{mealId,amount}],overshoot,label} ] }
  // share = ułamek dziennego celu energetycznego w chwili dodania ekstra
```

Przy pierwszym uruchomieniu nowej wersji stare klucze są migrowane i usuwane:
`brit_v5` (waga), `brit_day_v1` (dzisiejszy dziennik) oraz `karma_settings_v6`.

Migracja v6 → v7 tłumaczy `energyBasis` na cel i źródło (`goalFromBasis`):

| v6 `energyBasis` | waga docelowa | v7 |
|---|---|---|
| `'redukcja'` | — | `goal:'redukcja'` (zapisany mnożnik bez zmian) |
| `'dry'` / `'wet'` / `'fediaf'` | ustawiona | `goal:'redukcja'`, `reductionFactor:1.2` |
| `'fediaf'` | brak | `goal:'utrzymanie'`, `maintenanceSource:'fediaf'` |
| `'dry'` / `'wet'` | brak | `goal:'utrzymanie'`, `maintenanceSource:'tabela'` |

`'wet'` znika jako źródło dziennego celu. Sama waga docelowa w v6 po cichu
przełączała dawkowanie, więc jej obecność oznacza w v7 jawną redukcję.
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

`test-math` (345 asercji) pokrywa wartości referencyjne tabel, granice
przedziałów, bilansowanie suwaków (w tym suwak na 100% i z powrotem), ekstra
posiłki z wiernym cofaniem, zaokrąglanie gramów, normy FEDIAF/AAHA, progi
werdyktu, kalibrację tabel, niezmiennik energii dnia (mieszany = suchy),
oraz przeplanowanie dnia (`replanDay`).

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
| Belcando „Normale Aktivität" (3–80 kg) | 89–98 | poziom „mało aktywny" |
| Belcando „Erhöhte Aktivität" (3–80 kg) | 105–115 | norma FEDIAF |
| Purizon Single Meat łosoś (5–80 kg) | 96–98 | poziom „mało aktywny" |

Obie mokre tabele Brit są wyskalowane dokładnie na 110 kcal/kg^0,75, a sucha
tabela tego samego producenta leży ~25% niżej — stąd możliwość wyboru źródła
normy.

### Kolumny Belcando są przesunięte względem skali FEDIAF

Obie kolumny z worka trzymają się bardzo wąskich pasm na całej długości tabeli,
co pozwala je jednoznacznie przypisać do poziomów FEDIAF — i pokazuje, że
**nazwy producenta są przesunięte o jeden stopień**:

| Kolumna z worka | kcal/kg^0,75 | odpowiada FEDIAF |
|---|---|---|
| „Normale Aktivität" | 89–98 | **mało aktywny (95)** |
| „Erhöhte Aktivität" | 105–115 | **normalna aktywność (110)** |

Dlatego aplikacja mapuje kolumny **po energii, nie po nazwie**: `low` → kolumna
„Normale", `normal` → „Erhöhte". Poziomu „dużo aktywny" producent nie podaje —
aplikacja przedłuża jego własny krok między kolumnami (`normal²/low` na każdym
punkcie), co daje ~124 kcal/kg^0,75 wobec 130 wg FEDIAF; wynik jest oznaczany
jako ekstrapolacja. Dla psa 20 kg: **240 / 275 / 315 g**.

Pas 89–98 dla kolumny bazowej jest zarazem kontrolą poprawności przyjętej ME:
przy 3,56 kcal/g wyszłoby 85–94, przy 3,72 wypada dokładnie na 95. Producent
nie zawyża dawek — jego „normalna" to w skali FEDIAF pies mało aktywny.

Werdykt porównuje cel dnia z normą FEDIAF dla wybranej aktywności
(tolerancja ±10%: `poniżej` / `w normie` / `powyżej`). Przy redukcji werdykt
zastępuje **deficyt względem utrzymania dla wagi aktualnej** — patrz
„Odchudzanie".

> **Werdykt „poniżej" nie jest poleceniem dokarmiania.** Normy to średnia
> populacyjna, a indywidualne zapotrzebowanie waha się ±20–25%. Rozstrzyga
> kondycja ciała (żebra wyczuwalne, ale niewidoczne; talia widoczna z góry)
> i trend masy ciała, nie tabela.

## Odchudzanie — jak liczy aplikacja i dlaczego

Zgodnie z wytycznymi weterynaryjnymi (AAHA, VCA, Cornell, APOP):

1. **Dawkowanie na wagę docelową, nie aktualną** — po wybraniu celu „Redukcja"
   i podaniu wagi docelowej wszystkie dawki (i podświetlenie tabelek) liczone
   są dla niej. To standardowe zalecenie producentów i lecznic.
2. **Jedyne źródło to mnożnik × RER wagi docelowej** — protokół AAHA startuje od
   `1,0 × RER(waga docelowa)`; dostępne mnożniki 1,0–1,4 (wyższe = wariant
   łagodny albo wyjście z plateau). Tylko to wprowadza faktyczny deficyt;
   tabela producenta i norma FEDIAF to poziomy **utrzymaniowe**, tyle że
   odczytane dla niższej wagi (patrz niżej).
3. **Miarą planu jest deficyt wobec utrzymania dla wagi AKTUALNEJ** —
   przy redukcji karta kaloryczna porównuje cel dnia z `MER(waga aktualna)`,
   bo to on decyduje o tempie chudnięcia. Porównanie z normą dla wagi docelowej
   zawsze wyszłoby „poniżej" i nic nie wnosi. Deficyt 20–40% odpowiada mniej
   więcej zalecanym 1–2% masy tygodniowo; poza tym zakresem aplikacja ostrzega.
   Aktywność psa nie zmienia tu dawki, ale zmienia punkt odniesienia: ten sam
   plan 612 kcal to dla psa 20 kg deficyt 32% / 41% / 50%.
4. **Bezpieczne tempo: 1–2% masy ciała tygodniowo** — szybsza utrata wagi
   wymaga kontroli weterynaryjnej; aplikacja przypomina o tym w podsumowaniu
   i o cotygodniowym ważeniu o stałej porze.
5. **Przysmaki maks. 10% dziennej dawki** — gdy suma ekstra posiłków
   przekroczy 10% dziennego zapotrzebowania przy aktywnym odchudzaniu,
   aplikacja pokazuje ostrzeżenie.
6. **Duża redukcja = weterynarz** — cel poniżej 80% aktualnej wagi wyświetla
   osobne ostrzeżenie (redukcja >20% masy powinna przebiegać pod nadzorem).

### Dlaczego producent i AAHA dają różne liczby

To najczęstsze źródło nieporozumienia: tabela producenta odczytana dla wagi
docelowej daje ~34% więcej kalorii niż protokół AAHA. **To nie jest rozbieżność
danych — oba odpowiadają na inne pytanie.** Po sprowadzeniu do wspólnej miary
(wielokrotność RER wagi docelowej) widać to od razu:

| Źródło | kcal/kg^0,75 | × RER | Co to właściwie jest |
|---|---|---|---|
| AAHA — poziom redukcji | 70 | **1,00** | ile jeść, **żeby schudnąć** do 18 kg |
| Belcando „Normale" | 94 | 1,34 | ile jeść, **żeby utrzymać** 18 kg |
| FEDIAF mało aktywny | 95 | 1,36 | to samo, innym słowem |
| Belcando „Erhöhte" | 108 | 1,54 | utrzymanie 18 kg przy większym ruchu |

Tabela producenta jest z definicji **utrzymaniowa** — praktycznie tożsama
z normą FEDIAF (1,34 vs 1,36 × RER). Luka wobec AAHA **jest właśnie deficytem**.
Producent nie może podać liczby redukcyjnej, bo nie zna ani aktualnej wagi psa,
ani jego kondycji. Przy odchudzaniu jego tabela ma jedno sensowne zastosowanie:
to liczba, na którą przełączysz się **po osiągnięciu celu** — czyli tryb
„Utrzymanie".

### Komu ufać: celem jest deficyt, nie liczba kcal

Żadne z tych źródeł nie jest przepowiednią — rozstrzyga cotygodniowa waga.
Właściwym celem jest **deficyt 20–40%**, bo to on odpowiada zalecanym 1–2% masy
tygodniowo. Ten sam plan daje różny deficyt zależnie od tego, jak daleko pies
jest od celu:

| Plan (cel 18 kg) | kcal | pies 20 kg (11% ponad) | pies 30 kg (67% ponad) |
|---|---|---|---|
| 1,0 × RER | 612 | 41% — za ostro | 57% — za ostro |
| 1,2 × RER | 734 | **29%** ✅ | 48% |
| 1,4 × RER | 856 | 18% — za mało | **39%** ✅ |

Domyślne 1,0 × RER to protokół dla psów realnie otyłych (BCS 8–9, ~30%+ ponad
cel); przy lekkiej nadwadze jest za agresywne. Dlatego aplikacja liczy
`suggestReductionFactor` — mnożnik dający deficyt najbliżej środka pasma — i
pokazuje go jako podpowiedź z przyciskiem. **Nie zmienia ustawienia sama.**
Gdy żaden mnożnik nie trafia w pasmo (pies bardzo otyły), zamiast podpowiedzi
pojawia się informacja, że plan wymaga konsultacji weterynaryjnej.

Przykład (pies 20 kg, cel 18 kg, Belcando Mastercraft):

| Poziom | g/dzień | kcal | × RER(18 kg) | Deficyt vs utrzymanie 20 kg (1040 kcal) |
|---|---|---|---|---|
| RER × 1,0 | 164 | 612 | 1,00 | 41% — za ostro |
| RER × 1,2 | 197 | 734 | 1,20 | **29%** ← sugerowany |
| RER × 1,4 | 230 | 856 | 1,40 | 18% |

Karma Brit VD GF Gastrointestinal **Low Fat** ma niższą gęstość energetyczną
(775 kcal/kg). Przy kotwicy kalorycznej **nie obniża to kalorii planu** —
zwiększa gramaturę: te same 612 kcal to 789 g Low Fat zamiast 600 g mokrej
standardowej. Zaleta jest więc objętościowa (większa miska i sytość przy tej
samej energii) oraz w niższej zawartości tłuszczu, a nie kaloryczna.

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
