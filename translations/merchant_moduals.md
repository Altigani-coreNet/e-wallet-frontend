# Merchant portal — page map (sidebar and routes)

This document maps the **merchant** area of the Payment app: what appears in the **sidebar**, the **URLs** you get when you click each item, and **other `/merchant/*` routes** that exist in the router but are **not** linked from the sidebar.

Source files:

- Navigation UI: `Payment/src/components/layout/Sidebar.jsx`
- Route definitions: `Payment/src/App.jsx` (nested under `path="merchant"`)

English labels below match **`merchant.sidebar.*`** keys in `Payment/src/locales/en/app.json` (Arabic uses `Payment/src/locales/ar/app.json`).

---

## When you can see the full menu

- **`merchant.status`** must be **`approved`** (case-insensitive in the sidebar check).  
  If the account is **not** approved, the sidebar only shows **Profile**, **Logout**, and a status notice — not Dashboard, Payments, etc.

- The sidebar also shows a loading skeleton until the **merchant profile** has finished loading (`profileLoading` / `profileLoaded` in the auth store).

---

## Sidebar → URL (approved merchant)

| Sidebar label (i18n key) | Path |
|--------------------------|------|
| Logo (home) | `/merchant/dashboard` |
| **Dashboard** — `merchant.sidebar.dashboard` | `/merchant/dashboard` |
| **Payments** — `merchant.sidebar.payments` (accordion) | *(section header only)* |
| → **Transactions** — `merchant.sidebar.transactions` | `/merchant/transactions` |
| → **Refunded transactions** — `merchant.sidebar.refundedTransactions` | `/merchant/transactions?type=refunded` |
| → **Voided transactions** — `merchant.sidebar.voidedTransactions` | `/merchant/transactions?type=voided` |
| → **Batches** — `merchant.sidebar.batches` | `/merchant/batches` |
| → **Settlements** — `merchant.sidebar.settlements` (nested accordion) | *(section header)* |
| → → **Settlements** (same title as parent) | `/merchant/settlements` |
| → → **Settlement transactions** — `merchant.sidebar.settlementsTransactions` | `/merchant/settlements/transactions` |
| **Payment links** — `merchant.sidebar.paymentLinks` | `/merchant/payment-links` |
| **Developer settings** — `merchant.sidebar.developerSettings` (accordion) | *(section header)* |
| → **API keys** — `merchant.sidebar.apiKeys` | `/merchant/api-keys` |
| → **Webhook settings** — `merchant.sidebar.webhookSettings` | `/merchant/webhooks` |
| **Profile** — `merchant.sidebar.profile` | `/merchant/profile` |

**Logout** is not a page; it clears auth and navigates to `/login`.

---

## Pages you open *from* those sidebar entries (detail / sub-routes)

These URLs are **not** separate top-level sidebar rows; you reach them from lists, buttons, or direct links inside the app.

| Parent area | Example / pattern | Component role (from `App.jsx`) |
|-------------|-------------------|----------------------------------|
| Transactions | `/merchant/transactions/:id` | Transaction detail |
| Batches | `/merchant/batches/:id` | Batch detail |
| Settlements | `/merchant/settlements/:id` | Settlement detail |
| Payment links | `/merchant/payment-links/create` | Create payment link |
| Payment links | `/merchant/payment-links/:id` | Payment link detail |
| Payment links | `/merchant/payment-links/:id/edit` | Edit payment link |
| Payment links | `/merchant/payment-links/test/qr-code` | QR code test page |
| Webhooks | `/merchant/webhooks/create` | Create webhook |
| Webhooks | `/merchant/webhooks/:id/edit` | Edit webhook |

---

## `/merchant/*` routes **not** linked in the sidebar

You can still hit these paths if your **role permissions** allow them (many use `PermissionRoute` in `App.jsx`) or if something in the UI links to them internally.

| Path pattern | Notes |
|--------------|--------|
| `/merchant` | Index: **`MerchantDefaultRedirect`** (plan-based redirect, not a fixed screen). |
| `/merchant/plans` | Subscription / plans. |
| `/merchant/plan-limits-test` | Test page for plan limits. |
| `/merchant/payment-gateways` | Payment gateways list. |
| `/merchant/payment-gateways/:name` | View gateway. |
| `/merchant/payment-gateways/:name/edit` | Edit gateway. |
| `/merchant/branches` … | Branches CRUD (`/merchant/branches`, `create`, `:id`, `:id/edit`). |
| `/merchant/terminals` … | Terminals CRUD. |
| `/merchant/contracts` | Contract terms view. |
| `/merchant/service-fees` | Service fees list. |
| `/merchant/service-fees/:id` | Service fee detail. |
| `/merchant/users` … | Merchant users (`users`, `create`, `:id`, `:id/edit`). |
| `/merchant/user-groups` … | User groups CRUD. |
| `/merchant/customers` … | Customers CRUD. |

API keys and webhooks **are** in the sidebar under Developer settings; their create/edit paths are listed in the previous section.

---

## Permissions (high level)

Many merchant routes wrap components in **`PermissionRoute`** with specific permission keys (for example `pos.dashboard.view_dashboard`, `view_transactions`, payment-link permissions, etc.). If you lack permission, you may be blocked even though the URL exists.

**Developer settings:**

- **`/merchant/api-keys`** — rendered as **`ApiKeysIndex`** without a `PermissionRoute` wrapper in `App.jsx`.
- **`/merchant/webhooks`** — same for **`WebhooksIndex`**; create/edit routes use **`WebhookForm`**.

---

## Related: `/sales/*` (same authenticated layout, different product area)

Under the same **`MainLayout`** + **`ProtectedRoute`**, `App.jsx` defines a large **`/sales/...`** tree (dashboard, POS sale, products, inventory, reports, etc.). Those URLs are **not** defined in `Sidebar.jsx`; access is typically via other entry points (bookmarks, redirects, or in-app links).

---

## Quick reference — translation keys for sidebar strings

Use these keys under **`merchant.sidebar`** for i18n:

`logoAlt`, `profileNotLoaded`, `profileNotLoadedHint`, `retryProfile`, `merchantStatus`, `accountUnderReview`, `profile`, `logout`, `dashboard`, `payments`, `transactions`, `refundedTransactions`, `voidedTransactions`, `batches`, `settlements`, `settlementsTransactions`, `paymentLinks`, `developerSettings`, `apiKeys`, `webhookSettings`.
