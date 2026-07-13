# 🐾 Co dziś w misce?

Jednoplikowa aplikacja webowa (czysty HTML/CSS/JS, bez zależności) do planowania
dziennych porcji karmy dla psa według tabel dawkowania producentów.
Działa na GitHub Pages: **https://bartorux.github.io/karma/**

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
- **Ekstra posiłek** — dowolna gramatura, mokra lub sucha; liczy się jako
  podany i proporcjonalnie pomniejsza posiłki jeszcze niepodane. Usunięcie
  ekstra przywraca dokładnie odjęte udziały.
- **Waga docelowa (odchudzanie)** — opcjonalne pole; gdy ustawione, wszystkie
  dawki liczone są z tabel dla wagi docelowej zamiast aktualnej (patrz sekcja
  „Odchudzanie" niżej).
- **Dziennik dnia** — czas podania, sumy mokrej/suchej, postęp x/N,
  automatyczny reset o północy (ustawienia zostają).
- **Tabelki referencyjne** wybranych karm z podświetleniem wiersza dla
  aktualnej wagi.

## Model dawkowania

Założenie izokaloryczne: dzienna dawka z tabeli każdej karmy pokrywa to samo
zapotrzebowanie psa, więc **udział posiłku = ułamek dziennego zapotrzebowania**,
a gramy = `udział × dawkaDzienna(karmy danego typu)`. Udziały to floaty
sumujące się do 1 (minus udziały ekstra) — są jedynym źródłem prawdy, pozycje
suwaków to ich zaokrąglona projekcja.

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

`e = gramy / dawkaDzienna(typu)`; od niepodanych odejmowane proporcjonalnie
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
| Brit VD mokre (obie) | przedziały 5–60 kg z zakresem gramatur | interpolacja liniowa wewnątrz przedziału; poza 5–60 kg ekstrapolacja nachyleniem skrajnego przedziału + ostrzeżenie „wartość szacunkowa" |

## localStorage

```js
// 'karma_settings_v6' — trwałe ustawienia
{ v:6, weight, targetWeight,          // targetWeight: null = odchudzanie wyłączone
  dryFoodId, wetFoodId, mode:'dom'|'praca',
  shares:{ dom:[⅓,⅓,⅓], praca:[.25,.25,.25,.25] } }

// 'karma_day_v2' — dziennik bieżącego dnia (reset o północy)
{ date:'YYYY-MM-DD', mode,
  shares:{ rano:f, ... },                      // dzisiejsze efektywne udziały
  meals:{ rano:{fed,time,wetG,dryG}|null, ... },
  extras:[ {id,type,grams,time,share,deductions:[{mealId,amount}],overshoot,label} ] }
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
node tests/test-math.js          # Node.js
osascript -l JavaScript tests/test-math-jxa.js   # macOS bez Node
```

Testy pokrywają wartości referencyjne tabel, granice przedziałów,
bilansowanie suwaków (w tym suwak na 100% i z powrotem), ekstra posiłki
z wiernym cofaniem oraz zaokrąglanie gramów.

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

Aplikacja świadomie nie liczy kalorii (RER/MER) — operuje wyłącznie tabelami
producentów, więc mechanizmem redukcji jest tabela odczytana dla wagi
docelowej. Karma Brit VD GF Gastrointestinal **Low Fat** ma obniżoną
kaloryczność i dobrze pasuje do planów redukcyjnych.

Źródła: [AAHA Weight Management Guidelines](https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/weight-reduction-in-the-obese-pet/),
[VCA — Creating a Weight Reduction Plan for Dogs](https://vcahospitals.com/know-your-pet/creating-a-weight-reduction-plan-for-dogs),
[Cornell — Obesity and weight loss in dogs](https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/canine-health-topics/obesity-and-weight-loss-dogs),
[Association for Pet Obesity Prevention](https://www.petobesityprevention.org/weight-loss-dogs).

## Zastrzeżenie

Aplikacja tylko przelicza tabele producentów — nie zastępuje porady
weterynaryjnej. Dawkowanie, zwłaszcza przy diecie (Gastrointestinal / Low Fat)
i odchudzaniu, skonsultuj z weterynarzem.
