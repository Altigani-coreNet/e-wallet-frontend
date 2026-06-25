import { defineConfig } from 'cypress';
import viteConfig from './vite.config.js';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const laravelRoot = path.resolve(__dirname, '../Fast_Pay_Soft_Pos');

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        supportFile: 'cypress/support/e2e.js',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1280,
        viewportHeight: 720,
        defaultCommandTimeout: 10000,
        requestTimeout: 15000,
        video: false,
        screenshotOnRunFailure: true,
        env: {
            apiUrl: 'http://193.123.83.134:91',
            PAYMENT_BASE_URL: 'http://localhost:5173',
            adminEmail: 'admin@corenet-tech.com',
            adminPassword: '12345678',
            ADMIN_EMAIL: 'admin@corenet-tech.com',
            ADMIN_PASSWORD: '12345678',
            walletE2eSenderPhone: '+249977700001',
            walletE2eRecipientPhone: '+249977700002',
            walletE2ePassword: 'WalletE2e1!',
        },
        setupNodeEvents(on) {
            on('task', {
                seedWalletE2e() {
                    execSync('php artisan db:seed --class=WalletE2eSeeder --force', {
                        cwd: laravelRoot,
                        stdio: 'inherit',
                    });

                    return true;
                },
            });
        },
    },
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
            viteConfig,
        },
        supportFile: 'cypress/support/component.js',
        specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
        indexHtmlFile: 'cypress/support/component-index.html',
    },
});
