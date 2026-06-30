import { defineConfig } from 'cypress';
import viteConfig from './vite.config.js';
import WebSocket from 'ws';
import { resolveCypressEnvironment } from './cypress/environments.js';

const targetEnv = process.env.CYPRESS_TARGET_ENV || 'development';
const { baseUrl, env: environmentEnv } = resolveCypressEnvironment(targetEnv);

console.log(`[cypress.config] CYPRESS_TARGET_ENV=${targetEnv} apiUrl=${environmentEnv.apiUrl}`);

export default defineConfig({
    e2e: {
        baseUrl,
        supportFile: 'cypress/support/e2e.js',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1280,
        viewportHeight: 720,
        defaultCommandTimeout: 60000,
        requestTimeout: 30000,
        video: false,
        screenshotOnRunFailure: true,
        env: environmentEnv,
        setupNodeEvents(on, config) {
            on('task', {
                /**
                 * Connect to Reverb, authorize with customer JWT, subscribe, then listen
                 * for a broadcast event. No admin API trigger — send from admin dashboard manually.
                 */
                wsCustomerListen({
                    wsUrl,
                    apiUrl,
                    customerToken,
                    channel = 'public-notifications',
                    eventName = 'notification.public',
                    subscribeOnly = false,
                    timeoutMs = 120000,
                }) {
                    const pusherChannel = channel.startsWith('private-') ? channel : `private-${channel}`;

                    return new Promise((resolve) => {
                        const ws = new WebSocket(wsUrl);
                        let subscribed = false;
                        let settled = false;
                        const events = [];

                        const finish = (result) => {
                            if (settled) return;
                            settled = true;
                            clearTimeout(timer);
                            try {
                                ws.close();
                            } catch {
                                // ignore
                            }
                            resolve({ events, ...result });
                        };

                        const timer = setTimeout(
                            () =>
                                finish({
                                    received: false,
                                    subscribed,
                                    reason: subscribeOnly ? 'subscribed' : 'timeout-waiting-for-event',
                                }),
                            subscribeOnly ? 15000 : timeoutMs,
                        );

                        ws.on('message', async (raw) => {
                            let msg;
                            try {
                                msg = JSON.parse(raw.toString());
                            } catch {
                                return;
                            }

                            if (msg.event === 'pusher:connection_established') {
                                try {
                                    const socketId = JSON.parse(msg.data).socket_id;
                                    const authRes = await fetch(`${apiUrl}/api/broadcasting/auth`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Accept: 'application/json',
                                            Authorization: `Bearer ${customerToken}`,
                                        },
                                        body: JSON.stringify({
                                            socket_id: socketId,
                                            channel_name: pusherChannel,
                                        }),
                                    });

                                    const authText = await authRes.text();
                                    if (!authRes.ok) {
                                        return finish({
                                            received: false,
                                            subscribed,
                                            reason: `auth ${authRes.status}`,
                                            authBody: authText,
                                        });
                                    }

                                    let auth;
                                    try {
                                        auth = JSON.parse(authText).auth;
                                    } catch {
                                        return finish({
                                            received: false,
                                            subscribed,
                                            reason: 'auth-empty-or-invalid',
                                            authBody: authText,
                                        });
                                    }

                                    ws.send(
                                        JSON.stringify({
                                            event: 'pusher:subscribe',
                                            data: { auth, channel: pusherChannel },
                                        }),
                                    );
                                } catch (e) {
                                    finish({ received: false, subscribed, reason: `auth-error ${e.message}` });
                                }
                                return;
                            }

                            if (
                                msg.event === 'pusher_internal:subscription_succeeded' &&
                                msg.channel === pusherChannel
                            ) {
                                subscribed = true;
                                if (subscribeOnly) {
                                    finish({ received: false, subscribed: true, reason: 'subscribed' });
                                }
                                return;
                            }

                            if (msg.event === 'pusher:error') {
                                events.push({ event: msg.event, data: msg.data });
                                return;
                            }

                            if (!subscribeOnly && msg.event === eventName) {
                                events.push({ event: msg.event, data: msg.data });
                                finish({
                                    received: true,
                                    subscribed: true,
                                    payload: msg.data,
                                    reason: 'event-received',
                                });
                            }
                        });

                        ws.on('error', (e) =>
                            finish({ received: false, subscribed, reason: String(e.message || e) }),
                        );
                    });
                },
            });

            return config;
        },
    },
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
            viteConfig,
        },
        supportFile: 'cypress/support/component.js',
        specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
        indexHtmlFile: 'cypress/support/component-index.html',
    },
});
