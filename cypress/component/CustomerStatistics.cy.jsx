import React from 'react';
import CustomerStatistics from '../../src/components/merchant/customers/CustomerStatistics';

describe('CustomerStatistics component', () => {
    it('renders translated statistic labels and values', () => {
        const statistics = {
            total: 120,
            active: 95,
            total_deposit: 15000,
            total_expense: 3200,
        };

        cy.mount(<CustomerStatistics statistics={statistics} />);

        cy.contains('Total Customers').should('be.visible');
        cy.contains('120').should('be.visible');
        cy.contains('Active Customers').should('be.visible');
        cy.contains('95').should('be.visible');
        cy.contains('Total Deposit').should('be.visible');
        cy.contains('Total Expense').should('be.visible');
    });

    it('renders zero defaults when statistics are missing', () => {
        cy.mount(<CustomerStatistics statistics={{}} />);

        cy.contains('Total Customers').should('be.visible');
        cy.get('.text-gray-800.fw-bold.fs-2').should('have.length.at.least', 4);
    });
});
