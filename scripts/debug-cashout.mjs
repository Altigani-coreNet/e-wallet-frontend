const API = 'http://localhost:8000';

async function main() {
    const loginRes = await fetch(`${API}/api/v2/admin/auth/login`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@corenet-tech.com', password: '12345678' }),
    });
    const login = await loginRes.json();
    const token = login.data?.token || login.token || login.data?.access_token;
    if (!token) {
        console.error('Login failed', login);
        process.exit(1);
    }

    const walletsRes = await fetch(`${API}/api/v2/admin/wallets?wallet_type=master&per_page=1`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const wallets = await walletsRes.json();
    const master = wallets.data?.data?.[0] || wallets.data?.[0];
    if (!master) {
        console.error('No master wallet', wallets);
        process.exit(1);
    }

    const showRes = await fetch(`${API}/api/v2/admin/wallets/${master.id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const show = await showRes.json();
    const balance = show.data?.balance;
    const attempt = Number(balance) + 5000;

    console.log('master id:', master.id);
    console.log('balance:', balance, typeof balance);
    console.log('attempt:', attempt);

    const cashOutRes = await fetch(`${API}/api/v2/admin/wallets/${master.id}/cash-out`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: attempt, description: 'debug insufficient' }),
    });
    const cashOut = await cashOutRes.json();
    console.log('cash-out status:', cashOutRes.status);
    console.log('cash-out body:', JSON.stringify(cashOut, null, 2));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
