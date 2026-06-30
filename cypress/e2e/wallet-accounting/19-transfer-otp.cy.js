/**
 * Wallet transfer OTP — request OTP, then confirm with mock code 111111.
 *
 * Flow under test:
 *   POST /wallet/transfer/otp → POST /wallet/transfer (otp_token + otp)
 *
 * Requires backend OTP_MOCK_CODE=111111 (Cypress env otpMockCode).
 */

import { assertApiRejects, mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — transfer OTP', () => {
    let adminToken;
    let sender;
    let recipient;

    before(() => {
        cy.setupWalletAccountingPair(Date.now()).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;
            adminToken = sender.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 200,
                    description: 'E2E seed master for transfer OTP',
                    idempotencyKey: `seed-otp-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: 80,
                    description: 'Fund sender for transfer OTP',
                    idempotencyKey: `fund-otp-${Date.now()}`,
                });
            });
        });
    });

    it('issues otp_token from transfer OTP endpoint', () => {
        const idempotencyKey = `otp-issue-${Date.now()}`;

        cy.apiWalletTransferOtp({
            token: sender.token,
            recipientWalletId: recipient.walletId,
            amount: 10,
            description: 'OTP issue test',
            idempotencyKey,
        }).then((response) => {
            expect(response.status).to.be.oneOf([200, 201]);
            expect(response.body.success).to.eq(true);
            expect(response.body.data.otp_token).to.be.a('string').and.not.be.empty;
            expect(response.body.data.expires_at).to.be.a('string').and.not.be.empty;
        });
    });

    it('rejects transfer without prior OTP', () => {
        cy.apiWalletTransfer({
            token: sender.token,
            recipientWalletId: recipient.walletId,
            amount: 10,
            description: 'No OTP step',
            skipOtp: true,
            otpToken: 'invalid-token',
            failOnStatusCode: false,
        }).then((response) => {
            assertApiRejects(response, { messageIncludes: 'Invalid or expired OTP' });
        });
    });

    it('rejects transfer when OTP payload does not match', () => {
        const idempotencyKey = `otp-mismatch-${Date.now()}`;

        cy.apiWalletTransferOtp({
            token: sender.token,
            recipientWalletId: recipient.walletId,
            amount: 20,
            description: 'Mismatch test',
            idempotencyKey,
        }).then((otpResponse) => {
            const otpToken = otpResponse.body.data.otp_token;

            cy.apiWalletTransfer({
                token: sender.token,
                recipientWalletId: recipient.walletId,
                amount: 10,
                description: 'Mismatch test',
                idempotencyKey,
                otpToken,
                failOnStatusCode: false,
            }).then((response) => {
                assertApiRejects(response, { messageIncludes: 'OTP does not match this transfer' });
            });
        });

        cy.apiAdminWalletShow({ adminToken, walletUuid: sender.walletUuid }).then((show) => {
            expect(show.body.data.balance).to.eq(80);
        });
    });

    it('completes transfer with mock OTP 111111', () => {
        const amount = 12;
        const idempotencyKey = `otp-success-${Date.now()}`;

        cy.captureAccountingSnapshot({ adminToken, label: 'before OTP success transfer' }).then((before) => {
            cy.apiWalletDashboard(sender.token).then((dashBefore) => {
                const balanceBefore = dashBefore.body.data.wallet.balance;

                cy.apiWalletTransferOtp({
                    token: sender.token,
                    recipientWalletId: recipient.walletId,
                    amount,
                    description: 'OTP success test',
                    idempotencyKey,
                }).then((otpResponse) => {
                    expect(otpResponse.body.success).to.eq(true);

                    cy.apiWalletTransfer({
                        token: sender.token,
                        recipientWalletId: recipient.walletId,
                        amount,
                        description: 'OTP success test',
                        idempotencyKey,
                        otpToken: otpResponse.body.data.otp_token,
                        otp: mockOtpCode(),
                    }).then((transferResponse) => {
                        expect(transferResponse.status).to.eq(200);
                        expect(transferResponse.body.success).to.eq(true);
                        expect(transferResponse.body.data.amount).to.eq(amount);
                        expect(transferResponse.body.data.sender_wallet.balance).to.eq(balanceBefore - amount);
                    });
                });

                cy.assertAccountingReflectsOperation({
                    before,
                    adminToken,
                    operation: 'transfer',
                    amount,
                    context: 'transfer OTP success',
                });
            });
        });
    });

    it('rejects reusing a consumed OTP', () => {
        const amount = 5;
        const idempotencyKey = `otp-single-use-${Date.now()}`;

        cy.apiWalletTransferOtp({
            token: sender.token,
            recipientWalletId: recipient.walletId,
            amount,
            description: 'Single use OTP',
            idempotencyKey,
        }).then((otpResponse) => {
            const otpToken = otpResponse.body.data.otp_token;

            cy.apiWalletTransfer({
                token: sender.token,
                recipientWalletId: recipient.walletId,
                amount,
                description: 'Single use OTP',
                idempotencyKey,
                otpToken,
                otp: mockOtpCode(),
            }).then((first) => {
                expect(first.status).to.eq(200);
                expect(first.body.success).to.eq(true);

                cy.apiWalletTransfer({
                    token: sender.token,
                    recipientWalletId: recipient.walletId,
                    amount,
                    description: 'Single use OTP',
                    idempotencyKey: `otp-retry-${Date.now()}`,
                    otpToken,
                    otp: mockOtpCode(),
                    skipOtp: true,
                    failOnStatusCode: false,
                }).then((second) => {
                    assertApiRejects(second, { messageIncludes: 'Invalid or expired OTP' });
                });
            });
        });
    });
});
