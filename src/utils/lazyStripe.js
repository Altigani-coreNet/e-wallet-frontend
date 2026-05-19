/** Lazy Stripe.js — only loads when checkout calls getStripePromise() (payment-link routes). */

let stripePromiseCache = null;

export function getStripePromise() {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
    if (!publishableKey) {
        return Promise.resolve(null);
    }
    if (!stripePromiseCache) {
        stripePromiseCache = import('@stripe/stripe-js').then(({ loadStripe }) =>
            loadStripe(publishableKey)
        );
    }
    return stripePromiseCache;
}
