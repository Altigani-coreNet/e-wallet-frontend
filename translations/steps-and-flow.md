# Localization: steps & flow (LTR / RTL, URLs, layout)

Professional runbook for this **Payment** React (Vite) app: how i18n is wired, how locale appears in the URL, and how **LTR vs Arabic RTL** is handled—including Metronic shell quirks (sidebar, header, gutters).

Use this document as **implementation steps** or paste the **Reusable prompt** section into a new chat when starting the same work on another codebase.

---

## 1. Packages to install

From the project root (`Payment/`):

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

**Roles:**

| Package | Role |
|--------|------|
| `i18next` | Core i18n (resources, language, events). |
| `react-i18next` | `useTranslation`, `Trans`, React bindings. |
| `i18next-browser-languagedetector` | Reads `localStorage` / `navigator`; syncs with `i18nextLng`. |

**Already declared in this repo** — see `package.json` `dependencies` for exact versions.

---

## 2. Bootstrap i18n in the app

1. **Create** `src/i18n/config.js` (or `.ts`):
   - Import JSON namespaces (e.g. `src/locales/en/app.json`, `src/locales/ar/app.json`).
   - Call `i18n.use(LanguageDetector).use(initReactI18next).init({ resources, fallbackLng, detection, … })`.
2. **Import config before the app tree** in `src/main.jsx`:

   ```js
   import './i18n/config'
   ```

3. **On language change**, update the **document** (see §5 RTL):
   - `document.documentElement.lang`
   - `dir` on `html` / `body` (or dedicated helpers)
   - Optional: toggle a body class (e.g. `app-i18n-rtl`) for CSS hooks.

---

## 3. Translation files (where strings live)

- **English:** `src/locales/en/app.json` (nested keys, e.g. `merchant.header.myProfile`).
- **Arabic:** `src/locales/ar/app.json` (same key structure).
- In components: `const { t } = useTranslation();` then `t('merchant.header.myProfile')`.

Keep keys **stable** across locales; only values change.

---

## 4. Locale in the URL (`/en/...`, `/ar/...`)

**Goal:** Merchant (and similar) routes live under **`/:lang/...`**, not only in `localStorage`.

**Supporting modules (this repo):**

| File | Purpose |
|------|---------|
| `src/i18n/localePaths.js` | `LOCALE_CODES`, `getStoredOrDefaultLocale`, `buildPrefixedPath`, `stripLocalePrefix`, `replaceLocaleInPathname`, `pathShouldSkipLocaleRedirect`. |
| `src/i18n/LocaleSyncOutlet.jsx` | Child of `/:lang`. If segment is not a known locale, redirect to prefixed path; else `i18n.changeLanguage(lang)`. |
| `src/i18n/RootLangRedirect.jsx` | `/` → `/${storedOrDefaultLocale}`. |
| `src/i18n/LocalizedNavigate.jsx` | `<Navigate>` relative to current `/:lang` (inner redirects). |
| `src/hooks/useLocalePrefix.js` | `const p = useLocalePrefix();` → `p('/merchant/profile')` → `/en/merchant/profile` or `/ar/...`. |

**Router habits:**

- Keep **public / admin / login** routes **without** a locale prefix if that matches product requirements (this app does for `/login`, `/admin`, etc.—see `pathShouldSkipLocaleRedirect`).
- Nested merchant routes: `path="/:lang"` → `LocaleSyncOutlet` → `path="merchant/..."`.
- **Every** user-facing `<Link>` / `navigate()` to prefixed areas should use **`p('/path')`** or `buildPrefixedPath(...)` so the bar shows `/en/...` or `/ar/...`.
- **Active route checks:** compare `stripLocalePrefix(location.pathname)` to logical paths like `/merchant/dashboard`, not the raw pathname.

**Language switcher:** after `changeLanguage`, if URL matches `^/(en|ar)(/|$)`, `navigate(replaceLocaleInPathname(pathname, code))` so the first segment updates (see `LanguageSwitcher.jsx`).

