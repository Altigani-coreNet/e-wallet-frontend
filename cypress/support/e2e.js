import './commands';

Cypress.on('uncaught:exception', (err) => {
    if (
        err.message.includes('ResizeObserver loop') ||
        err.message.includes('Non-Error promise rejection')
    ) {
        return false;
    }
    return undefined;
});
