# Payment success & error — how layout scales (fonts, padding, height)

This is a short guide to **where** and **how** you control typography, spacing, and vertical fit on:

- `src/pages/PaymentSuccess.jsx` + `src/pages/PaymentSuccess.css`
- `src/pages/PaymentError.jsx` + `src/pages/PaymentError.css`

The idea is the same on both pages: **one “design token” layer**, then **width breakpoints**, then **height breakpoints**.

---

## 1. Design tokens (CSS variables) — start here

### Payment success (`.ps-page.ps-success-page`)

In `PaymentSuccess.css`, the success shell defines variables such as:

| Variable | Typical use |
|----------|----------------|
| `--ps-font-base` | Default body text on the page |
| `--ps-font-label` | Labels in key/value rows |
| `--ps-font-title` | Panel titles |
| `--ps-font-hero-amt` | Large amount in the hero |
| `--ps-space-card` | Padding inside white cards (`.ps-panel`) |
| `--ps-space-gap` | Gap between grid blocks / columns |
| `--ps-radius` | Card corner radius |

**Rule:** child components use `font-size: var(--ps-font-…)` and `padding: var(--ps-space-card)` so you can **change one variable** and many elements move together.

### Payment error (`.pe-page.pe-result-page`)

In `PaymentError.css`, the same idea uses **`--pe-*`** tokens, for example:

| Variable | Typical use |
|----------|----------------|
| `--pe-h1`, `--pe-h2`, `--pe-lead` | Headings and intro copy |
| `--pe-detail` | Detail rows |
| `--pe-note-size` | Note boxes |
| `--pe-btn-h`, `--pe-btn-font` | Buttons |
| `--pe-card-pad-y`, `--pe-card-pad-x`, `--pe-card-gap` | The white card |
| `--pe-card-max-w` | Max width of the error card (keeps it from stretching too wide) |
| `--pe-icon-wrap`, `--pe-icon-svg` | Error icon circle and icon size |

**To tweak fonts globally on that page:** edit the `--ps-*` or `--pe-*` values on the page root class in the **base** (non-media-query) block first.

---

## 2. Width — `min-width` / `max-width` media queries

These react to **how wide the window is** (tablet, desktop, small phone).

Examples in `PaymentSuccess.css`:

- **`@media (min-width: 901px)`** — slightly tighter grid, smaller QR wrap, adjusted main padding.
- **`@media (max-width: 900px)`** — single column; hero card hidden (summary-first layout).

Examples in `PaymentError.css`:

- **`@media (min-width: 768px)`**, **`(min-width: 901px)`**, **`(min-width: 1100px)`** — more horizontal room for the shell.
- **`@media (max-width: 640px)`** — mobile: overrides many `--pe-*` tokens (smaller type, tighter card).

**Rule:** use width media queries for **layout** (columns, max-width of main) and for **phone vs desktop** feel.

---

## 3. Height — `max-height` media queries (short screens)

Short viewports (kiosk, laptop with small vertical space, browser zoom) use **three bands** in `PaymentSuccess.css` (and mirrored for error in `PaymentError.css`):

| Viewport height | Approx. intent |
|-----------------|----------------|
| **≤ 900px** | First step down: smaller fonts, less padding, shorter hero / skeleton |
| **≤ 720px** | Tighter again |
| **≤ 600px** | Strongest compression; goal is to reduce overflow |

Inside each block you will see overrides such as:

- `main.pl-main.pl-main--result.ps-success-layout { padding: … }` — space **under the header** and around content.
- `.ps-page.ps-success-page { --ps-font-* … }` — **font scale** for that height band.
- Hero / QR / buttons — **smaller min-heights and padding** so the stack fits.

**Rule:** if text or cards overflow **vertically**, adjust the **`max-height: 900px`** block first, then 720, then 600.

---

## 4. Main column vs inner page (padding map)

### Success

- **Outer shell:** `main.pl-main.pl-main--result.ps-success-layout`  
  Controls **distance from the blue header** and side margins (including `clamp(...)` and safe-area on the bottom).

- **Inner grey area + cards:** `.ps-page.ps-success-page`  
  Own padding plus the **`--ps-*`** tokens used by panels.

### Error

- **Outer:** `main.pl-main.pl-main--result.pe-result-layout`
- **Inner:** `.pe-page.pe-result-page` + **`--pe-*`** on the card

