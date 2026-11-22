# Drive My Truck — analiza rynku UK i plan MVP

*Stan na: listopad 2026. Liczby z branży (RHA, rekruterzy, prasa branżowa) to szacunki. Przed decyzjami finansowymi warto je sprawdzić bezpośrednio u źródła.*

---

## 1. Werdykt w skrócie

**Pomysł jest realny i legalny w UK, ale to nie jest pusty rynek.** Jest popyt, są pieniądze (agencje zarabiają na tym od lat) i jest bezpośredni konkurent (Avail). Wygrać można prostotą, przejrzystością stawek i dwustronnymi opiniami, a nie samym pomysłem.

| | Ocena |
|---|---|
| Popyt na kierowców ad-hoc | ✅ Wysoki i stały. Firmy i tak płacą agencjom marże. |
| Bariera prawna | 🟡 Średnia. Da się, ale trzeba dobrze wybrać model (patrz pkt 4). |
| Konkurencja | 🟡 Jest, ale rozdrobniona. Rynek opanowały tradycyjne agencje. |
| Koszt startu (MVP) | ✅ Niski. Strona i aplikacja webowa, bez płatności na start. |
| Największe ryzyko | 🔴 „Kura i jajko” (brak kierowców = brak firm) oraz omijanie platformy po pierwszym zleceniu. |

---

## 2. Popyt — czy jest problem do rozwiązania?

- **Niedobór kierowców HGV zmalał od szczytu w 2021, ale nie zniknął.** Najnowsza rządowa publikacja o wakatach (maj 2026, dane do Q4 2025) mówi, że wakaty są niższe niż szczyt z Q4 2021. Dane branżowe z połowy 2026 pokazują jednak, że więcej firm znów podnosi stawki i zgłasza wakaty.
- **Zapotrzebowanie na nowych kierowców:** RHA szacuje ok. **40 000 nowych kierowców rocznie** przez najbliższe 5 lat. Inne szacunki mówią o ok. 60 000.
- **Firmy łatają dziury agencjami i nadgodzinami**, co jest drogie. Właśnie to chcemy zastąpić.
- **Typowe stawki dla kierowcy (agencje, 2026):** Class 1 to ok. **£17–18/h bazowo**, a w nocy, w weekendy i w Londynie/na południowym wschodzie **£25–34/h**. Zmiana 10 h to realnie **£180–£300**, co zgadza się z przykładami z makiet.
- **Marża agencji** (to, co firma płaci ponad stawkę kierowcy) nie jest publiczna. Z praktyki branżowej to zwykle kilka funtów na godzinę na kierowcę. *To jest przestrzeń, którą możemy zabrać, biorąc mniej.*

**Wniosek:** firmy transportowe już dziś płacą pośrednikowi za szybkiego kierowcę „na jutro”. Nie musimy przekonywać nikogo, że problem istnieje.

---

## 3. Konkurencja

| Kto | Co robi | Model | Nasza przewaga |
|---|---|---|---|
| **Avail** (availlogistics.co.uk) | Najbliższy konkurent. Aplikacja łącząca kierowców z firmami, zmiany Class 1/2, partnerstwo z Logistics UK. | Firma płaciła stałą opłatę **ok. £7,50 za kierowcę za dzień** (dane z 2021, do weryfikacji). Kierowcy na PAYE. | Dwustronne oceny, kierowca sam ustala stawkę, prostszy UX, lokalny marketing. |
| **ShiftOwt** | Kierowcy zaznaczają dostępność, agencje i klienci rezerwują. | Narzędzie SaaS (subskrypcja) dla agencji. | To narzędzie dla agencji, a nie otwarty marketplace. |
| **HGV Driver Hub** | Pula kierowców, zlecenia od przewoźników i agencji, sprawdzanie dokumentów. | Pula zamknięta. | Otwarty rynek z opiniami. |
| **HGV Connect** | Tablica ogłoszeń (ad-hoc i part-time). | Job board. | Rezerwacja i dostępność w czasie rzeczywistym zamiast ogłoszeń. |
| **Haulage Exchange** | Giełda ładunków dla owner-driverów. | Subskrypcja. | Inny produkt (ładunki, a nie kierowcy). |
| **Agencje** (Driver Hire, Staffline, Manpower, Pertemps…) | Tradycyjne pośrednictwo. | Marża od godziny. | Taniej, szybciej, przejrzyście, z opiniami. |
| **Ogólne aplikacje „gig”** (Indeed Flex, Temper, Coople) | Zmiany w różnych branżach. | Prowizja lub marża. | Specjalizacja HGV: klasy, CPC, tacho, ADR. |

