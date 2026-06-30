/**
 * PRD Gherkin: Duplicate cash-in is idempotent
 */

import { assertIdempotentMoneyOperationReplay } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — cash-in idempotency', () => {
    let adminToken;
    let masterUuid;
    let customer;
    let idempotencyKey;

    before(() => {
        idempotencyKey = `cashin-idem-${Date.now()}`;

        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'IdemCashIn' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: masterUuid,
                    amount: 500,
                    description: 'E2E seed for idempotency test',
                    idempotencyKey: `seed-idem-${Date.now()}`,
                });
            });
        });
    });

    it('replays the same cash-in key without double posting', () => {
        const amount = 75;

        cy.captureAccountingSnapshot({ adminToken, label: 'before idempotent cash-in' }).then((before) => {
            cy.apiAdminWalletCashIn({
                adminToken,
                walletUuid: customer.walletUuid,
                amount,
                description: 'Idempotent cash-in',
                idempotencyKey,
            }).then((first) => {
                expect(first.status).to.eq(200);
                cy.logServerResponse('cash-in first (idempotency key)', first);

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount,
                    description: 'Idempotent cash-in replay',
                    idempotencyKey,
                }).then((second) => {
                    expect(second.status).to.eq(200);
                    cy.logServerResponse('cash-in replay (same idempotency key)', second);
                    assertIdempotentMoneyOperationReplay(first, second);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: customer.walletUuid }).then((show) => {
                    cy.logServerResponse('wallet show after idempotent cash-in', show);
                    expect(show.body.data.balance).to.eq(amount);
                });

                cy.apiWalletDashboard(customer.token).then((dash) => {
                    cy.logServerResponse('customer wallet dashboard', dash);
                    expect(dash.body.data.wallet.balance).to.eq(amount);
                });

                cy.assertAccountingReflectsOperation({
                    before,
                    adminToken,
                    operation: 'customerCashIn',
                    amount,
                    context: 'idempotent cash-in',
                });
            });
        });
    });
});