**Rule:** “more air under the header” → increase **top** padding on **`main…ps-success-layout`** or **`main…pe-result-layout`**, not only the card.

---

## 5. Payment success only — QR size (JSX)

In `PaymentSuccess.jsx`, the QR code size is **`qrSize` state** updated on `resize`. It picks a base size from **width**, then **caps** by **height** (e.g. shorter windows get a smaller QR).

**Rule:** if the QR is too big on short screens, lower the caps in that `resize` handler; if it is too small on desktop, adjust the width branches.

---

## 6. Footer & small width

`PaymentCheckoutFooter` lives in `src/components/payment-links/PaymentCheckoutChrome.jsx`.  
On **narrow width** (`max-width: 640px` in `PaymentLinkRedirect.css`), the **Cancel** control is **hidden** so only “Powered by” + domain show.

---

## 7. Arabic

- Success: `ps-page--ar` on the page root (from `PaymentSuccess.jsx` + `i18n.language`).
- Error: `pe-result-page--ar` on `PaymentError.jsx`.

Fonts for RTL are set in the same CSS files on those modifier classes.

---

## Quick “what do I edit?” checklist

| Goal | Where |
|------|--------|
| Bigger/smaller type everywhere on success | `--ps-font-*` on `.ps-page.ps-success-page` in `PaymentSuccess.css` |
| Tighter cards / gaps on success | `--ps-space-card`, `--ps-space-gap`, `--ps-radius` |
| Short screen overflow on success | `@media (max-height: 900px / 720px / 600px)` in `PaymentSuccess.css` |
| Error card width | `--pe-card-max-w` on `.pe-page.pe-result-page` in `PaymentError.css` |
| Error typography / padding | `--pe-*` tokens + same height blocks in `PaymentError.css` |
| Space below header (both pages) | Top padding on `main.pl-main.pl-main--result.ps-success-layout` or `…pe-result-layout` |
| QR only | `resize` logic in `PaymentSuccess.jsx` |

This keeps **one mental model:** tokens on the page root → width media → height media → (success only) QR in JS.

---

## 8. Merchant login (`merchantLogin.css`)

The merchant sign-in page uses the **same pattern** with **`--ml-*`** tokens on **`.ml-root`**:

| Variable | Typical use |
|----------|-------------|
| `--ml-font-base` | Form body, inputs, primary button |
| `--ml-font-label` | Field labels, links, Google row |
| `--ml-font-title` | Card title |
| `--ml-font-hero` | Aside headline |
| `--ml-font-sub` | Card subtitle, footer line |
| `--ml-font-feature-title` / `--ml-font-feature-desc` | Feature list |
| `--ml-space-card` | White card (`.ml-card`) padding |
| `--ml-space-gap` | Feature rows, feature icon row gap |
| `--ml-space-section` | Vertical rhythm (logo → headline, list margins) |
| `--ml-space-shell-x` / `--ml-space-shell-y` | Aside outer padding |
| `--ml-space-main-x` / `--ml-space-main-y` | Form column padding + safe-area bottom |
| `--ml-radius` | Card radius |
| `--ml-radius-control` | Inputs, buttons, alerts |

- **Outer column:** **`.ml-shell`** — `max-width: min(1280px, calc(100% - clamp(12px, 4vw, 28px)))`, centered like the payment result `main` shell.
- **Width:** `@media (max-width: 640px)` tightens hero/card tokens; `@media (min-width: 901px)` slightly widens the shell cap.
- **Height:** `@media (max-height: 900px | 720px | 600px)` on **`.ml-root`** overrides the same `--ml-*` groups (shorter screens = smaller type and tighter spacing).
- **Phone layout (`max-width: 991.98px`):** **`.ml-root::before`** uses **`/small_screen.jpeg`** (mobile art); **`≥992px`** keeps **`/login_background.png`** with horizontal flip. **`.ml-mobile-marketing`** (below the sign-in card) repeats the three feature columns + trust strip; it is **hidden on desktop** where the left **`.ml-aside`** shows the same content.

**To tweak:** edit the **base** `--ml-*` block on **`.ml-root`** first; use height bands only when fixing vertical overflow. Mobile background file path is duplicated in CSS (`merchantLogin.css`) and in **`APP_ASSETS.layout.merchantLoginBackgroundMobile`** (`appAssets.js`) — keep them in sync if you rename the asset.
