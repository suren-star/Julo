# Julo Web

Julo Web-ը նախագծերի և առաջադրանքների կառավարման առանձին վեբ հավելված է։ Այն չի օգտագործում Desktop տարբերակի Electron/Planer legacy code-ը։

## Այս beta հիմքում կա

- Kanban տախտակ՝ «Անելիք / Ընթացքում / Ավարտված» կարգավիճակներով
- drag-and-drop կարգավիճակի փոփոխություն
- նախագծերի ստեղծում, վերանվանում, ջնջում և նախագծով ֆիլտրում
- «Այսօր», «Բոլոր առաջադրանքները» և «Ավարտված» դիտումներ
- որոնում
- առաջնահերթություն, վերջնաժամկետ, պիտակներ և նկարագրություն
- light/dark թեմա
- local-first storage provider՝ versioned workspace schema-ով
- JSON backup export/import
- regression tests՝ workspace migration/import-ի համար
- դատարկ workspace՝ առանց demo/legacy տվյալների

## Live տարբերակ

GitHub Pages՝ https://suren-star.github.io/Julo/

## Գործարկում

```bash
npm install
npm run dev
```

## Ստուգում

```bash
npm test
npm run build
```

GitHub Pages deployment-ը ավտոմատ աշխատում է `main` ճյուղի `webapp/` փոփոխություններից հետո։
