import { AUTH_SERVICE_BASE } from './constants';

/** Normalize API date strings to yyyy-MM-dd for <input type="date" />. */
export function toDateInputValue(value) {
    if (value == null || value === '') return '';
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Build absolute URL for stored advertisement image paths from the API. */
export function advertisementAssetUrl(path) {
    if (!path) return '';
    const p = String(path).trim();
    if (/^https?:\/\//i.test(p)) return p;
    const base = AUTH_SERVICE_BASE.replace(/\/$/, '');
    return `${base}/${p.replace(/^\//, '')}`;
}

/** Open the native date picker when supported (Chrome/Edge). */
export function openNativeDatePicker(input) {
    if (!input) return;
    if (typeof input.showPicker === 'function') {
        try {
            input.showPicker();
            return;
        } catch {
            /* not allowed in some contexts */
        }
    }
    input.focus();
}
