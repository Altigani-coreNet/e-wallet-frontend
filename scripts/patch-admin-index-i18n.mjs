/**
 * One-off: add useTranslation + replace setTitle in admin *Index*.jsx
 * Run: node scripts/patch-admin-index-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_ROOT = path.join(__dirname, '..', 'src', 'components', 'admin');

const SET_TITLE_SNIPPETS = [
  ["setTitle('Countries Management');", "setTitle(t('admin.pages.countriesManagement'));"],
  ["setTitle('Cities Management');", "setTitle(t('admin.pages.citiesManagement'));"],
  ["setTitle('Currencies Management');", "setTitle(t('admin.pages.currenciesManagement'));"],
  ["setTitle('Merchants Management');", "setTitle(t('admin.pages.merchantsManagement'));"],
  ["setTitle('Terminal Groups Management');", "setTitle(t('admin.pages.terminalGroupsManagement'));"],
  ["setTitle('Admin Management');", "setTitle(t('admin.pages.adminsManagement'));"],
  ["setTitle('Terminals Management');", "setTitle(t('admin.pages.terminalsManagement'));"],
  ["setTitle('User Groups Management');", "setTitle(t('admin.pages.userGroupsManagement'));"],
  ["setTitle('Users Management');", "setTitle(t('admin.pages.usersManagement'));"],
  ["setTitle('Service Transactions');", "setTitle(t('admin.pages.serviceTransactions'));"],
  ["setTitle('Notification Management');", "setTitle(t('admin.pages.notificationsManagement'));"],
  ["setTitle('Taxes Management');", "setTitle(t('admin.pages.taxesManagement'));"],
  ["setTitle('Payment Providers');", "setTitle(t('admin.pages.paymentProviders'));"],
  ["setTitle('Sale Returns Management');", "setTitle(t('admin.pages.saleReturnsManagement'));"],
  ["setTitle('Sales Management');", "setTitle(t('admin.pages.salesManagement'));"],
  ["setTitle('Drafts Management');", "setTitle(t('admin.pages.draftsManagement'));"],
  ["setTitle('Purchases Management');", "setTitle(t('admin.pages.purchasesManagement'));"],
  ["setTitle('Coupons Management');", "setTitle(t('admin.pages.couponsManagement'));"],
  ["setTitle('Categories Management');", "setTitle(t('admin.pages.categoriesManagement'));"],
  ["setTitle('Brands Management');", "setTitle(t('admin.pages.brandsManagement'));"],
  ["setTitle('Tags Management');", "setTitle(t('admin.pages.tagsManagement'));"],
  ["setTitle('Units Management');", "setTitle(t('admin.pages.unitsManagement'));"],
  ["setTitle('Warehouses Management');", "setTitle(t('admin.pages.warehousesManagement'));"],
  ["setTitle('Products Management');", "setTitle(t('admin.pages.productsManagement'));"],
  ["setTitle('Batches');", "setTitle(t('admin.pages.batches'));"],
  ["setTitle('Settlements Management');", "setTitle(t('admin.pages.settlementsManagement'));"],
  ["setTitle('Branches Management');", "setTitle(t('admin.pages.branchesManagement'));"],
  ["setTitle('Plans Management');", "setTitle(t('admin.pages.plansManagement'));"],
  ["setTitle('Payment Links');", "setTitle(t('admin.pages.paymentLinks'));"],
  ["setTitle('Customers Management');", "setTitle(t('admin.pages.customersManagement'));"],
  ["setTitle('Advertisements Management');", "setTitle(t('admin.pages.advertisementsManagement'));"],
  ["setTitle('Roles Management');", "setTitle(t('admin.pages.rolesManagement'));"],
  ["setTitle('Change Request History');", "setTitle(t('admin.pages.changeRequestHistory'));"],
  ["setTitle('Service Fees Management');", "setTitle(t('admin.pages.serviceFeesManagement'));"],
  ["setTitle('Contract Terms Management');", "setTitle(t('admin.pages.contractTermsManagement'));"],
];

function walkJsx(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkJsx(p, out);
    else if (name.endsWith('Index.jsx')) out.push(p);
  }
  return out;
}

function ensureImport(src) {
  if (src.includes("from 'react-i18next'") || src.includes('from "react-i18next"')) return src;
  const lines = src.split(/\r?\n/);
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport === -1) {
    lines.unshift("import { useTranslation } from 'react-i18next';");
    return lines.join('\n');
  }
  lines.splice(lastImport + 1, 0, "import { useTranslation } from 'react-i18next';");
  return lines.join('\n');
}

function ensureHook(src) {
  if (src.includes('useTranslation()')) return src;
  const re = /^(const Admin\w+Index = \(\) => \{)\s*$/m;
  if (!re.test(src)) {
    console.warn('No hook insertion match for Admin*Index');
    return src;
  }
  return src.replace(re, "$1\n    const { t, i18n } = useTranslation();");
}

function replaceSetTitles(src) {
  let s = src;
  for (const [a, b] of SET_TITLE_SNIPPETS) {
    if (s.includes(a)) s = s.split(a).join(b);
  }
  return s;
}

function patchFile(fp) {
  let src = fs.readFileSync(fp, 'utf8');
  src = replaceSetTitles(src);
  if (/setTitle\(t\('admin\.pages\./.test(src)) {
    src = ensureImport(src);
    src = ensureHook(src);
  }
  fs.writeFileSync(fp, src);
}

const files = walkJsx(ADMIN_ROOT);
for (const fp of files) {
  patchFile(fp);
  console.log('patched', path.relative(path.join(__dirname, '..'), fp));
}
console.log('done', files.length, 'files');