**Wniosek:** nikt jeszcze wyraźnie nie zrobił „Airbnb dla kierowców HGV” z **publicznymi opiniami w obie strony**. To jest nasz wyróżnik. Kierowcy chcą wiedzieć, które firmy płacą na czas i mają porządne auta, a firmy chcą wiedzieć, kto jest solidny.

---

## 4. Prawo — najważniejsze rzeczy (to trzeba zrobić dobrze)

> ⚠️ To nie jest porada prawna. Przed startem z prowizjami warto zrobić 1–2 h konsultacji z prawnikiem od employment law lub rekrutacji (koszt rzędu kilkuset funtów, a oszczędza dużo kłopotów).

### 4.1 Platforma = „employment agency” w rozumieniu prawa
Ustawa Employment Agencies Act 1973 i **Conduct Regulations 2003** obejmują także **platformy online**, niezależnie od statusu pracownika. W Anglii **nie potrzeba licencji**, ale trzeba przestrzegać zasad.

**🔴 Kluczowe:** zgodnie z Conduct Regulations **nie wolno pobierać opłat od kierowców za znalezienie im pracy** (wyjątki dotyczą m.in. modelingu i rozrywki, a nie kierowców). **Prowizję płaci firma transportowa, nie kierowca.** Dla kierowców platforma musi być darmowa. Ustawa **nie reguluje** wysokości opłat pobieranych od firm.

### 4.2 Dwa możliwe modele działania

**Model A — „marketplace / introduction” (polecany na start)**
- Łączymy strony i pobieramy opłatę od firmy (np. stała kwota za rezerwację albo abonament).
- Firma rozlicza się z kierowcą bezpośrednio, a kierowca działa jako self-employed, przez własną Ltd albo przez umbrella company.
- ✅ Prosto, tanio, szybko. ❌ Mniejsze przychody i ryzyko omijania platformy.

**Model B — „employment business” (jak klasyczna agencja, na później)**
- Kierowca pracuje „przez nas”, my płacimy go przez PAYE (albo przez partnera payroll lub umbrella) i fakturujemy firmę ze stawką i marżą.
- ✅ Dużo większe przychody na zleceniu, zgodność z IR35 po naszej stronie (tak robi Avail). ❌ Payroll, urlopy, AWR, ryzyko, że firma nie zapłaci, większa odpowiedzialność.

### 4.3 Status kierowcy (self-employed vs worker) i IR35
- Wyrok Supreme Court w sprawie **Ubera** (kierowcy to „workers”) i sprawa **Deliveroo** (self-employed) pokazują, że o statusie decyduje **realna kontrola**, a nie to, co jest w umowie.
- Kierowca HGV zwykle jeździ autem firmy, według jej planu i pod jej nadzorem, więc **trudno uznać go za w pełni samozatrudnionego**. Przy kierowcach przez Ltd średnie i duże firmy muszą robić ocenę IR35.
- **Praktycznie:** w modelu A to firma i kierowca odpowiadają za formę rozliczenia, a my to jasno opisujemy w regulaminie. Docelowo warto dodać opcję „rozliczenie przez partnera umbrella/PAYE”.

### 4.4 Czas pracy kierowcy
- Przepisy o czasie jazdy i tachografach (oraz Road Transport (Working Time) Regulations) **sumują pracę u wszystkich pracodawców.** Kierowca dorabiający ad-hoc musi deklarować godziny przepracowane gdzie indziej.
- W aplikacji: pole lub oświadczenie przy rezerwacji („potwierdzam, że mam wymagany odpoczynek”). To duży plus wizerunkowy u przewoźników.

