import axios from '../utils/axiosConfig';
import { AUTH_ENDPOINTS } from '../utils/constants';
import { getTranslatedText } from '../utils/helpers';

/** In-memory map of country UUID → { name, code, short_name } from Auth `GET /countries`. */
let fullCountriesMapPromise = null;

const normalizeCountryRow = (row) => {
    if (!row || row.id === undefined || row.id === null) {
        return null;
    }
    const id = String(row.id);
    const nameRaw = row.name;
    const name =
        typeof nameRaw === 'string'
            ? nameRaw
            : getTranslatedText(nameRaw) || (row.text ? getTranslatedText(row.text) : '') || '';
    const shortName = row.short_name || '';
    const code = row.code || shortName || '';
    return {
        id,
        name: name || '—',
        code,
        short_name: shortName,
    };
};

/**
 * Loads all active countries once from Auth and caches a Map by id.
 */
export const ensureCountriesLookupMap = async () => {
    if (fullCountriesMapPromise) {
        return fullCountriesMapPromise;
    }

    fullCountriesMapPromise = (async () => {
        const response = await axios.get(AUTH_ENDPOINTS.COUNTRIES, {
            headers: { Accept: 'application/json' },
        });

        const raw = response.data?.data ?? response.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const map = new Map();

        list.forEach((row) => {
            const rec = normalizeCountryRow(row);
            if (rec) {
                map.set(rec.id, {
                    name: rec.name,
                    code: rec.code,
                    short_name: rec.short_name,
                });
            }
        });

        return map;
    })().catch((err) => {
        fullCountriesMapPromise = null;
        throw err;
    });

    return fullCountriesMapPromise;
};

/**
 * Returns display records for the given country UUIDs (subset of Auth countries index).
 * One HTTP call total until the module cache is cleared.
 *
 * @param {string[]} countryIds
 * @returns {Promise<Record<string, { name: string, code: string, short_name: string }>>}
 */
export const fetchCountryRecordsByIds = async (countryIds = []) => {
    const unique = Array.from(
        new Set(
            (countryIds || [])
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        )
    );

    if (!unique.length) {
        return {};
    }

    const map = await ensureCountriesLookupMap();
    const out = {};
    unique.forEach((id) => {
        if (map.has(id)) {
            out[id] = { ...map.get(id) };
        }
    });
    return out;
};
