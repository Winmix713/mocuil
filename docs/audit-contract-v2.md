# Winmix: számítási szerződés és első javítási csomag

Dátum: 2026-10-10. Alap: `Winmix713/opoik`, `7d2129344e29199df5ad291ec8e547e51457318e`.

Ez a dokumentum a történeti párosítás-elemző javításait rögzíti. A HT- és FT-minták önállók; a felület, a worker és a CSV ugyanazt az eredményérvényesítést használja. A változtatás frontendkódot, teszteket és dokumentációt érint. Adatbázis-migrációt, adatírást és új előrejelző modellt nem tartalmaz.

## 1. Eredmények besorolása

Egy időszak eredménye két csapat gólszámából áll. A HT és az FT egymástól függetlenül kap státuszt.

| Státusz | Feltétel | Példa |
|---|---|---|
| `valid` | Mindkét érték nemnegatív, biztonságosan ábrázolható egész szám (`Number.isSafeInteger`) | `0–0`, `2–1` |
| `missing` | Mindkét érték `null` vagy hiányzó mező | `null/null` |
| `invalid` | Minden más eset, a részlegesen hiányzó eredményt is beleértve | `0/null`, `-1/0`, `"1"/"0"`, tört szám |

A `0–0` érvényes megfigyelés. Nincs szöveg–szám átalakítás, hiánypótlás vagy automatikus eredményjavítás. A jelen szerződés nem vezet be külön futballszakmai gólszámplafont.

A hibás numerikus értékek normalizáláskor `null` értékre váltanak, de a külön `ftStatus` és `htStatus` megőrzi, hogy a forrás hibás volt. Így egy hibás HT nem kerül át a hiányzó HT számlálójába. A szezon hibajegyzéke az érintett pozíciót és eredeti eredményértékeket is rögzíti.

## 2. Mutatók és nevezők

| Mutatócsalád | Bekerülési feltétel | Riport nevezője | Párok CSV nevezője |
|---|---|---|---|
| FT kimenet, pontos állás, gólátlag, góleloszlás, BTTS, gólvonal, kapott gól nélküli eredmény | Érvényes FT | `ftValid` | `valid_ft_n` |
| HT kimenet, pontos állás, gólátlag, góleloszlás, BTTS, gólvonal | Érvényes HT, az FT státuszától függetlenül | `htValid` | `valid_ht_n` |
| Megfigyelt HT→FT kimenet- és állásváltás | Érvényes HT ÉS érvényes FT | `htftValid` | `valid_htft_n` |
| Második félidős mutatók; melyik félidőben volt több gól | Mindkét eredmény érvényes, és csapatonként FT ≥ HT | `secondHalfValid` | `valid_second_half_n` |

Az ellentmondó HT/FT párt a `periodConsistency: "inconsistent"` jelöli; számlálója `htftInconsistent`. Az önálló HT/FT leíró statisztikák és a megfigyelt állásváltások megtartják, a második félidős számítások kizárják. Az átmenetek ezért **megfigyelt forrásállapotokat**, nem kizárólag fizikailag lehetséges góltörténeteket jelentenek. A felület külön jelzi az ellentmondást.

Ha az egyik időszak nem érvényes, a konzisztencia `unavailable`; mindkét érvényes és összehasonlítható időszaknál `consistent`. A konzisztenciát csapatonként kell ellenőrizni: az összgólok összevetése önmagában nem elég.

| FT | HT | FT-minta | HT-minta | HT→FT | Második félidő |
|---|---|---:|---:|---:|---:|
| hiányzik | 1–0 | 0 | 1 | 0 | 0 |
| 2–1 | hiányzik | 1 | 0 | 0 | 0 |
| 1–1 | hibás | 1 | 0 | 0 | 0 |
| 1–1 | 3–0 | 1 | 1 | 1 | 0 |
| 0–0 | 0–0 | 1 | 1 | 1 | 1 |

A gyakoriság `darabszám / saját érvényes mintaszám`. Üres minta esetén az eloszlások és gólvonalak üres listák, az átlagok `null` értékűek; a felület hiányjelzést mutat. A top-3 lista arányai továbbra is a teljes érvényes mintához viszonyítanak. A hazai és vendég kapott gól nélküli események átfedhetnek (például 0–0 esetén); ezek arányait nem kell 100%-ra összegezni.

## 3. Számlálók és szűrési hatókör

Az audit, liga, szezon, rendezett csapatpár, páron belüli szezon és mérkőzéspozíció szintjén ugyanazok a számlálók szerepelnek:

`ftValid`, `ftMissing`, `ftInvalid`, `htValid`, `htMissing`, `htInvalid`, `htftValid`, `htftInconsistent`, `secondHalfValid`.

A feldolgozható rekordok körében:

```text
ftValid + ftMissing + ftInvalid = feldolgozható rekordok száma
htValid + htMissing + htInvalid = feldolgozható rekordok száma
htftValid = secondHalfValid + htftInconsistent
```

