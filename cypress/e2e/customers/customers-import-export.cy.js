describe('Customers Import and Export', () => {
    beforeEach(() => {
        cy.visitCustomersIndex();
    });

    it('exports customers to CSV', () => {
        cy.contains('button', 'Export').click();
        cy.wait('@exportCustomers');
        cy.contains('Customers exported successfully').should('be.visible');
    });

    it('opens import modal and previews file', () => {
        cy.intercept('POST', '**/api/cashier/v1/customers/import-preview', {
            statusCode: 200,
            body: {
                data: {
                    data: [
                        {
                            name: 'Import User',
                            email: 'import@example.com',
                            phone: '+5555555555',
                            is_valid: true,
                        },
                    ],
                },
            },
        }).as('importPreview');

        cy.contains('button', 'Import').click();
        cy.contains('Import Customers').should('be.visible');

        cy.fixture('import-customers.csv', 'ascii').then((fileContent) => {
            cy.get('input[type="file"]').selectFile(
                {
                    contents: Cypress.Buffer.from(fileContent),
                    fileName: 'import-customers.csv',
                    mimeType: 'text/csv',
                },
                { force: true }
            );
        });

        cy.wait('@importPreview');
        cy.contains('button', 'Click confirm import to finish').should('not.be.disabled');
    });

    it('completes customer import after confirmation', () => {
        cy.intercept('POST', '**/api/cashier/v1/customers/import-preview', {
            statusCode: 200,
            body: {
                data: {
                    data: [
                        {
                            name: 'Import User',
                            email: 'import@example.com',
                            phone: '+5555555555',
                            is_valid: true,
                        },
                    ],
                },
            },
        }).as('importPreview');

        cy.intercept('POST', '**/api/cashier/v1/customers/import', {
            statusCode: 200,
            body: {
                data: {
                    imported_count: 1,
                    skipped_count: 0,
                    errors: [],
                },
            },
        }).as('importCustomers');

        cy.contains('button', 'Import').click();

        cy.fixture('import-customers.csv', 'ascii').then((fileContent) => {
            cy.get('input[type="file"]').selectFile(
                {
                    contents: Cypress.Buffer.from(fileContent),
                    fileName: 'import-customers.csv',
                    mimeType: 'text/csv',
                },
                { force: true }
            );
        });

        cy.wait('@importPreview');
        cy.contains('button', 'Click confirm import to finish').click();
        cy.confirmSwal();
        cy.wait('@importCustomers');
        cy.get('.swal2-confirm').click();
    });

    it('downloads import template from modal', () => {
        cy.contains('button', 'Import').click();
        cy.contains('button', 'Download the sample template').click({ force: true });
        cy.wait('@exportTemplate');
    });
});
