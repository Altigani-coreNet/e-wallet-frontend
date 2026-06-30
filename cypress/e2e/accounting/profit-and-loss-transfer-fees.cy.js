/**
 * Admin accounting — Profit & Loss increases after wallet transfer fees
 *
 * Flow:
 * 1. Fund sender + recipient wallets
 * 2. Capture baseline P&L and balance sheet (API + admin UI)
 * 3. Run 10 wallet transfers with fee = 2 each
 * 4. P&L net profit should increase by 20 (fee income)
 *
 * Run:
 *   npm run cy:run:accounting -- --spec cypress/e2e/accounting/profit-and-loss-transfer-fees.cy.js
 */

import { assertProfitLossDelta } from '../../support/accountingHelpers';
import { configuredTransferFee } from '../../support/walletAccountingHelpers';

describe('Accounting — profit and loss after transfer fees', () => {
    const transferCount = 10;
    const transferAmount = 10;
    const feePerTransfer = configuredTransferFee();
    const expectedNetProfitIncrease = transferCount * feePerTransfer;

    let adminToken;
    let adminPayload;
    let sender;
    let recipient;
    let recipientWalletId;

    before(() => {
        cy.setupWalletAccountingPair(Date.now()).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;
            adminToken = sender.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 500,
                    description: 'E2E seed master for P&L fee test',
                    idempotencyKey: `seed-pl-fees-master-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: transferAmount * transferCount + 50,
                    description: 'Fund sender for P&L fee transfers',
                    idempotencyKey: `fund-sender-pl-fees-${Date.now()}`,
                });
            });
        });

        cy.apiAdminLogin().then((login) => {
            adminToken = login.token;
            adminPayload = login.payload;
        });
    });

    beforeEach(() => {
        cy.intercept('GET', '**/v2/admin/accounting/reports/balance-sheet*').as('balanceSheetReport');
        cy.intercept('GET', '**/v2/admin/accounting/reports/profit-loss*').as('profitLossReport');
    });

    it('shows baseline reports, then net profit rises by 20 after ten fee transfers', () => {
        let baselineNetProfit;

        cy.captureProfitLossSnapshot({ adminToken, label: 'before transfers' }).then((beforePl) => {
            baselineNetProfit = beforePl.netProfit;

            cy.captureAccountingSnapshot({ adminToken, label: 'before transfers balance sheet' }).then((beforeBs) => {
                expect(beforeBs.balanceSheet.is_balanced, 'baseline balance sheet is balanced').to.eq(true);

                cy.visitAdminAuthenticated('/admin/accounting/balance-sheet', adminPayload);
                cy.wait('@balanceSheetReport', { timeout: 30000 });
                cy.get('[data-testid="balance-sheet-report"]', { timeout: 20000 }).should('be.visible');

                cy.visitAdminAuthenticated('/admin/accounting/profit-and-loss', adminPayload);
                cy.wait('@profitLossReport', { timeout: 30000 });
                cy.get('[data-testid="profit-loss-report"]', { timeout: 20000 }).should('be.visible');

                cy.apiWalletResolveRecipient({
                    token: sender.token,
                    identifier: recipient.phone,
                }).then((resolveResponse) => {
                    recipientWalletId = resolveResponse.body.data.recipient_wallet_id;

                    Cypress._.times(transferCount, (index) => {
                        cy.apiWalletTransfer({
                            token: sender.token,
                            recipientWalletId,
                            amount: transferAmount,
                            description: `E2E P&L fee transfer ${index + 1}`,
                            idempotencyKey: `pl-fee-transfer-${Date.now()}-${index}`,
                        }).then((transferResponse) => {
                            expect(transferResponse.status).to.eq(200);
                            expect(transferResponse.body.data.fee).to.eq(feePerTransfer);
                        });
                    });

                    cy.captureProfitLossSnapshot({ adminToken, label: 'after transfers' }).then((afterPl) => {
                        assertProfitLossDelta(beforePl, afterPl, {
                            netProfit: expectedNetProfitIncrease,
                            grossProfit: expectedNetProfitIncrease,
                            incomeTotal: expectedNetProfitIncrease,
                        }, 'ten transfers with fee 2');

                        cy.captureAccountingSnapshot({ adminToken, label: 'after transfers balance sheet' }).then((afterBs) => {
                            expect(afterBs.balanceSheet.is_balanced, 'balance sheet stays balanced').to.eq(true);
                        });

                        cy.visitAdminAuthenticated('/admin/accounting/profit-and-loss', adminPayload);
                        cy.wait('@profitLossReport', { timeout: 30000 });
                        cy.get('[data-testid="profit-loss-net-profit"]', { timeout: 20000 })
                            .should('have.attr', 'data-amount')
                            .then((value) => {
                                expect(Number(value)).to.be.closeTo(
                                    baselineNetProfit + expectedNetProfitIncrease,
                                    0.01
                                );
                            });

                        cy.get('[data-testid="profit-loss-gross-profit"]', { timeout: 20000 })
                            .should('have.attr', 'data-amount')
                            .then((value) => {
                                expect(Number(value)).to.be.closeTo(
                                    beforePl.grossProfit + expectedNetProfitIncrease,
                                    0.01
                                );
                            });
                    });
                });
            });
        });
    });
});
