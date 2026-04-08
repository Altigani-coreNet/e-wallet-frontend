/**
 * Resolve an API-provided asset path to a browser-loadable URL.
 *
 * Many backend payloads return relative paths (e.g. "uploads/...", "storage/...", "/uploads/...").
 * UI components should always render absolute URLs so images don't incorrectly point to the frontend origin.
 */
export const ensureAbsoluteUrl = (base, value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Already absolute or special schemes we should pass through.
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    }

    const normalizedBase = (base || '').replace(/\/+$/, '');
    const normalizedPath = trimmed.replace(/^\/+/, '').replace(/\\/g, '/');
    return normalizedBase ? `${normalizedBase}/${normalizedPath}` : `/${normalizedPath}`;
};

/**
 * For Laravel-style storage paths, prefer `/storage/<path>` unless the payload already includes
 * a more explicit prefix like `uploads/`.
 */
export const resolveBackendAssetUrl = (base, value) => {
    const abs = ensureAbsoluteUrl('', typeof value === 'string' ? value : '');
    if (!abs) return null;
    // If it was already absolute (http/data/blob), ensureAbsoluteUrl('', ...) returned it as-is.
    if (/^(https?:)?\/\//i.test(abs) || abs.startsWith('data:') || abs.startsWith('blob:')) {
        return abs;
    }

    const raw = String(value || '').trim().replace(/^\/+/, '').replace(/\\/g, '/');
    if (!raw) return null;

    // Common patterns seen in this codebase:
    // - "uploads/..." should be served from base directly.
    // - "storage/..." might already be complete; keep it.
    // - otherwise assume it's a storage-relative path and prefix with /storage/.
    if (raw.startsWith('uploads/')) return ensureAbsoluteUrl(base, raw);
    if (raw.startsWith('storage/')) return ensureAbsoluteUrl(base, raw);
    return ensureAbsoluteUrl(base, `storage/${raw}`);
};

