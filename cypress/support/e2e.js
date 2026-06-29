import './commands';
import './walletAccountingHelpers';
import './environment';

Cypress.on('uncaught:exception', (err) => {
    if (
        err.message.includes('ResizeObserver loop') ||
        err.message.includes('Non-Error promise rejection') ||
        // Metronic/third-party theme JS attaches listeners to optional DOM nodes
        // that may not exist in a given view; benign for these tests.
        err.message.includes("reading 'addEventListener'") ||
        err.message.includes("'addEventListener' of null")
    ) {
        return false;
    }
    return undefined;
});
