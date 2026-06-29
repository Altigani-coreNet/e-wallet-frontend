/**
 * Standalone customer WebSocket listener — send CUSTOMER notification from admin yourself.
 *
 * Run: node scripts/ws-customer-check.cjs
 *
 * Env: CUSTOMER_TOKEN, API_URL, WS_URL, CHANNEL, LISTEN_EVENT
 */
const WebSocket = require('ws');

const API = process.env.API_URL || 'http://193.123.83.134:91';
const WS_URL =
    process.env.WS_URL ||
    'ws://193.123.83.134:91/app/cp_live_v1_9f4a2d1b7c8e3f6a?protocol=7&client=js&version=8.4.0';
const TOKEN =
    process.env.CUSTOMER_TOKEN ||
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZW1haWwiOiIrMjQ5MTIzNDU2NzgiLCJ0eXBlIjoiY3VzdG9tZXIiLCJpYXQiOjE3ODIzODc5NDMsImV4cCI6MTc4Mjk5Mjc0M30.F8masbyM6dyYWz05oTpVnt2i5BPEuqsmbMkufyrQsDQ';
const LISTEN_EVENT = process.env.LISTEN_EVENT || 'notification.customer';

(async () => {
    const prof = await fetch(`${API}/api/v1/customer/profile`, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
    });
    console.log('PROFILE', prof.status);
    if (!prof.ok) {
        console.log(await prof.text());
        console.log('Token invalid — fix CUSTOMER_TOKEN first.');
        return;
    }
    const profile = await prof.json();
    const customerId = profile?.data?.customer?.id ?? profile?.data?.id;
    console.log('Customer id:', customerId);

    const channel =
        process.env.CHANNEL || `private-customer-notifications.${customerId}`;

    console.log('\n--- WebSocket listener ---');
    console.log('Channel:', channel);
    console.log('Waiting for event:', LISTEN_EVENT);
    console.log(`>>> Admin → Notifications → target CUSTOMER → customer id ${customerId} <<<\n`);

    const ws = new WebSocket(WS_URL);

    ws.on('open', () => console.log('WS connected ->', WS_URL));

    ws.on('message', async (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch {
            console.log('WS <- (raw)', raw.toString());
            return;
        }

        if (msg.event === 'pusher:connection_established') {
            const socketId = JSON.parse(msg.data).socket_id;
            console.log('Socket id:', socketId);

            const authRes = await fetch(`${API}/api/broadcasting/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${TOKEN}`,
                },
                body: JSON.stringify({ socket_id: socketId, channel_name: channel }),
            });
            const authText = await authRes.text();
            console.log('AUTH', authRes.status, authText ? authText.slice(0, 120) : '(empty)');

            if (!authRes.ok) {
                ws.close();
                return;
            }

            let auth;
            try {
                auth = JSON.parse(authText).auth;
            } catch {
                console.log('AUTH response is not JSON — check BROADCAST_CONNECTION=reverb and config:clear on server.');
                ws.close();
                return;
            }

            ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth, channel } }));
            return;
        }

        if (msg.event === 'pusher_internal:subscription_succeeded') {
            console.log('SUBSCRIBED OK ->', msg.channel);
            console.log('Listening... send CUSTOMER notification from admin dashboard.\n');
            return;
        }

        if (msg.event === 'pusher:error') {
            console.log('PUSHER ERROR', msg.data);
            return;
        }

        if (msg.event === LISTEN_EVENT) {
            console.log('\n========== RECEIVED ==========');
            console.log('Event:', msg.event);
            console.log('Channel:', msg.channel);
            console.log('Data:', msg.data);
            console.log('==============================\n');
            return;
        }

        if (msg.event && !msg.event.startsWith('pusher')) {
            console.log('WS event:', msg.event, msg.data);
        }
    });

    ws.on('error', (e) => console.log('WS ERROR', e.message));
    ws.on('close', (code) => console.log('WS closed', code));
})();
