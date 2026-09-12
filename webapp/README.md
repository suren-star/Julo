# Julo Web

Julo Web-ը նախագծերի և առաջադրանքների կառավարման առանձին վեբ հավելված է։ Այն չի օգտագործում Desktop տարբերակի Electron/Planer legacy code-ը։

## Այս beta հիմքում կա

- Kanban տախտակ՝ «Առաջադրանք / Ընթացքում / Ավարտված» կարգավիճակներով
- drag-and-drop կարգավիճակի փոփոխություն
- նախագծերի ստեղծում, վերանվանում, ջնջում և նախագծով ֆիլտրում
- «Այսօր», «Բոլոր առաջադրանքները» և «Ավարտված» դիտումներ
- որոնում
- առաջնահերթություն, պարտադիր կատարման ժամկետ, կատարման տեսակներ, պիտակներ և նկարագրություն
- առաջադրանքի մեկնաբանություններ՝ ըստ դերերի հասանելիությամբ
- առաջադրանքի timer՝ մեկ ակտիվ timer ամբողջ workspace-ում, ավտոմատ Pause switching-ով և կուտակված ժամանակի պահպանմամբ
- ավարտելիս timer-ի ավտոմատ Stop՝ առանց կուտակված ժամանակը զրոյացնելու
- Owner/Admin-ի կողմից «Ավարտված» → «Ընթացքում» վերադարձնելիս timer-ի վերականգնում Pause վիճակում
- light/dark թեմա
- local-first storage provider՝ versioned workspace schema-ով
- JSON backup export/import
- regression/security tests՝ workspace migration/import, permissions և timer state machine-ի համար
- CI security gate՝ dependency audit և source security checks
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
npm run security:check
npm test
npm run build
```

GitHub Pages deployment-ը ավտոմատ աշխատում է `main` ճյուղի `webapp/` փոփոխություններից հետո։
