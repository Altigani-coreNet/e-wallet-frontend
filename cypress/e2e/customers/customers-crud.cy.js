describe('Customers CRUD', () => {
    beforeEach(() => {
        cy.stubCustomerModuleApis();
    });

    describe('Create customer', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/cashier/v1/customers*', {
                fixture: 'customers.json',
            }).as('getCustomers');

            cy.visitWithAuth('/en/merchant/customers/create');
            cy.wait('@getCustomerGroups');
        });

        it('creates a new customer successfully', () => {
            cy.intercept('POST', '**/api/cashier/v1/customers', {
                statusCode: 200,
                body: {
                    success: true,
                    message: 'Customer created successfully',
                    data: { customer: { id: 3, name: 'New Customer' } },
                },
            }).as('createCustomer');

            cy.get('input[name="name"]').type('New Customer');
            cy.get('input[name="email"]').type('new@example.com');
            cy.get('input[name="phone"]').type('+1111111111');
            cy.get('input[name="company_name"]').type('New Corp');
            cy.contains('button', 'Save Customer').click();

            cy.wait('@createCustomer');
            cy.url().should('include', '/en/merchant/customers');
            cy.contains('Customer created successfully').should('be.visible');
        });

        it('shows validation errors from API', () => {
            cy.intercept('POST', '**/api/cashier/v1/customers', {
                statusCode: 422,
                body: {
                    message: 'Validation failed',
                    errors: { email: ['The email has already been taken.'] },
                },
            }).as('createCustomerFail');

            cy.get('input[name="name"]').type('Duplicate Email');
            cy.get('input[name="email"]').type('john@example.com');
            cy.contains('button', 'Save Customer').click();

            cy.wait('@createCustomerFail');
            cy.contains('Validation failed').should('be.visible');
        });
    });

    describe('Edit customer', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/cashier/v1/customers/1', {
                fixture: 'customer.json',
            }).as('getCustomer');

            cy.visitWithAuth('/en/merchant/customers/1/edit');
            cy.wait('@getCustomer');
            cy.wait('@getCustomerGroups');
        });

        it('updates customer successfully', () => {
            cy.intercept('PUT', '**/api/cashier/v1/customers/1', {
                statusCode: 200,
                body: {
                    success: true,
                    message: 'Customer updated successfully',
                    data: { customer: { id: 1, name: 'John Updated' } },
                },
            }).as('updateCustomer');

            cy.get('input[name="name"]').clear().type('John Updated');
            cy.contains('button', 'Save Customer').click();

            cy.wait('@updateCustomer');
            cy.url().should('include', '/en/merchant/customers');
            cy.contains('Customer updated successfully').should('be.visible');
        });
    });

    describe('View and delete customer', () => {
        beforeEach(() => {
            cy.intercept('GET', '**/api/cashier/v1/customers/1', {
                fixture: 'customer.json',
            }).as('getCustomer');

            cy.visitWithAuth('/en/merchant/customers/1');
            cy.wait('@getCustomer');
        });

        it('displays customer details', () => {
            cy.contains('John Doe').should('be.visible');
            cy.contains('john@example.com').should('be.visible');
            cy.contains('Acme Inc').should('be.visible');
            cy.contains('VIP').should('be.visible');
        });

        it('deletes a single customer after confirmation', () => {
            cy.intercept('DELETE', '**/api/cashier/v1/customers/1', {
                statusCode: 200,
                body: { success: true, message: 'Customer deleted successfully' },
            }).as('deleteCustomer');

            cy.intercept('GET', '**/api/cashier/v1/customers*', {
                fixture: 'customers-search.json',
            }).as('listAfterDelete');

            cy.contains('button', 'Delete').first().click();
            cy.confirmSwal();
            cy.wait('@deleteCustomer');
            cy.url().should('include', '/en/merchant/customers');
        });

        it('navigates to edit page from view', () => {
            cy.contains('a', 'Edit Customer').click();
            cy.url().should('include', '/en/merchant/customers/1/edit');
        });
    });

    describe('Bulk delete', () => {
        beforeEach(() => {
            cy.visitCustomersIndex();
        });

        it('bulk deletes selected customers', () => {
            cy.intercept('POST', '**/api/cashier/v1/customers/bulk-delete', {
                statusCode: 200,
                body: { success: true, message: 'Customers deleted successfully' },
            }).as('bulkDelete');

            cy.get('tbody input[type="checkbox"]').first().check({ force: true });
            cy.get('tbody input[type="checkbox"]').eq(1).check({ force: true });
            cy.contains('button', 'Delete selected').click();
            cy.confirmSwal();
            cy.wait('@bulkDelete');
        });

        it('deletes single row from table actions', () => {
            cy.intercept('DELETE', '**/api/cashier/v1/customers/1', {
                statusCode: 200,
                body: { success: true, message: 'Customer deleted successfully' },
            }).as('deleteRow');

            cy.get('tbody tr').first().within(() => {
                cy.contains('button', 'Actions').click();
            });
            cy.contains('button', 'Delete').click({ force: true });
            cy.confirmSwal();
            cy.wait('@deleteRow');
            cy.contains('Customer deleted successfully').should('be.visible');
        });
    });
});
