# E2E Status Report

Last updated: 2026-06-30

## Wallet transfer OTP workflow (E2E)

Customer transfers now require a two-step API flow (mirrors Postman **Wallet** folder):

1. `POST /api/v1/customer/wallet/transfer/otp` — same payload as transfer (recipient, amount, description, note, optional `Idempotency-Key`)
2. `POST /api/v1/customer/wallet/transfer` — same payload + `otp_token` + `otp`

**Cypress:** `cy.apiWalletTransfer()` handles both steps automatically. Mock OTP defaults to **`111111`** via `otpMockCode` in `cypress/environments.js` (must match backend `OTP_MOCK_CODE`).

**Direct OTP step:** `cy.apiWalletTransferOtp({ token, recipientWalletId, amount, ... })`

**Chaos / raw validation:** `cy.apiWalletTransferRaw()` still posts directly to `/transfer` (expects 422 when `otp_token` / `otp` missing).

**Wallet-accounting folder:** successful transfers use `cy.apiWalletTransfer()`; `19-transfer-otp.cy.js` covers OTP issue, payload mismatch, mock `111111`, and single-use OTP.

## Baseline (full suite, pre–Category C fixes)

**38 specs · 72 tests · ~21 min**

| Result | Count |
|--------|-------|
| Passing | 35 |
| Failing | 27 |
| Skipped | 10 |
| Failed specs | **25 / 38 (66%)** |

---

## Done

### Infra / speed

- Removed hardcoded Cypress delays (`cy.wait(3000)`, `delay: 30`)
- Set `apiRequestDelayMs: 0` in `cypress/environments.js`
- Fixed Windows Cypress runner (`cypress/scripts/run.mjs` — `shell: false`)
- Removed DB seeder dependency from E2E (`seedWalletE2e` task + calls)

### Category C — transfer fees (mostly fixed)

- Added `walletTransferFee: 2` and helpers (`configuredTransferFee`, `transferRecipientNet`, `chaosPayloadKeySlug`, etc.)
- Updated fee-aware specs and accounting assertions

**Category C re-run: 5 / 6 passing**

| Spec | Status |
|------|--------|
| `07-transfer-with-fee` | Pass |
| `16-resolve-and-transfer` | Pass |
| `17-admin-customer-balance-after-transfer` | Pass |
| `profit-and-loss-transfer-fees` | Pass |
| `customer-notification-workflow` | Pass |
| `18-transfer-chaos-rejection` | **Fail** (validation, not fees) |

---

## Unfinished — by priority

### 1. Category B — wallet validation — **FIXED**

**Root cause:** Admin API returns validation errors as HTTP `200` with `{ status: false, message: "..." }` (not HTTP `422`). Validation logic was always correct; tests checked the wrong signal.

**Fix:**
- Added `isApiErrorResponse()` / `assertApiRejects()` in `cypress/support/walletAccountingHelpers.js`
- Updated specs `03`, `05`, `08`, `09`, `11`, `14`, `17-wallet-query`, `18-chaos` to use semantic rejection checks
- Wallet accounting setup now uses **API activation** by default (no admin UI panel) — faster and more reliable

**Re-run result: 8/8 specs, 11/11 tests passing** (~2.5 min)

| Spec | Status |
|------|--------|
| `03-defund-master-insufficient` | Pass |
| `05-cash-in-insufficient-master-float` | Pass |
| `08-transfer-insufficient-balance` | Pass |
| `09-transfer-frozen-wallet` | Pass |
| `11-cash-out-insufficient-balance` | Pass |
| `14-resolve-recipient-not-found` | Pass |
| `17-wallet-query` | Pass (4/4) |
| `18-transfer-chaos-rejection` | Pass |

---

### 2. Category D — idempotency — **FIXED**

**Status:** Idempotency works on live API (`Idempotency-Key` header + `wallet_idempotency_keys` table).

