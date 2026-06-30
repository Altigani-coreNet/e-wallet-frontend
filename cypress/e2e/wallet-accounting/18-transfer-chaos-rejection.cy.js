/**
 * Chaos transfer — randomly inject invalid payloads (~40% rejection rate).
 *
 * Verifies rejected transfers return 4xx (never 5xx), leave wallet balances
 * unchanged, and keep the balance sheet balanced with zero ledger delta.
 * Valid transfers still reflect correctly in wallets and accounting.
 *
 * Reproduce a sequence:
 *   npx cypress run --env chaosSeed=123,chaosCount=20
 */

import {
    assertAccountingDelta,
    buildInvalidTransferPayload,
    chaosPayloadKeySlug,
    configuredTransferFee,
    expectedWalletOperationDelta,
    mulberry32,
    transferRecipientNet,
    zeroAccountingDelta,
} from '../../support/walletAccountingHelpers';

const REJECTION_RATE = 0.4;
const VALID_TRANSFER_AMOUNT = 5;
const SENDER_FUND_AMOUNT = 500;

function runChaosIteration(index, state, rng, ctx) {
    if (index >= ctx.chaosCount) {
        return cy.wrap(state, { log: false });
    }

    const isCorrupt = rng() < REJECTION_RATE;
    const iterationLabel = `chaos ${index + 1}/${ctx.chaosCount}`;

    return cy
        .captureAccountingSnapshot({
            adminToken: ctx.adminToken,
            label: `${iterationLabel} before`,
        })
        .then((before) => {
            if (isCorrupt) {
                const invalid = buildInvalidTransferPayload(rng, {
                    senderWalletId: ctx.sender.walletId,
                    recipientWalletId: ctx.recipient.walletId,
                    senderBalance: state.senderBalance,
                });

                cy.log(`[${iterationLabel}] REJECT: ${invalid.label}`);

                return cy
                    .apiWalletTransferRaw({
                        token: ctx.sender.token,
                        body: invalid.body,
                        idempotencyKey: `chaos-reject-${ctx.runId}-${index}-${chaosPayloadKeySlug(invalid.label)}`,
                        failOnStatusCode: false,
                    })
                    .then((response) => {
                        expect(response.status, `${invalid.label} should reject with 4xx`).to.be.within(
                            400,
                            499
                        );
                        expect(response.status, `${invalid.label} must not cause 5xx`).to.be.lt(500);

                        return cy
                            .assertAccountingUnchanged({
                                before,
                                adminToken: ctx.adminToken,
                                context: `${iterationLabel} ${invalid.label}`,
                            })
                            .then(() =>
                                cy
                                    .apiAdminWalletShow({
                                        adminToken: ctx.adminToken,
                                        walletUuid: ctx.sender.walletUuid,
                                    })
                                    .then((senderShow) => {
                                        expect(senderShow.body.data.balance).to.eq(state.senderBalance);

                                        return cy.apiAdminWalletShow({
                                            adminToken: ctx.adminToken,
                                            walletUuid: ctx.recipient.walletUuid,
                                        });
                                    })
                                    .then((recipientShow) => {
                                        expect(recipientShow.body.data.balance).to.eq(
                                            state.recipientBalance
                                        );

                                        return runChaosIteration(
                                            index + 1,
                                            {
                                                ...state,
                                                rejectCount: state.rejectCount + 1,
                                            },
                                            rng,
                                            ctx
                                        );
                                    })
                            );
                    });
            }

            cy.log(`[${iterationLabel}] VALID transfer ${VALID_TRANSFER_AMOUNT}`);

            return cy
                .apiWalletTransfer({
                    token: ctx.sender.token,
                    recipientWalletId: ctx.recipient.walletId,
                    amount: VALID_TRANSFER_AMOUNT,
                    description: `E2E chaos valid transfer ${index}`,
                    idempotencyKey: `chaos-valid-${ctx.runId}-${index}`,
                })
                .then((response) => {
                    expect(response.status).to.eq(200);

                    const newState = {
                        senderBalance: state.senderBalance - VALID_TRANSFER_AMOUNT,
                        recipientBalance: state.recipientBalance + transferRecipientNet(VALID_TRANSFER_AMOUNT),
                        totalFees: state.totalFees + configuredTransferFee(),
                        successCount: state.successCount + 1,
                        rejectCount: state.rejectCount,
                    };

                    return cy
                        .assertAccountingReflectsOperation({
                            before,
                            adminToken: ctx.adminToken,
                            operation: 'transfer',
                            amount: VALID_TRANSFER_AMOUNT,
                            context: `${iterationLabel} valid transfer`,
                        })
                        .then(() => runChaosIteration(index + 1, newState, rng, ctx));
                });
        });
}

describe('Wallet accounting — transfer chaos rejection', () => {
    let adminToken;
    let sender;
    let recipient;
    let baseline;
    let runId;
    let chaosCount;
    let chaosSeed;

    before(() => {
        runId = Date.now();
        chaosCount = Number(Cypress.env('chaosCount')) || 10;
        chaosSeed = Number(Cypress.env('chaosSeed')) || runId;

        cy.log(`Chaos seed=${chaosSeed}, count=${chaosCount}, rejectionRate=${REJECTION_RATE}`);

        cy.setupWalletAccountingPair(runId).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;
            adminToken = sender.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 1000,
                    description: 'E2E seed master for chaos transfer',
                    idempotencyKey: `seed-chaos-${runId}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: SENDER_FUND_AMOUNT,
                    description: 'Fund sender for chaos transfer',
                    idempotencyKey: `fund-chaos-${runId}`,
                });
            });
        });
    });

    it('survives random invalid transfer payloads while keeping books balanced', () => {
        const rng = mulberry32(chaosSeed);
        const ctx = {
            adminToken,
            sender,
            recipient,
            chaosCount,
            runId,
        };

        cy.captureAccountingSnapshot({ adminToken, label: 'chaos baseline' }).then((snapshot) => {
            baseline = snapshot;
        });

        cy.then(() => {
            const initialState = {
                senderBalance: SENDER_FUND_AMOUNT,
                recipientBalance: 0,
                totalFees: 0,
                successCount: 0,
                rejectCount: 0,
            };

            return runChaosIteration(0, initialState, rng, ctx).then((finalState) => {
                cy.log(
                    `Chaos complete: ${finalState.successCount} valid, ${finalState.rejectCount} rejected`
                );

                cy.apiAdminWalletShow({ adminToken, walletUuid: sender.walletUuid }).then(
                    (senderShow) => {
                        expect(senderShow.body.data.balance).to.eq(finalState.senderBalance);
                    }
                );

                cy.apiAdminWalletShow({ adminToken, walletUuid: recipient.walletUuid }).then(
                    (recipientShow) => {
                        expect(recipientShow.body.data.balance).to.eq(finalState.recipientBalance);
                    }
                );

                const cumulativeExpected =
                    finalState.totalFees > 0
                        ? expectedWalletOperationDelta('transfer', {
                              amount: 0,
                              fee: finalState.totalFees,
                          })
                        : zeroAccountingDelta();

                cy.captureAccountingSnapshot({ adminToken, label: 'chaos final' }).then((final) => {
                    assertAccountingDelta(
                        baseline,
                        final,
                        cumulativeExpected,
                        'chaos cumulative balance sheet'
                    );
                });

                cy.assertBalanceSheetBalanced({
                    adminToken,
                    context: 'chaos transfer end',
                });
            });
        });
    });
});