Az audit `matchCount` és a szezon `matches` mezője a forrássorokat számolja. A nem objektum típusú sorok és a hiányzó csapatnevű rekordok kimaradnak az elemzésből; számukat a riport és a szezon `skippedRecords` mezője mutatja. Így az auditban `matches.length + skippedRecords = matchCount`. A párok `matches` és pozíciók `observations` mezője már a feldolgozható rekordokra vonatkozik.

| Nézet / művelet | Hatókör |
|---|---|
| Áttekintés | A kiválasztott liga vagy mindkét liga |
| Adatminőség | A kiválasztott ligák szezonjai; az FT számláló is ebből a körből származik |
| Párosítás összesítő kártyái | A kiválasztott rendezett hazai–vendég pár teljes története |
| Párosítás előfordulástáblája | A pár története, majd szezon-, forduló- és keresési szűrés |
| Pozícióelemzés | Kiválasztott liga/forduló/hely; külön FT és HT→FT mintaszám minden sorban |
| CSV / JSON export | A teljes elkészült audit; nem az aktuális táblázatszűrés |

Az előfordulástábla szűrői nem módosítják a pár összesítő kártyáit. Ez a kézikönyvben rögzített működés maradt érvényben.

## 4. Export és kompatibilitás

Az audit JSON új mezői:

```json
{
  "reportSchemaVersion": 2,
  "scoreContractVersion": "2.0.0"
}
```

Ez az **audit riport** verziója; a forrásarchívum manifesztjének `schemaVersion: 3` mezője másik sémát azonosít.

A Meccsek CSV végére kerül: `ht_status`, `ft_status`, `period_consistency`, `score_contract_version`, `report_schema_version`. A hibás eredmény szövege „HT érvénytelen” / „FT érvénytelen”; a hiányzó eredmény továbbra is külön jelzés.

A Párok CSV végére kerül: `valid_htft_n`, `invalid_ht_n`, `missing_ft_n`, `invalid_ft_n`, `inconsistent_htft_n`, `score_contract_version`, `report_schema_version`. A `season_occurrences_json` minden szezonhoz tartalmazza az új mintaszámlálókat is. A `missing_ht_n` csak a valóban hiányzó HT-t számolja.

A korábbi CSV-oszlopok sorrendje megmarad, az új oszlopok a végére kerülnek. A formátum továbbra is UTF-8 BOM, vesszőelválasztás, idézett cellák és CRLF sorvég. A rögzített oszlopszámot elváró külső importálókat bővíteni kell; a JSON-t feldolgozó fogyasztók a riport- és számítási verziót is ellenőrizzék. A hibás adatoknál megváltozott nevezők szándékos javítások.

## 5. Futásvezérlés és hibák

- Az állapotok: `idle`, `running`, `completed`, `cancelled`, `failed`.
- Minden worker-parancs és esemény `runId` azonosítót kap. Korábbi vagy már lezárt futás üzenete nem írhatja felül az aktuális állapotot.
- A manifest és a szezonletöltések megszakíthatók. A felület leállítja az adott workert, így a szinkron összesítés közben is megszakítható a munka.
- 100% csak a teljes riport átvétele után látszik. Megszakítás és hiba nem jelenik meg sikeres befejezésként.
- Az utolsó elkészült riport újrafuttatás, megszakítás vagy hiba esetén megmarad, „Előző sikeres audit” jelöléssel. Félkész riport nem válik exportálhatóvá.
- Adatminőségi eltérés mellett a feldolgozás befejeződhet, de a befejezési jelzés ezt külön megnevezi. Fájlméret-, SHA-1-, olvasási vagy JSON-feldolgozási hiba leállítja a futást.
- A Supabase diagnosztika megőrzi a strukturált hiba `message`, `code`, `details`, `hint` mezőit. A felület a kódot és üzenetet megjeleníti. A diagnosztika továbbra is csak olvasás.

## 6. Érintett modulok

| Fájl | Feladat |
|---|---|
| `src/score-validation.ts` | Közös érvényesítés, konzisztencia, számlálók és verzió |
| `src/pair-analysis.ts` | Önálló FT/HT számítás; közös HT→FT és konzisztens második félidős minta |
| `src/audit.worker.ts` | Ugyanazon szabályok alkalmazása minden összesítési szinten; hibaállapotok |
| `src/audit-state.ts` | Tesztelhető futásállapot és elavult üzenetek kizárása |
| `src/audit-export.ts` | Tesztelhető CSV-szerializálás a meglévő párelemzővel |
| `src/App.tsx`, `src/styles.css` | Helyes nevezők, ligaszűrés, futás- és adatminőségi jelzések |
| `src/error-details.ts`, `src/supabase.ts` | Strukturált integrációs hibák megőrzése |
| `src/types.ts` | Verziózott riport és közös mintaszámlálók típusai |

