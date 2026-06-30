describe('Customers i18n (Arabic / RTL)', () => {
    beforeEach(() => {
        cy.stubCustomerModuleApis();
    });

    it('renders Arabic translations on customers index', () => {
        cy.visitWithAuth('/ar/merchant/customers', { locale: 'ar' });
        cy.wait('@getCustomers');

        cy.document().its('documentElement.dir').should('eq', 'rtl');
        cy.contains('إدارة العملاء').should('be.visible');
        cy.get('input[placeholder="بحث في العملاء..."]').should('exist');
        cy.contains('button', 'تصفية').should('be.visible');
        cy.contains('a', 'إضافة عميل').should('be.visible');
    });

    it('shows Arabic delete confirmation dialog', () => {
        cy.visitWithAuth('/ar/merchant/customers', { locale: 'ar' });
        cy.wait('@getCustomers');

        cy.intercept('DELETE', '**/api/cashier/v1/customers/1', {
            statusCode: 200,
            body: { success: true, message: 'تم حذف العميل بنجاح' },
        }).as('deleteCustomer');

        cy.get('tbody tr').first().within(() => {
            cy.contains('button', 'الإجراءات').click();
        });
        cy.contains('button', 'حذف').click({ force: true });
        cy.get('.swal2-popup').should('be.visible');
        cy.contains('هل أنت متأكد؟').should('be.visible');
        cy.get('.swal2-confirm').click();
        cy.wait('@deleteCustomer');
    });

    it('renders Arabic create customer form labels', () => {
        cy.visitWithAuth('/ar/merchant/customers/create', { locale: 'ar' });
        cy.wait('@getCustomerGroups');

        cy.document().its('documentElement.dir').should('eq', 'rtl');
        cy.contains('إنشاء عميل جديد').should('be.visible');
        cy.contains('label', 'اسم العميل').should('be.visible');
        cy.contains('button', 'حفظ العميل').should('be.visible');
    });
});
