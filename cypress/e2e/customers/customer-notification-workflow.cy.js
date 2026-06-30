/**
 * Customer notification workflow E2E (real backend — no fixture seeders)
 *
 * Full flow built inside this spec:
 * register → profile → notifications → login → change password → admin activate →
 * fund master → cash-in → register recipient → transfer → verify inbox at each step.
 *
 * Run in Cypress open:
 *   cypress/e2e/customers/customer-notification-workflow.cy.js
 */

import { configuredTransferFee, transferRecipientNet } from '../../support/walletAccountingHelpers';

describe('Customer notification workflow (real backend)', () => {
    const initialPassword = 'NotifFlow1!';
    const newPassword = 'NotifFlow2!';

    const buildRun = () => {
        const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const digits = stamp.replace(/\D/g, '').slice(-8).padStart(8, '0');

        return {
            phone: `+2499${digits.slice(0, 7)}1`,
            recipientPhone: `+2499${digits.slice(0, 7)}2`,
            profileName: `Notif User ${digits}`,
            recipientName: `Notif Recipient ${digits}`,
            profileEmail: `notif.${digits}@example.com`,
            recipientEmail: `notif.recipient.${digits}@example.com`,
            nationalId: `NID-NOTIF-${digits}`,
            recipientNationalId: `NID-NOTIF-REC-${digits}`,
            transferKey: `notif-transfer-${stamp}`,
        };
    };

    const expectProfileCompleted = (completeResponse) => {
        expect(completeResponse.status, 'profile complete HTTP status').to.be.oneOf([200, 201]);
        expect(completeResponse.body?.success, 'profile complete success flag').to.eq(true);

        const data = completeResponse.body?.data;
        expect(data, `profile complete body: ${JSON.stringify(completeResponse.body)}`).to.exist;

        const completed = data.profile_completed ?? data.profileCompleted ?? data.customer?.profileCompleted;
        expect(completed, 'profile_completed flag').to.eq(true);
    };

    it('delivers system notifications through register, profile, password, cash-in, and transfer', () => {
        const run = buildRun();

        cy.apiOnboardCustomer({ phone: run.phone, password: initialPassword })
            .then(({ customer, token }) => {
                expect(customer.profileCompleted ?? customer.profile_completed).to.eq(false);

                return cy
                    .assertCustomerNotificationsInclude({ token, total: 0 })
                    .then(() => cy.wrap({ customer, token, run }));
            })

            .then((ctx) =>
                cy
                    .apiCompleteCustomerProfileWithCityLookup({
                        token: ctx.token,
                        firstName: ctx.run.profileName,
                        email: ctx.run.profileEmail,
                        nationalId: ctx.run.nationalId,
                        countrySearch: 'Sudan',
                    })
                    .then(({ completeResponse }) => {
                        expectProfileCompleted(completeResponse);
                        return cy.wrap(ctx);
                    })
            )

            .then((ctx) =>
                cy
                    .assertCustomerNotificationsInclude({
                        token: ctx.token,
                        total: 1,
                        titles: ['Application received - we\'re on it'],
                    })
                    .then(() => cy.apiCustomerNotificationsUnreadCount({ token: ctx.token }))
                    .then((response) => {
                        expect(response.body.data).to.eq(1);
                        return cy.wrap(ctx);
                    })
            )

            .then((ctx) =>
                cy.apiCustomerLogin({ phone: ctx.run.phone, password: initialPassword }).then((loginResponse) =>
                    cy
                        .assertCustomerNotificationsInclude({
                            token: loginResponse.body.data.token,
                            total: 1,
                            titles: ['Application received - we\'re on it'],
                        })
                        .then(() =>
                            cy.wrap({
                                ...ctx,
                                token: loginResponse.body.data.token,
                            })
                        )
                )
            )

            .then((ctx) =>
                cy
                    .apiCustomerChangePassword({
                        token: ctx.token,
                        currentPassword: initialPassword,
                        newPassword,
                    })
                    .then((changeResponse) => {
                        expect(changeResponse.body.success).to.eq(true);

                        return cy.assertCustomerNotificationsInclude({
                            token: changeResponse.body.data.token,
                            total: 2,
                            titles: ['Password updated', 'Application received - we\'re on it'],
                        }).then(() =>
                            cy.wrap({
                                ...ctx,
                                token: changeResponse.body.data.token,
                            })
                        );
                    })
            )

            .then((ctx) =>
                cy.apiAdminLogin().then(({ token: adminToken }) =>
                    cy
                        .apiAdminActivateCustomer({ adminToken, customerId: ctx.customer.id })
                        .then((activateResponse) => {
                            expect(activateResponse.status).to.be.oneOf([200, 201]);
                            return cy.wrap({ ...ctx, adminToken });
                        })
                )
            )

            .then((ctx) =>
                cy
                    .apiResolveCustomerWallet({ adminToken: ctx.adminToken, customerToken: ctx.token })
                    .then((walletInfo) => cy.wrap({ ...ctx, ...walletInfo }))
            )

            .then((ctx) =>
                cy.apiEnsureMasterFloat(ctx.adminToken, 1000000).then(() => cy.wrap(ctx))
            )

            .then((ctx) =>
                cy
                    .apiAdminWalletCashIn({
                        adminToken: ctx.adminToken,
                        walletUuid: ctx.walletUuid,
                        amount: 500,
                        description: 'Notification workflow top-up',
                        idempotencyKey: `notif-cashin-${ctx.run.transferKey}`,
                    })
                    .then((cashInResponse) => {
                        expect(cashInResponse.status).to.eq(200);
                        expect(cashInResponse.body.data.amount).to.eq(500);

                        return cy.assertCustomerNotificationsInclude({
                            token: ctx.token,
                            total: 3,
                            titles: [
                                'Money added to your wallet',
                                'Password updated',
                                'Application received - we\'re on it',
                            ],
                            descriptions: ['Your wallet was credited with 500.00 SDG.'],
                        }).then(() => cy.wrap(ctx));
                    })
            )

            .then((ctx) =>
                cy.apiOnboardCustomer({ phone: ctx.run.recipientPhone, password: initialPassword }).then(
                    ({ customer: recipient, token: recipientToken }) =>
                        cy
                            .apiCompleteCustomerProfileWithCityLookup({
                                token: recipientToken,
                                firstName: ctx.run.recipientName,
                                email: ctx.run.recipientEmail,
                                nationalId: ctx.run.recipientNationalId,
                                countrySearch: 'Sudan',
                            })
                            .then(({ completeResponse }) => {
                                expectProfileCompleted(completeResponse);

                                return cy
                                    .apiAdminActivateCustomer({
                                        adminToken: ctx.adminToken,
                                        customerId: recipient.id,
                                    })
                                    .then(() =>
                                        cy.apiResolveCustomerWallet({
                                            adminToken: ctx.adminToken,
                                            customerToken: recipientToken,
                                        })
                                    )
                                    .then((recipientWallet) =>
                                        cy.wrap({
                                            ...ctx,
                                            recipientToken,
                                            recipientWalletPublicId: recipientWallet.walletPublicId,
                                        })
                                    );
                            })
                )
            )

            .then((ctx) =>
                cy
                    .apiWalletTransfer({
                        token: ctx.token,
                        recipientWalletId: ctx.recipientWalletPublicId,
                        amount: 100,
                        description: 'Notification workflow transfer',
                        idempotencyKey: ctx.run.transferKey,
                    })
                    .then((transferResponse) => {
                        expect(transferResponse.status).to.eq(200);
                        expect(transferResponse.body.data.amount).to.eq(100);
                        expect(transferResponse.body.data.fee).to.eq(configuredTransferFee());

                        return cy.assertCustomerNotificationsInclude({
                            token: ctx.token,
                            total: 4,
                            titles: [
                                'Transfer sent',
                                'Money added to your wallet',
                                'Password updated',
                                'Application received - we\'re on it',
                            ],
                            descriptions: [`You sent 100.00 SDG to ${ctx.run.recipientName}.`],
                        }).then(() => cy.wrap(ctx));
                    })
            )

            .then((ctx) =>
                cy.apiCustomerLogin({ phone: ctx.run.recipientPhone, password: initialPassword }).then(
                    (recipientLogin) => {
                        const transferAmount = 100;
                        const recipientNet = transferRecipientNet(transferAmount);

                        return cy.assertCustomerNotificationsInclude({
                            token: recipientLogin.body.data.token,
                            total: 2,
                            titles: [
                                'Money received',
                                'Application received - we\'re on it',
                            ],
                            descriptions: [`You received ${recipientNet.toFixed(2)} SDG from ${ctx.run.profileName}.`],
                        });
                    }
                )
            );
    });
});
