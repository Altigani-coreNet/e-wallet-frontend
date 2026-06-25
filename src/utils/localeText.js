export const resolveLocaleText = (value, preferredLocales = ['en', 'ar']) => {
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '';

        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return resolveLocaleText(parsed, preferredLocales);
            } catch {
                return trimmed;
            }
        }

        return trimmed;
    }

    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            for (const item of value) {
                const normalized = resolveLocaleText(item, preferredLocales);
                if (normalized) return normalized;
            }
            return '';
        }

        for (const locale of preferredLocales) {
            if (value[locale]) {
                return resolveLocaleText(value[locale], preferredLocales);
            }
        }

        for (const key of Object.keys(value)) {
            const normalized = resolveLocaleText(value[key], preferredLocales);
            if (normalized) return normalized;
        }

        return '';
    }

    return String(value);
};

export default resolveLocaleText;
