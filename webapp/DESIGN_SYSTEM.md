# Julo Design System — Color Foundations

Այս փաստաթուղթը Julo webapp-ի գունային համակարգի source of truth-ն է։ Գործնական CSS tokens-ը գտնվում են `src/design-system.css` ֆայլում։

## Օգտագործման կանոն

Նոր UI-ում հնարավորության դեպքում **մի գրեք raw HEX արժեքներ component CSS-ում**։ Սկզբում օգտագործեք semantic token (`--bg`, `--panel`, `--text`, `--accent`, `--success`, `--warning`, `--danger`), իսկ նոր semantic token սահմանելու դեպքում այն կապեք palette token-ի հետ։

## Primary / Brand

| Token | HEX | Օգտագործում |
|---|---|---|
| `--julo-primary-50` | `#EEF2FF` | թեթև accent background |
| `--julo-primary-100` | `#E0E7FF` | ընտրված/hover բաց ֆոն |
| `--julo-primary-200` | `#C7D2FE` | dark mode accent text |
| `--julo-primary-300` | `#A5B4FC` | secondary accent |
| `--julo-primary-400` | `#818CF8` | focus/accent support |
| `--julo-primary-500` | `#5B5BD6` | **Julo հիմնական primary** |
| `--julo-primary-600` | `#4F46E5` | primary hover / strong accent |
| `--julo-primary-700` | `#4338CA` | pressed/strong state |
| `--julo-primary-800` | `#3730A3` | dark accent |
| `--julo-primary-900` | `#312E81` | deepest accent |

Logo gradient՝ `#7C3AED → #4F46E5`։

## Neutral

| Token | HEX | Հիմնական դեր |
|---|---|---|
| `--julo-white` | `#FFFFFF` | light panel/card |
| `--julo-neutral-25` | `#F8FAFC` | secondary light panel |
| `--julo-neutral-50` | `#F4F6F9` | light page background |
| `--julo-neutral-100` | `#EDF2F7` | dark theme text |
| `--julo-neutral-200` | `#E5E7EB` | light borders |
| `--julo-neutral-300` | `#C0C6D0` | subtle icon/drag |
| `--julo-neutral-350` | `#AAB2C0` | unchecked controls |
| `--julo-neutral-400` | `#9CA3AF` | secondary controls |
| `--julo-neutral-450` | `#929BAA` | dark muted text |
| `--julo-neutral-500` | `#8A94A3` | eyebrow/secondary label |
| `--julo-neutral-550` | `#6F7B8D` | sidebar secondary text |
| `--julo-neutral-600` | `#6B7280` | light muted text |
| `--julo-neutral-650` | `#64748B` | neutral status |
| `--julo-neutral-750` | `#2A3240` | dark borders |
| `--julo-neutral-800` | `#253044` | sidebar divider |
| `--julo-neutral-825` | `#202938` | sidebar border |
| `--julo-neutral-850` | `#1F2937` | sidebar hover |
| `--julo-neutral-875` | `#1A202B` | dark secondary panel |
| `--julo-neutral-900` | `#151A23` | dark panel |
| `--julo-neutral-925` | `#111827` | sidebar background |
| `--julo-neutral-950` | `#0E1117` | dark page background |
| `--julo-ink` | `#18212F` | primary light text |

## Success

| Token | HEX |
|---|---|
| `--julo-success-50` | `#ECFDF5` |
| `--julo-success-500` | `#10B981` |
| `--julo-success-600` | `#059669` |

Օգտագործում՝ ավարտված առաջադրանք, հաջող վիճակ, positive confirmation։

## Warning

| Token | HEX |
|---|---|
| `--julo-warning-50` | `#FFFBEB` |
| `--julo-warning-200` | `#FDE68A` |
| `--julo-warning-500` | `#F59E0B` |
| `--julo-warning-700` | `#92400E` |

Օգտագործում՝ «Ընթացքում», զգուշացում, ուշադրություն պահանջող non-destructive վիճակ։

## Danger

| Token | HEX |
|---|---|
| `--julo-danger-50` | `#FFF1F2` |
| `--julo-danger-200` | `#FECDD3` |
| `--julo-danger-400` | `#FDA4AF` |
| `--julo-danger-500` | `#E11D48` |
| `--julo-danger-700` | `#BE123C` |
| `--julo-danger-900` | `#3B1720` |

Օգտագործում՝ շտապ առաջնահերթություն, ժամկետանց առաջադրանք, validation error, destructive action։

## Semantic tokens

Սրանք պետք է լինեն component-ների հիմնական ընտրությունը։

| Semantic token | Light | Dark |
|---|---|---|
| `--bg` | `#F4F6F9` | `#0E1117` |
| `--panel` | `#FFFFFF` | `#151A23` |
| `--panel-2` | `#F8FAFC` | `#1A202B` |
| `--text` | `#18212F` | `#EDF2F7` |
| `--muted` | `#6B7280` | `#929BAA` |
| `--border` | `#E5E7EB` | `#2A3240` |
| `--accent` | `#5B5BD6` | `#5B5BD6` |
| `--accent-2` | `#4F46E5` | `#4F46E5` |
| `--success` | `#10B981` | `#10B981` |
| `--warning` | `#F59E0B` | `#F59E0B` |
| `--danger` | `#E11D48` | `#E11D48` |

## Sidebar

| Token | HEX |
|---|---|
| `--sidebar-bg` | `#111827` |
| `--sidebar-hover` | `#1F2937` |
| `--sidebar-border` | `#202938` |
| `--sidebar-text` | `#E5E7EB` |
| `--sidebar-muted` | `#8F9AAC` |

## UI state կանոններ

- **Primary CTA** → `--accent`, hover → `--accent-2`։
- **Success / ավարտված** → `--success`։
- **Warning / ընթացիկ** → `--warning`։
- **Danger / ժամկետանց / շտապ / destructive** → `--danger`։
- **Normal text** → `--text`, secondary text → `--muted`։
- **Card / modal / input surfaces** → `--panel` կամ `--panel-2`։
- **Borders** → `--border`։
- Dark/light mode component-ները չպետք է ունենան առանձին hardcoded base colors, եթե semantic token-ը բավարար է։

## Հետագա փոփոխությունների ընթացակարգ

1. Նախ որոշել՝ փոփոխությունը palette-ի՞, semantic token-ի՞, թե component-specific state-ի խնդիր է։
2. Եթե ամբողջ ապրանքում գույնը պետք է փոխվի՝ փոխել `src/design-system.css` token-ը։
3. Եթե միայն մեկ UI իմաստ է փոխվում՝ ստեղծել/փոխել semantic token, ոչ թե global palette-ը։
4. Raw HEX օգտագործել միայն բացառիկ component-specific իրավիճակում և փաստագրել այստեղ։
5. Յուրաքանչյուր մեծ theme փոփոխությունից հետո ստուգել light/dark, desktop/mobile և contrast/readability վիճակները։
