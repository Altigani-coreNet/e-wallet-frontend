/**
 * Admin customers — filter, export, and import in one flow (real API).
 *
 * Prerequisites:
 * - Laravel: php artisan serve (port 8000)
 * - Payment: npm run dev (port 5173)
 * - Admin credentials in cypress.config.js
 * - At least one merchant in the database
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/admin-customers-filter-export-import.cy.js
 */

describe('Admin Customers — filter, export, and import', () => {
    const runId = Date.now();
    const importEmail = `admin.import.${runId}@example.com`;

    beforeEach(() => {
        cy.intercept('GET', '**/v2/admin/customers/export*').as('exportCustomers');
        cy.intercept('GET', '**/v2/admin/customers/export-template*').as('exportTemplate');
        cy.intercept('GET', '**/v2/admin/merchants/select*').as('merchantsSelect');
        cy.intercept('GET', '**/v2/admin/customers*').as('customersList');
        cy.intercept('POST', '**/v2/admin/customers/import-preview').as('importPreview');
        cy.intercept('POST', '**/v2/admin/customers/import').as('importCustomers');
    });

    it('filters the list, exports CSV, and imports customers with merchant selection', () => {
        cy.loginAdmin();

        cy.contains('Customer Management', { timeout: 20000 }).should('be.visible');
        cy.wait('@customersList', { timeout: 30000 });

        // Filter panel
        cy.contains('button', 'Filter').click();
        cy.get('select[name="status"]').should('be.visible').select('active');
        cy.wait('@customersList', { timeout: 30000 });

        // Export
        cy.contains('button', 'Export').click();
        cy.wait('@exportCustomers', { timeout: 30000 }).then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.headers['content-type']).to.include('text/csv');
        });
        cy.contains('Customers exported successfully', { timeout: 10000 }).should('be.visible');

        // Import modal — merchants must load
        cy.contains('button', 'Import').click();
        cy.contains('Import Customers', { timeout: 10000 }).should('be.visible');
        cy.wait('@merchantsSelect', { timeout: 30000 }).then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            const merchants = response.body?.data;
            expect(merchants, 'merchants select payload').to.be.an('array').and.not.be.empty;
        });

        cy.get('select.form-select').first().find('option').its('length').should('be.gt', 1);
        cy.get('select.form-select').first().select(1);

        // Template download
        cy.contains('button', 'Download Template').click();
        cy.wait('@exportTemplate', { timeout: 30000 }).then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        // Upload + preview
        cy.fixture('admin-customers-import.csv', 'utf8').then((template) => {
            const csv = template.replace('{{email}}', importEmail);
            cy.get('input[type="file"]').selectFile(
                {
                    contents: Cypress.Buffer.from(csv),
                    fileName: 'admin-customers-import.csv',
                    mimeType: 'text/csv',
                },
                { force: true }
            );
        });

        cy.contains('button', 'Preview Data').click();
        cy.wait('@importPreview', { timeout: 30000 }).then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.data).to.be.an('array').and.not.be.empty;
        });

        cy.contains('Preview Import Data', { timeout: 15000 }).should('be.visible');
        cy.contains('button', /Confirm Import/).click();
        cy.wait('@importCustomers', { timeout: 60000 }).then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            const imported = response.body?.data?.imported_count ?? response.body?.imported_count ?? 0;
            expect(imported).to.be.gte(1);
        });

        // Verify imported customer appears in list
        cy.get('input[name="search"]').clear().type(importEmail);
        cy.wait('@customersList', { timeout: 30000 });
        cy.contains('tr', importEmail, { timeout: 20000 }).should('be.visible');
    });
});