### 4.5 Weryfikacja dokumentów
| Dokument | Jak sprawdzić na start (ręcznie) | Później (automatycznie) |
|---|---|---|
| Prawo jazdy (kategorie, punkty) | Kierowca podaje **check code z gov.uk/view-driving-licence** (ważny 21 dni, jednorazowy). Sprawdzamy na gov.uk/check-driving-information. | DVLA API (tylko dla zatwierdzonych podmiotów) albo komercyjny dostawca (np. firmy licence-check z G-Cloud). |
| Driver CPC (DQC) | Zdjęcie karty i data ważności. Widoczne też w danych DVLA. | Jak wyżej. |
| Karta tachografu | Zdjęcie i data ważności. | Jak wyżej. |
| Right to Work | Share code z gov.uk (Home Office). | Dostawca IDVT. |
| ADR, HIAB, FLT itp. | Zdjęcie certyfikatu. | — |

### 4.6 Pozostałe obowiązki
- **RODO/UK GDPR:** przechowujemy dane wrażliwe (prawo jazdy, punkty karne). Trzeba rejestracji w **ICO** (opłata ok. £40–60 rocznie), polityki prywatności, szyfrowania i usuwania danych na żądanie.
- **Ubezpieczenie:** to firma musi mieć kierowcę na polisie floty (często wymagania typu wiek 25+ czy limit punktów). W ogłoszeniu dajemy pole „wymagania ubezpieczyciela”. Dla nas: **professional indemnity i public liability.**
- **Platform reporting (HMRC, od 2024):** jeśli kiedyś **pieniądze będą płynąć przez platformę** do samozatrudnionych, mamy obowiązek raportowania ich dochodów do HMRC. W modelu A bez płatności ten obowiązek nas nie dotyczy.
- **Opinie:** zgodnie z prawem konsumenckim (DMCC Act 2024) nie wolno publikować fałszywych opinii ani ukrywać negatywnych. Opinie wystawia się **tylko po zakończonym zleceniu.** To nasz model, więc dobrze.

---

## 5. Model biznesowy — rekomendacja

1. **Miesiące 0–3: wszystko darmowe** (tak jak chcesz). Budujemy bazę kierowców i opinii.
2. **Potem: opłata tylko od firm**, do wyboru:
   - **Opłata za potwierdzoną rezerwację: £10–20 za zmianę** (Avail historycznie brał ok. £7,50 za dzień, więc jesteśmy w tej samej lidze, ale dajemy więcej: opinie i weryfikację), **albo**
   - **% od stawki zmiany: 5–10%** (przy £250 to £12,50–25), **albo**
   - **Abonament dla firm** (np. £49–149 miesięcznie za nielimitowane ogłoszenia) dla stałych klientów.
3. **Kierowcy zawsze za darmo** (wymóg prawa z pkt 4.1, a przy okazji argument marketingowy).
4. **Później, w modelu B:** płatności przez platformę (Stripe Connect), faktury i payroll przez partnera. Wtedy zarabiamy marżę jak agencja, tylko mniejszą.

**Ochrona przed omijaniem platformy:** wartość musi zostać na platformie, czyli zweryfikowane dokumenty, historia opinii, faktury i rozliczenia w jednym miejscu, przypomnienia o wygasających dokumentach i szybkość („kierowca na jutro w 10 minut”). Prywatny numer telefonu kierowcy pokazujemy dopiero po rezerwacji.

---

## 6. Jak wystartować (go-to-market)

Najtrudniejszy problem marketplace'u to „kura i jajko”. Rozwiązanie: **zacząć lokalnie.**

