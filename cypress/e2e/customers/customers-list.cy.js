describe('Customers List', () => {
    beforeEach(() => {
        cy.visitCustomersIndex();
    });

    it('loads the customer management page with table data', () => {
        cy.contains('Customer Management').should('be.visible');
        cy.contains('John Doe').should('be.visible');
        cy.contains('Jane Smith').should('be.visible');
        cy.contains('john@example.com').should('be.visible');
        cy.contains('VIP').should('be.visible');
        cy.contains('No Group').should('be.visible');
    });

    it('shows toolbar actions', () => {
        cy.contains('button', 'Filter').should('be.visible');
        cy.contains('a', 'Add Customer').should('be.visible');
        cy.contains('button', 'Export').should('be.visible');
        cy.contains('button', 'Import').should('be.visible');
    });

    it('searches customers with debounced API call', () => {
        cy.intercept('GET', '**/api/cashier/v1/customers*', (req) => {
            if (req.url.includes('search=John')) {
                req.reply({ fixture: 'customers-search.json' });
            } else {
                req.reply({ fixture: 'customers.json' });
            }
        }).as('searchCustomers');

        cy.get('input[placeholder="Search customers..."]').type('John');
        cy.wait('@searchCustomers');
        cy.contains('John Doe').should('be.visible');
        cy.contains('Jane Smith').should('not.exist');
    });

    it('toggles advanced filters panel', () => {
        cy.contains('button', 'Filter').click();
        cy.contains('label', 'Customer Group').should('be.visible');
        cy.contains('label', 'Date From').should('be.visible');
        cy.get('select[name="customer_group_id"]').should('be.visible');
    });

    it('changes per-page selector', () => {
        cy.intercept('GET', '**/api/cashier/v1/customers*per_page=25*', {
            fixture: 'customers.json',
        }).as('perPage25');

        cy.get('select.form-select-sm').select('25');
        cy.wait('@perPage25');
    });

    it('sorts by customer name column', () => {
        cy.intercept('GET', '**/api/cashier/v1/customers*sort_by=name*', {
            fixture: 'customers.json',
        }).as('sortByName');

        cy.contains('th', 'Customer').click();
        cy.wait('@sortByName');
    });

    it('shows empty state when no customers returned', () => {
        cy.intercept('GET', '**/api/cashier/v1/customers*', {
            fixture: 'customers-empty.json',
        }).as('emptyCustomers');

        cy.reload();
        cy.wait('@emptyCustomers');
        cy.contains('No customers found').should('be.visible');
    });

    it('navigates to create customer page', () => {
        cy.contains('a', 'Add Customer').click();
        cy.url().should('include', '/en/merchant/customers/create');
        cy.contains('Create New Customer').should('be.visible');
    });

    it('navigates to customer view page from table row', () => {
        cy.intercept('GET', '**/api/cashier/v1/customers/1', {
            fixture: 'customer.json',
        }).as('getCustomer');

        cy.contains('a', 'John Doe').click();
        cy.wait('@getCustomer');
        cy.url().should('include', '/en/merchant/customers/1');
        cy.contains('John Doe').should('be.visible');
    });
});
