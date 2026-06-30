/**
 * Customer wallet transactions list E2E (real backend — no API mocking)
 *
 * Creates sender + recipient via API onboarding (no fixture seeders).
 * Transfers use OTP step + mock code 111111 via cy.apiWalletTransfer().
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-wallet-transactions.cy.js
 */

describe('Customer wallet transactions list (real backend)', () => {
    let senderToken;
    let recipientToken;
    let recipientWalletId;
    let adminToken;
    const transferAmount = 5;
    const transferCount = 10;
    const runId = Date.now();

    before(() => {
        cy.setupWalletAccountingPair(runId).then((pair) => {
            senderToken = pair.sender.token;
            recipientToken = pair.recipient.token;
            adminToken = pair.sender.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 500,
                    description: 'E2E seed master for tx list',
                    idempotencyKey: `seed-tx-list-master-${runId}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: pair.sender.walletUuid,
                    amount: transferAmount * transferCount + 50,
                    description: 'Fund sender for tx list',
                    idempotencyKey: `fund-sender-tx-list-${runId}`,
                });
            });
        });
    });

    it('seeds ten transfers and returns paginated transaction history for sender', () => {
        cy.apiWalletDashboard(recipientToken).then((recipientDashboard) => {
            recipientWalletId = recipientDashboard.body.data.wallet.wallet_id;

            Cypress._.times(transferCount, (index) => {
                const n = index + 1;
                cy.apiWalletTransfer({
                    token: senderToken,
                    recipientWalletId,
                    amount: transferAmount,
                    description: `Cypress tx ${n} ${runId}`,
                    note: n === 3 ? `Special note ${runId}` : undefined,
                    idempotencyKey: `cypress-tx-${runId}-${n}`,
                }).then((transferResponse) => {
                    expect(transferResponse.status).to.eq(200);
                });
            });

            cy.apiWalletTransactions({ token: senderToken, per_page: 15 }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.success).to.eq(true);
                expect(response.body.data.per_page).to.eq(15);
                expect(response.body.data.current_page).to.eq(1);
                expect(response.body.data.total).to.be.at.least(transferCount);
                expect(response.body.data.data.length).to.be.at.least(transferCount);

                const descriptions = response.body.data.data.map((row) => row.description);
                expect(descriptions.some((d) => d.includes(`Cypress tx 10 ${runId}`))).to.eq(true);
                expect(response.body.data.data[0].direction).to.eq('debit');
                expect(response.body.data.data[0].type).to.eq('transfer');
            });
        });
    });

    it('paginates with per_page and page for sender', () => {
        cy.apiWalletDashboard(recipientToken).then((recipientDashboard) => {
            recipientWalletId = recipientDashboard.body.data.wallet.wallet_id;

            Cypress._.times(transferCount, (index) => {
                const n = index + 1;
                cy.apiWalletTransfer({
                    token: senderToken,
                    recipientWalletId,
                    amount: transferAmount,
                    description: `Cypress page tx ${n} ${runId}`,
                    idempotencyKey: `cypress-page-${runId}-${n}`,
                });
            });

            cy.apiWalletTransactions({ token: senderToken, per_page: 5, page: 1 }).then((pageOne) => {
                expect(pageOne.body.data.data).to.have.length(5);
                expect(pageOne.body.data.last_page).to.be.at.least(2);

                cy.apiWalletTransactions({ token: senderToken, per_page: 5, page: 2 }).then((pageTwo) => {
                    expect(pageTwo.body.data.current_page).to.eq(2);
                    expect(pageTwo.body.data.data).to.have.length.of.at.least(1);

                    const pageOneIds = pageOne.body.data.data.map((row) => row.id);
                    const pageTwoIds = pageTwo.body.data.data.map((row) => row.id);
                    expect(Cypress._.intersection(pageOneIds, pageTwoIds)).to.have.length(0);
                });
            });
        });
    });

    it('filters by search, type, direction, and date for sender', () => {
        cy.apiWalletDashboard(recipientToken).then((recipientDashboard) => {
            recipientWalletId = recipientDashboard.body.data.wallet.wallet_id;

            cy.apiWalletTransfer({
                token: senderToken,
                recipientWalletId,
                amount: transferAmount,
                description: `Cypress search target ${runId}`,
                note: `Find me ${runId}`,
                idempotencyKey: `cypress-search-${runId}`,
            }).then(() => {
                cy.apiWalletTransactions({
                    token: senderToken,
                    search: `Cypress search target ${runId}`,
                }).then((searchResponse) => {
                    expect(searchResponse.body.data.total).to.be.at.least(1);
                    expect(searchResponse.body.data.data[0].description).to.include(`Cypress search target ${runId}`);
                });

                cy.apiWalletTransactions({
                    token: senderToken,
                    search: `Find me ${runId}`,
                }).then((noteSearch) => {
                    expect(noteSearch.body.data.total).to.be.at.least(1);
                    expect(noteSearch.body.data.data[0].note).to.include(`Find me ${runId}`);
                });

                cy.apiWalletTransactions({
                    token: senderToken,
                    type: 'transfer',
                    direction: 'debit',
                }).then((filtered) => {
                    expect(filtered.body.data.total).to.be.at.least(1);
                    filtered.body.data.data.forEach((row) => {
                        expect(row.type).to.eq('transfer');
                        expect(row.direction).to.eq('debit');
                    });
                });

                const today = new Date().toISOString().slice(0, 10);
                cy.apiWalletTransactions({
                    token: senderToken,
                    date_from: today,
                    date_to: today,
                }).then((dateFiltered) => {
                    expect(dateFiltered.body.data.total).to.be.at.least(1);
                });
            });
        });
    });

    it('recipient sees credit transfers only and search is scoped to their wallet', () => {
        cy.apiWalletDashboard(recipientToken).then((recipientDashboard) => {
            recipientWalletId = recipientDashboard.body.data.wallet.wallet_id;

            const uniqueDescription = `Recipient credit ${runId}`;

            cy.apiWalletTransfer({
                token: senderToken,
                recipientWalletId,
                amount: transferAmount,
                description: uniqueDescription,
                idempotencyKey: `cypress-recipient-${runId}`,
            }).then(() => {
                cy.apiWalletTransactions({
                    token: recipientToken,
                    search: uniqueDescription,
                }).then((recipientSearch) => {
                    expect(recipientSearch.body.data.total).to.be.at.least(1);
                    expect(recipientSearch.body.data.data[0].direction).to.eq('credit');
                    expect(recipientSearch.body.data.data[0].description).to.eq(uniqueDescription);
                });

                cy.apiWalletTransactions({
                    token: recipientToken,
                    direction: 'credit',
                    type: 'transfer',
                }).then((credits) => {
                    expect(credits.body.data.total).to.be.at.least(1);
                    credits.body.data.data.forEach((row) => {
                        expect(row.direction).to.eq('credit');
                        expect(row.type).to.eq('transfer');
                    });
                });

                cy.apiWalletTransactions({
                    token: recipientToken,
                    direction: 'debit',
                }).then((recipientDebits) => {
                    recipientDebits.body.data.data.forEach((row) => {
                        expect(row.description).not.to.eq(uniqueDescription);
                    });
                });

                cy.apiWalletTransactions({
                    token: senderToken,
                    direction: 'debit',
                    search: uniqueDescription,
                }).then((senderDebits) => {
                    expect(senderDebits.body.data.total).to.be.at.least(1);
                    expect(senderDebits.body.data.data[0].direction).to.eq('debit');

                    cy.apiWalletTransactions({
                        token: recipientToken,
                        direction: 'debit',
                        search: uniqueDescription,
                    }).then((recipientDebitSearch) => {
                        expect(recipientDebitSearch.body.data.total).to.eq(0);
                    });
                });
            });
        });
    });

    it('rejects unauthenticated transaction list requests', () => {
        cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/v1/customer/wallet/transactions`,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(401);
        });
    });
});
