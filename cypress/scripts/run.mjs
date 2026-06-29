#!/usr/bin/env node
/**
 * Cross-platform Cypress launcher with environment profile.
 *
 * Usage:
 *   node cypress/scripts/run.mjs development open
 *   node cypress/scripts/run.mjs staging run --e2e --spec "cypress/e2e/wallet-accounting/*.cy.js"
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const paymentRoot = path.resolve(__dirname, '../..');

const [targetEnv = 'development', cypressCommand = 'open', ...cypressArgs] = process.argv.slice(2);

process.env.CYPRESS_TARGET_ENV = targetEnv;

// Optional local overrides: cypress/.env.development (gitignored)
const dotenvPath = path.join(paymentRoot, 'cypress', `.env.${targetEnv}`);
if (existsSync(dotenvPath)) {
    for (const line of readFileSync(dotenvPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        const eq = trimmed.indexOf('=');
        if (eq === -1) {
            continue;
        }
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

const cypressBin = path.join(
    paymentRoot,
    'node_modules',
    'cypress',
    'bin',
    'cypress'
);

console.log(`[cypress] environment=${targetEnv} command=${cypressCommand}`);

const child = spawn(process.execPath, [cypressBin, cypressCommand, ...cypressArgs], {
    cwd: paymentRoot,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
});

child.on('exit', (code) => {
    process.exit(code ?? 1);
});