## 7. Automatizált ellenőrzések

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
pnpm test:archive
```

A tesztek a Node beépített tesztfuttatóját és a projekt meglévő TypeScript fordítóját használják, új csomagfüggőség nélkül. A helyi worker-tesztek a tényleges `src/audit.worker.ts` kódot futtatják Node worker-szálban, szabályozott `fetch` bemenettel. A fordítás típusellenőrzését külön a `pnpm check` végzi.

| Tesztterület | Ellenőrzés |
|---|---|
| Eredményérvényesítés | HT FT nélkül; 0–0; hiányzó/részleges/hibás értékek; negatív, szöveges, tört és nem véges szám |
| Mutatók | HT→FT közös nevező; ellentmondó álláspár; második félidő; üres minták |
| Összesítések és export | Hibás bemenet mellett worker/pár/pozíció/szezon/CSV egyezés; ligák elválasztása; kihagyott hibás sor |
| Futásvezérlés | Megszakítás után érkező befejezés; régi futás üzenetei; korábbi riport megőrzése; 100%-os állapot |
| Letöltés és integritás | Manifest- és szezonletöltés abortálása; hibás Git-blob SHA-1 esetén nincs kész riport |
| Diagnosztika | Supabase hiba kódjának, üzenetének, részleteinek és javaslatának megőrzése |

A `pnpm test:archive` referenciája a `tests/fixtures/archive-reference.json` fájlban van, és kizárólag ehhez a forráscommithez tartozik:

`Winmix713/tertpea@bf019ab7460994c7523cb70518f0e07c5d104c81`

| Referencia | Angol | Spanyol | Összesen |
|---|---:|---:|---:|
| Szezon | 62 | 41 | 103 |
| Mérkőzés / érvényes FT | 14 880 | 9 840 | 24 720 |
| Érvényes HT | 9 360 | 9 840 | 19 200 |
| Hiányzó HT | 5 520 | 0 | 5 520 |
| Rendezett csapatpár | 240 | 240 | 480 |

Összes forrásméret: **92 923 498 bájt**. Az archívumon az érvényes HT→FT és második félidős minta egyaránt **19 200**. A hiányzó/hibás FT, hibás HT, ellentmondó HT/FT, kihagyott rekord, checksum-hiba és szezonhibajegyzék számlálója **0**.

A regresszió előbb ellenőrzi a commitazonosítót és a fájl-URL-ek rögzítését, majd minden fájl méretét és Git-blob SHA-1 értékét. Végül összeveti a referenciaösszegeket, és mind a 480 pár FT/HT→FT eloszlását és mintaszámát a részletes elemzővel. Más forráscommit új, külön felülvizsgált referenciát igényel; a teszt nem írja át automatikusan az elvárt értékeket.

A cache helye alapértelmezetten `.cache/winmix-archive`, a `WINMIX_ARCHIVE_CACHE` változóval felülírható. Az első futás hálózatot és kb. 93 MB letöltést igényel. A meglévő cache fájljai is minden alkalommal integritásellenőrzést kapnak.

## 8. Ellenőrzési eredmény és fennmaradó határok

A javítási csomag ellenőrzése 2026-10-10-én, Node.js 24.19.0 / pnpm 11.25.0 környezetben:

- 20/20 automatizált helyi teszt sikeres.
- A teljes 103 fájlos, 24 720 mérkőzéses referenciaellenőrzés sikeres; 480/480 párosítás egyezett.
- TypeScript típusellenőrzés és production build sikeres.
- Böngészős végponttól végpontig teszt és mobilos vizuális ellenőrzés nem történt. A futásvezérlés logikáját és a worker megszakítását automatizált teszt ellenőrzi, a teljes felületet kiadás előtt böngészőben is ellenőrizni kell.

A következő csomagok feladata marad a mentett audit, a felületen megnyitható részletes hibajegyzék, a mobilos finomítás, valamint a szerkezeti validáció további szigorítása (önmaga elleni csapat, fordulón belüli csapatismétlődés és pontos fordulólétszám). A jelenlegi szerkezeti ellenőrzés ezek teljes körű vizsgálatát még nem jelenti.

A Supabase-panel korábbi 2 szezon / 480 mérkőzés szövege történeti állapotjelzés; ez a csomag nem igazolt új élő adatbázis-állapotot.

## 9. A csomag beépítése

A `winmix-audit-fix-v2.zip` a teljes frissített forráskódot tartalmazza `opoik/` gyökérmappában, tesztekkel és dokumentációval. Új mappába kicsomagolva az `opoik` könyvtárból futtathatók a 7. pont parancsai. A ZIP nem tartalmaz telepített függőségeket, titkos környezeti beállításokat vagy a 93 MB-os forrásarchívumot.

A `winmix-audit-fix-v2.patch` az előbb megnevezett `7d2129344e29199df5ad291ec8e547e51457318e` alkalmazáscommithez készült. A saját, tiszta munkafád gyökerében, a patch-fájlt oda másolva:

```bash
git switch -c fix/audit-score-contract
git apply --check winmix-audit-fix-v2.patch
git apply winmix-audit-fix-v2.patch
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
pnpm test:archive
```

Ha a `git apply --check` eltérést jelez, a célrepo közben változhatott; a javítást az aktuális verzióhoz kell illeszteni. A csomag elkészítése önmagában nem jelent GitHub-push-t vagy éles telepítést.