---

## 5. RTL vs LTR (especially Metronic / fixed sidebar)

### 5.1 What `dir="rtl"` does *not* fix

`dir="rtl"` flips **many** logical things (flex start/end, text direction). It does **not** automatically flip **physical** layout from a theme built for LTR:

- `position: fixed; left: 0` on the sidebar stays on the **screen left** until overridden.
- Theme **margins** on `.app-main` are often **`margin-left`** for a left sidebar; for Arabic you need a **right** gutter instead.

### 5.2 Document + shell hooks (this app)

- **`src/i18n/config.js`** — `applyDocumentLanguage`:
  - Sets `document.documentElement.lang` to `en` | `ar`.
  - Sets direction via `applyDocumentDirection` in `rtlStylesheets.js` (`html`/`body` `dir` and attributes).
  - Toggles **`body.app-i18n-rtl`** for Arabic.
  - Optionally loads Metronic RTL CSS bundles if files exist (`applyMetronicRtlStylesheets`).
- **`MainLayout.jsx` / `AdminLayout.jsx`** — when `i18n.dir() === 'rtl'`:
  - Add class **`app-layout-ar`** on `#kt_app_root`, `#kt_app_page`, and **`#kt_app_wrapper`**.
  - Set **`dir={layoutDir}`** on those nodes where needed so flex flows correctly.

### 5.3 CSS mirror rules (`src/components/layout/MainLayout.css`)

Under **`#kt_app_root.app-layout-ar`**, **desktop** (`min-width: 992px`):

1. **Wrapper row:** Metronic uses **`.flex-column` with `!important`**. Force **`flex-direction: row !important`** on `#kt_app_wrapper`, then use **`order`** so **`#kt_app_main`** is **`order: 1`** (content left) and **`#kt_app_sidebar`** is **`order: 2`** (sidebar right).
2. **Sidebar:** `left: auto !important; right: 0 !important` (fixed strip on the **viewport right**).
3. **Header (fixed):** **`left: 0`**, **`right: var(--bs-app-sidebar-width)`** — header spans the band **above** the main column, not over the sidebar. Use **physical** `left`/`right` here; logical `inset` can confuse if the header has its own `dir`.
4. **Main gutter:** **`margin-left: 0 !important`**, **`margin-right: var(--bs-app-sidebar-width)`** — **physical** `margin-right` so the gutter stays on the **right** next to the sidebar. If `#kt_app_wrapper` has `dir="rtl"`, **`margin-inline-end` would apply on the wrong side**, so prefer **`margin-right`** for this gutter.
5. **Wrapper cleanup:** `margin-inline: 0; padding-inline: 0` on the Arabic wrapper so theme LTR padding does not **double** the gutter.
6. **Minimized sidebar:** adjust `right` / `margin-right` with `--bs-app-sidebar-width-actual-minimize`.

### 5.4 Toolbar / breadcrumbs

- **`Toolbar.jsx`:** `dir={i18n.dir()}` on `#kt_app_toolbar` and `#kt_app_toolbar_container` so `flex-stack` mirrors title vs actions.
- Do **not** combine **`flex-direction: row-reverse`** on that row with **`dir="rtl"`** without checking—it can cancel the mirror.
- Breadcrumbs: build paths with `useLocalePrefix`; strip locale for default crumb segments via `stripLocalePrefix`.

### 5.5 Header / profile menu UX

- **Merchant `Header.jsx`:** `dir={isRtl ? 'rtl' : 'ltr'}` on `#kt_app_header` for shell alignment; inner icon clusters may keep `dir="ltr"` where icon order must stay stable.
- **User dropdown:** align with **Language** row using Metronic pattern: `menu-link … d-flex align-items-center`, **`menu-icon`** (Keenicons / `ki-duotone`), **`menu-title flex-grow-1`** (profile, upgrade, sign-out with icons).

