# E2E Status Report

Last updated: 2026-06-29

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

### 1. Category B — wallet validation (expected 422, got 200) — **start here**

PHPUnit passes for these paths; live E2E API returns **200**. Backend source looks correct; likely **stale `php artisan serve`**, **DB pollution**, or **env mismatch**.

| Spec | What fails |
|------|------------|
| `03-defund-master-insufficient` | Master cash-out above balance → 200 |
| `05-cash-in-insufficient-master-float` | Customer cash-in when master float too low → 200 |
| `08-transfer-insufficient-balance` | Transfer above sender balance → 200 |
| `09-transfer-frozen-wallet` | Transfer from frozen wallet → 200 |
| `11-cash-out-insufficient-balance` | Customer cash-out above balance → 200 |
| `14-resolve-recipient-not-found` | Unknown recipient → 200 |
| `17-wallet-query` | Self phone / own wallet_id query → 200 (2 of 4 tests) |
| `18-transfer-chaos-rejection` | `amount above sender balance` → 200 |

**Checklist:**

1. Start MySQL and restart Laravel on `localhost:8000` with latest code
2. Confirm same DB as E2E `.env.development`
3. Hit API directly (curl) for one reject case vs PHPUnit
4. Harden tests: numeric `balance`, fresh customers, known balances before reject attempts

**Debug note:** CLI validation script failed with `Connection refused` on `127.0.0.1:3306` — MySQL was not running when debugging from `php artisan`.

---

### 2. Category D — idempotency

| Spec | Status |
|------|--------|
| `06-cash-in-idempotency` | Fail |

---

### 3. Category A — customer wallet fixtures (no seeder)

| Spec | Status | Notes |
|------|--------|-------|
| `customer-wallet-transactions` | Fail + 4 skipped | Needs fixture customers |
| `customer-wallet-workflow` | Fail + 6 skipped | Same |
| `customer-websocket-broadcast` | 2 fail | Auth / fixture setup |

---

### 4. Category E — customer lifecycle API

| Spec | Status | Notes |
|------|--------|-------|
| `customer-registration-lifecycle` | Fail | |
| `admin-customer-lifecycle` | Fail | Expected 401, got 200 after soft-delete |

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

**Passing (14 specs):** `00`–`02`, `04`, `07`, `10`, `12`, `13`, `15`

**Failing (6+ specs):** `03`, `05`, `06`, `08`, `09`, `11`, `14`, `17-wallet-query`, `18`

*`16` and `17-admin-customer-balance-after-transfer` pass after Category C fixes (not reflected in last full run).*

---

## Estimated state after Category C fixes (not re-run full suite)

Roughly **~39 tests passing**, **~21 specs still failing** if the full suite were re-run.

---

## Backend note

`Fast_Pay_Soft_Pos` has **local uncommitted changes** (wallet validation, admin/customer controllers, tests). PHPUnit validates correctly; E2E hits whatever is running on port 8000 — restart with latest code before Category B work.

---

## Suggested order

1. **Category B** — validation / 422 (biggest wallet-accounting gap; overlaps with `18`)
2. **Category D** — idempotency (`06`)
3. **Category A** — fixture customers without seeder
4. **Category E** — lifecycle APIs
5. **Category F** — admin UI selectors / pagination
6. Full suite re-run for new baseline

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