**Hardening:**
- Added `assertIdempotentMoneyOperationReplay()` — stable-field replay assertions (avoids flaky full `deep.eq` on re-hydrated wallet/transaction)

**Re-run result: 1/1 passing** (~11s)

| Spec | Status |
|------|--------|
| `06-cash-in-idempotency` | Pass |

**PHPUnit:** `test_cash_in_idempotency_prevents_double_post` — pass (10 assertions)

---

### 3. Category A — customer wallet fixtures (no seeder)

| Spec | Status | Notes |
|------|--------|-------|
| `customer-wallet-transactions` | Fail + 4 skipped | Needs fixture customers |
| `customer-wallet-workflow` | Fail + 6 skipped | Same |
| `customer-websocket-broadcast` | 2 fail | Auth / fixture setup |

---

### 4. Category E — customer lifecycle API — **FIXED**

**Root causes:**
- Auth failures return HTTP `200` with `success: false` (not HTTP `401`)
- Cypress intercept delete bodies arrive as JSON strings (`success` was `undefined`)
- Admin edit form is React-controlled — `.clear().type()` appended text instead of replacing

**Fix:**
- `assertApiAuthFailure()` / `assertAdminDeleteSuccess()` helpers
- `setReactInputValue()` for React controlled inputs in admin edit form
- `apiCustomerDeleteAccount()` + `assertCustomerDeleteAccountSuccess()` / `assertCustomerDeleteAccountRejected()` for customer self-delete

**Re-run result: 3/3 specs passing** (~45s)

| Spec | Status |
|------|--------|
| `customer-registration-lifecycle` | Pass |
| `admin-customer-lifecycle` | Pass |
| `customer-delete-account` | Pass |

---

### 5. Category F — admin customers UI

| Spec | Status | Notes |
|------|--------|-------|
| `admin-customer-crud` | Fail | Create flow |
| `admin-customer-wallet-transactions` | Fail | Pagination `per_page=5` select missing |
| `admin-customers-filter-export-import` | Fail | |
| `customers-list` | 8/9 pass | 1 fail |
| `customers-crud` | 7/8 pass | Delete button selector |
| `customers-i18n` | 2/3 pass | |
| `customers-import-export` | 3/4 pass | |

---

## Wallet accounting — scorecard

**Passing (15 specs):** `00`–`02`, `04`, `06`, `07`, `10`, `12`, `13`, `15`

**Failing (5+ specs):** `03`, `05`, `08`, `09`, `11`, `14`, `17-wallet-query`, `18`

*`16` and `17-admin-customer-balance-after-transfer` pass after Category C fixes (not reflected in last full run).*

---

## Estimated state after Category C fixes (not re-run full suite)

Roughly **~39 tests passing**, **~21 specs still failing** if the full suite were re-run.

---

## Backend note

`Fast_Pay_Soft_Pos` has **local uncommitted changes** (wallet validation, admin/customer controllers, tests). PHPUnit validates correctly; E2E hits whatever is running on port 8000 — restart with latest code before Category B work.

---

## Suggested order

1. **Category A** — fixture customers without seeder / websocket Reverb port (`8076`)
2. **Category F** — admin UI selectors / pagination
3. Full suite re-run for new baseline

*(Categories B, C, D, E are fixed.)*

---

## Key paths

**Cypress**

- `cypress/environments.js`
- `cypress/support/walletAccountingHelpers.js`
- `cypress/support/commands.js`
- `cypress/e2e/wallet-accounting/*.cy.js`

**Backend**

- `Fast_Pay_Soft_Pos/app/Services/WalletService.php`
- `Fast_Pay_Soft_Pos/app/Modules/CustomerAuth/Services/CustomerWalletService.php`
- `Fast_Pay_Soft_Pos/app/Http/Controllers/Api/V2/Admin/AdminWalletController.php`
- `Fast_Pay_Soft_Pos/tests/Feature/CustomerWalletApiTest.php`