1. **Jeden region: West Midlands** (Birmingham, Coventry, Wolverhampton, Walsall). Gęsto od magazynów i centrów dystrybucyjnych przy M6/M42, zresztą makiety już to zakładają.
2. **Najpierw kierowcy (podaż):** grupy na Facebooku dla kierowców HGV (w tym polskie, rumuńskie i inne społeczności), TikTok i Instagram, ulotki na truck stopach, szkoły jazdy HGV (świeżo zdani kierowcy szukają pierwszej pracy, a tego „mostu” brakuje, o czym pisze CILT).
3. **Potem firmy (popyt):** małe i średnie firmy (5–50 aut), które nie mają umowy z dużą agencją. Telefon lub osobista wizyta z hasłem *„pierwsze 3 miesiące za darmo, kierowca na jutro”*.
4. **Opinie jako marketing:** „Top rated companies in Birmingham”, czyli ranking firm, którym kierowcy ufają.

---

## 7. Zakres MVP (wersja 1)

Dokładnie tak, jak opisałeś, i nic więcej:

**Konta**
- Rejestracja jako **Kierowca** albo **Firma** (e-mail i hasło, później logowanie przez Google/Apple).

**Kierowca**
- Profil: zdjęcie, lokalizacja (kod pocztowy i promień dojazdu), kategorie (C+E/Class 1, C/Class 2, 7.5t), doświadczenie, uprawnienia dodatkowe (ADR, HIAB, nights, trunking, multi-drop…), oczekiwana stawka (za godzinę lub zmianę).
- Dokumenty: prawo jazdy i check code, CPC, tacho, Right to Work, z datami ważności. Status: *oczekuje / zweryfikowany / wygasł*.
- **Dostępność:** kalendarz dni (dzień, noc, cały dzień) i przełącznik „Available today”.
- Lista ofert w pobliżu z filtrami (klasa, data, stawka) i przycisk **„I'm available”** (aplikacja).

**Firma**
- Profil firmy: nazwa, numer Companies House, O-licence (opcjonalnie), adres, logo.
- **Dodaj zlecenie:** klasa, lokalizacja, data i godzina, czas trwania, stawka (za zmianę lub godzinę), typ pracy (trunking, multi-drop…), typ auta (curtainsider, fridge…), wymagania.
- Lista zgłoszeń i **akceptacja kierowcy, czyli rezerwacja.**
- Wyszukiwarka dostępnych kierowców w okolicy i zaproszenie do zlecenia.

**Po zleceniu**
- Obie strony oznaczają zlecenie jako wykonane i **wystawiają sobie nawzajem gwiazdki (1–5) i komentarz.** Opinie publikujemy dopiero, gdy obie strony je wystawią albo minie 14 dni (tak robi Airbnb, żeby nikt nie odwdzięczał się złą opinią za złą).

**Admin (my)**
- Panel weryfikacji dokumentów (akceptuj/odrzuć), blokowanie kont, moderacja opinii.

**Powiadomienia e-mail:** nowe zgłoszenie, rezerwacja, przypomnienie o wystawieniu opinii, wygasające dokumenty.

**Wersja 2 i dalej:** powiadomienia push i SMS, mapa ofert, automatyczne dopasowanie kierowców, czat, płatności (Stripe Connect), faktury, aplikacja w sklepach (PWA, potem natywna), automatyczna weryfikacja DVLA, model B (payroll).

---

## 8. Technologia (propozycja)

- **Aplikacja webowa, mobile-first, jako PWA**: działa jak aplikacja na telefonie (ikona na ekranie, pełny ekran) bez App Store na start.
- **Next.js (React) + TypeScript**: jeden projekt na stronę główną, panel kierowcy, panel firmy i admina.
- **PostgreSQL** (np. Supabase albo Neon) i **Prisma**: baza danych.
- **Auth.js** lub Supabase Auth: logowanie.
- **Przechowywanie plików** (dokumenty): prywatny bucket S3 lub Supabase Storage, dostępny tylko dla admina.
- **Hosting:** Vercel. Domena drivemytruck.co.uk podpinana przez DNS.
- **E-mail:** Resend lub Postmark.
- Szacunkowy koszt utrzymania na starcie: **£0–30 miesięcznie** (darmowe plany), do kilkudziesięciu funtów przy pierwszych tysiącach użytkowników.