---

## 6. Arabic font (Cairo)

1. **`index.html`:** Google Fonts preconnect + stylesheet for **Cairo** (variable weight).
2. **`src/index.css`:** For `html[lang='ar']` set Bootstrap CSS variables (`--bs-body-font-family`, `--bs-font-sans-serif`) and `body.app-i18n-rtl` font stack.
3. **`MainLayout.css`:** `#kt_app_root.app-layout-ar …` font-family **Cairo** — overrides an older rule that forced system fonts on `.app-layout-ar`.

---

## 7. Verification checklist

- [ ] Switch EN ↔ AR: **URL** updates on prefixed routes; **no** stale `/merchant/...` without locale on inner navigation.
- [ ] **Desktop Arabic:** sidebar **right**, main **left**, **single** right gutter (no double empty band).
- [ ] **Header** width respects sidebar; **toolbar** title/actions mirrored.
- [ ] **Cairo** in computed styles for Arabic body/shell text.
- [ ] **Login / admin** behavior unchanged if those routes stay unprefixed by design.

---

## 8. Reusable prompt (copy for another project / chat)

Use this block when you want an assistant to reproduce the same architecture:

```text
Implement React (Vite) localization with:

1) Packages: i18next, react-i18next, i18next-browser-languagedetector. Import i18n config in main entry before App.

2) Locales: JSON per language under src/locales/{en,ar}/ with matching keys; init i18n with LanguageDetector (localStorage key i18nextLng).

3) On languageChanged: set document.documentElement.lang, html/body dir ltr|rtl, optional body class app-i18n-rtl; re-init layout JS if needed.

4) URL locale prefix: routes under /:lang (en|ar) with an outlet that validates lang, syncs i18n, and redirects unprefixed paths to /{locale}/path. Root / redirects to stored/default locale. Provide buildPrefixedPath, stripLocalePrefix, replaceLocaleInPathname; hook useLocalePrefix() for all Link/navigate to app paths inside /:lang. Keep login/admin/public paths unprefixed if required—centralize skip list.

5) RTL layout for Metronic-like shell: do not rely on dir=rtl alone. For Arabic desktop: force app-wrapper flex row; order main before sidebar visually (main left, fixed sidebar right); sidebar right:0 left:auto; header physical left:0 right:sidebarWidth; main physical margin-right sidebar width and margin-left 0; clear wrapper margin/padding that assumed LTR. Avoid margin-inline-end on main when wrapper dir=rtl—use margin-right for the sidebar gutter.

6) Toolbar: set dir from i18n on toolbar container; do not double row-reverse with rtl.

7) Arabic font: load Cairo from Google Fonts; set --bs-body-font-family and body/app-layout-ar font stacks.

8) Header user menu: menu-link rows with menu-icon + menu-title flex-grow-1 consistent with language submenu.
```

---

## 9. Key files index (this repository)

| Area | Paths |
|------|--------|
| i18n init | `src/i18n/config.js`, `src/i18n/rtlStylesheets.js` |
| URL helpers | `src/i18n/localePaths.js`, `src/i18n/LocaleSyncOutlet.jsx`, `src/i18n/RootLangRedirect.jsx`, `src/i18n/LocalizedNavigate.jsx` |
| Prefix hook | `src/hooks/useLocalePrefix.js` |
| Layout / RTL CSS | `src/components/layout/MainLayout.jsx`, `MainLayout.css` |
| Admin parity | `src/components/admin/layout/AdminLayout.jsx`, `AdminHeader.jsx` |
| Language UI | `src/components/common/LanguageSwitcher.jsx` |
| Strings | `src/locales/en/app.json`, `src/locales/ar/app.json` |
| Fonts | `index.html`, `src/index.css` |

---

*Last aligned with the Payment app’s Metronic-based merchant shell: locale-prefixed routes, physical margin/position mirroring for RTL, Cairo for Arabic, and icon-aligned header menu rows.*
