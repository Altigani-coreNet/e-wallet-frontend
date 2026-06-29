/**
 * Log active E2E environment at the start of each spec.
 */
beforeEach(() => {
    const name = Cypress.env('environmentName') || 'unknown';
    const apiUrl = Cypress.env('apiUrl') || '(not set)';
    const baseUrl = Cypress.config('baseUrl');
    const delayMs = Cypress.env('apiRequestDelayMs');

    cy.log(`E2E env: ${name} | API: ${apiUrl} | UI: ${baseUrl}`);
    if (delayMs !== undefined && Number(delayMs) > 0) {
        cy.log(`API logging: on | pause between calls: ${delayMs}ms`);
    }
});