---

## 9. Lista rzeczy do zrobienia poza kodem

- [ ] Założenie **Ltd** (Companies House, ok. £50) i konta firmowego.
- [ ] Rejestracja w **ICO** (ochrona danych).
- [ ] **Regulamin, polityka prywatności, cookies.** Zastrzeżenie, że jesteśmy platformą łączącą strony.
- [ ] Konsultacja z prawnikiem (pkt 4).
- [ ] Ubezpieczenie PI i PL.
- [ ] Sprawdzenie i zastrzeżenie znaku „Drive My Truck” (UK IPO, ok. £170 za klasę).
- [ ] Ustalenia z Woolfe Digital co do **praw autorskich do logo i makiet** (na makietach jest „confidential draft / not for distribution”, więc trzeba mieć pewność, że prawa do logo przechodzą na Was).

---

## Źródła

- [HGV driver vacancies in the UK 2025 — gov.uk](https://www.gov.uk/government/statistics/road-freight-statistics-2025/heavy-goods-vehicle-driver-vacancies-in-the-united-kingdom-2025)
- [RHA — UK driver shortage hasn't gone away](https://www.rha.uk.net/news/news/detail/uk-driver-shortage-hasn-t-gone-away-it-s-just-been-hidden-new-figures-)
- [Trans.info — UK road freight statistics June 2026](https://trans.info/en/uk-road-freight-statistics-june-2026-driver-pay-vacancies-empty-running-2-513083)
- [Trans.info — 60,000 drivers wanted](https://trans.info/en/wanted-60-000-drivers-471678)
- [CILT — no way to track whether newly qualified HGV drivers find work](https://ciltuk.org.uk/news/no-way-to-track-whether-newly-qualified-hgv-drivers-can-find-work-in-the-uk/)
- [Trans.info — UK HGV agency driver rates](https://trans.info/en/uk-hgv-agency-driver-474348)
- [Staffline — HGV 1 Driver listing](https://www.staffline.co.uk/job/74521)
- [Avail Logistics](https://availlogistics.co.uk/) · [Avail — 20,000 users](https://availlogistics.co.uk/logistics-uk-approved-avail-driver-app-on-course-for-20000-registered-users/) · [Commercial Motor — Avail](https://www.commercialmotor.com/industry-news/article/sponsored-avail-logistics-creates-new-way-working-drivers) · [Fleet News — Logistics UK & Avail](https://www.fleetnews.co.uk/news/new-contracts/2021/02/08/logistics-uk-announces-partnership-with-avail)
- [ShiftOwt](https://shiftowt.com/) · [HGV Connect](https://hgv-connect.co.uk/) · [HGV Driver Hub](https://play.google.com/store/apps/details?id=com.queper.HGVDrivers&hl=en) · [Haulage Exchange](https://haulageexchange.co.uk/owner-drivers/haulage-contracts/)
- [Conduct Regulations 2003 — overview (gov.uk)](https://www.gov.uk/government/publications/conduct-regulations-2003-guidance-for-employment-agencies-and-employment-businesses/overview-of-the-conduct-regulations-2003)
- [TUC — worker status briefing](https://www.tuc.org.uk/sites/default/files/2026-02/workerstatusbriefing.pdf)
- [Osborne Clarke — Platform Operators Reporting Regulations](https://www.osborneclarke.com/system/files/documents/25/02/25/Guidance-note---Platform-Operators-Reporting-Regulations-07.01.25%28158064778.1%29.pdf)
- [gov.uk — View or share your driving licence](https://www.gov.uk/view-driving-licence) · [Check someone's driving licence](https://www.gov.uk/check-driving-information) · [DVLA Driver View API](https://developer-portal.driver-vehicle-licensing.api.gov.uk/apis/driver-view/driver-view-description.html) · [D888/1 form](https://www.gov.uk/government/publications/d8881-request-by-a-company-about-driver-entitlement)
