import { defineConfig } from 'cypress';
import viteConfig from './vite.config.js';

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
            apiUrl: 'http://localhost:8000',
            adminEmail: 'admin@corenet-tech.com',
            adminPassword: '12345678',
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
