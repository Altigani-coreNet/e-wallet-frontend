import fs from 'fs';

const p = new URL('../src/App.jsx', import.meta.url);
let s = fs.readFileSync(p, 'utf8');

const oldOpen = `                    {/* Root + Public Pages */}
                    <Route path="/" element={<Outlet />}>
`;
const closePattern = `                </Route>
            </Route>

            {/* Public Auth Routes */}`;
const i0 = s.indexOf(oldOpen);
const i1 = s.indexOf(closePattern);
if (i0 < 0 || i1 < 0) {
    console.error('markers', i0, i1);
    process.exit(1);
}
let middle = s.slice(i0 + oldOpen.length, i1);
middle = middle
    .replace(
        '<Route index element={<Navigate to="/sales/dashboard" replace />} />',
        '<Route index element={<LocalizedNavigate to="/sales/dashboard" />} />',
    )
    .replace(
        '<Route path="*" element={<Navigate to="/merchant/dashboard" replace />} />',
        '<Route path="*" element={<LocalizedNavigate to="/merchant/dashboard" />} />',
    );

const newBlock = `                    <Route path="/" element={<RootLangRedirect />} />
                    <Route path="/:lang" element={<LocaleSyncOutlet />}>
${middle}                </Route>
            </Route>

`;

let s2 = s.slice(0, i0) + s.slice(i1 + closePattern.length);
const insertMarker = '                {/* Global Fallback */}';
const ins = s2.indexOf(insertMarker);
if (ins < 0) {
    console.error('no Global Fallback');
    process.exit(1);
}
const final = s2.slice(0, ins) + newBlock + s2.slice(ins);
fs.writeFileSync(p, final);
console.log('done');
