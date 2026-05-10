/**
 * Optional Metronic RTL bundles (add files from your Metronic theme):
 *   public/assets/plugins/global/plugins.bundle.rtl.css
 *   public/assets/css/style.bundle.rtl.css
 *
 * Layout mirroring for Arabic is handled in MainLayout.css — these bundles
 * mainly flip Bootstrap utilities (ms/me, etc.) when present.
 */

const LINK_IDS = {
    plugins: 'kt-metronic-plugins-bundle-rtl',
    style: 'kt-metronic-style-bundle-rtl',
};

const HREFS = {
    plugins: '/assets/plugins/global/plugins.bundle.rtl.css',
    style: '/assets/css/style.bundle.rtl.css',
};

function ensureLink(id, href, { onLoad, onError } = {}) {
    let el = document.getElementById(id);
    if (el) {
        onLoad?.();
        return el;
    }
    el = document.createElement('link');
    el.id = id;
    el.rel = 'stylesheet';
    el.type = 'text/css';
    el.href = href;
    if (onLoad) el.onload = onLoad;
    if (onError) el.onerror = onError;
    document.head.appendChild(el);
    return el;
}

function removeLink(id) {
    document.getElementById(id)?.remove();
}

/**
 * @param {boolean} rtl
 */
export function applyMetronicRtlStylesheets(rtl) {
    if (!rtl) {
        removeLink(LINK_IDS.plugins);
        removeLink(LINK_IDS.style);
        return;
    }

    ensureLink(LINK_IDS.plugins, HREFS.plugins, {
        onError: () => {},
    });

    if (!document.getElementById(LINK_IDS.style)) {
        ensureLink(LINK_IDS.style, HREFS.style, {
            onError: () => {},
        });
    }
}

/**
 * Match Metronic HTML: dir + non-standard `direction` + inline direction.
 * @param {'ltr' | 'rtl'} dir
 */
export function applyDocumentDirection(dir) {
    document.documentElement.dir = dir;
    document.documentElement.setAttribute('direction', dir);
    document.documentElement.style.setProperty('direction', dir);

    document.body.dir = dir;
    document.body.setAttribute('direction', dir);
    document.body.style.setProperty('direction', dir);
}
