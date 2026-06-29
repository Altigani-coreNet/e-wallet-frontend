/**
 * @deprecated Split into cypress/e2e/wallet-accounting/*.cy.js — one scenario per file.
 *
 * Run the full wallet accounting suite:
 *   npm run cy:run:wallet-accounting
 */

describe('Wallet money operations (deprecated monolith)', () => {
    it('redirects maintainers to wallet-accounting folder', () => {
        cy.log('Use cypress/e2e/wallet-accounting/ instead of this file.');
        expect(true).to.eq(true);
    });
});
