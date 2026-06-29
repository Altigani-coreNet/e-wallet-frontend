export const CUSTOMER_MANAGEABLE_STATUSES = ['pending', 'active', 'suspended', 'inactive'];

export const getCustomerId = (customer) => customer?.id ?? null;

export const getCustomerStatusLabelKey = (status) => {
    switch (status) {
        case 'pending':
            return 'customers.pending';
        case 'active':
            return 'customers.active';
        case 'suspended':
            return 'customers.suspended';
        case 'inactive':
            return 'customers.inactive';
        case 'deleted':
            return 'customers.deleted';
        default:
            return 'customers.na';
    }
};

export const getCustomerStatusBadgeClass = (status) => {
    switch (status) {
        case 'active':
            return 'badge-light-success';
        case 'pending':
            return 'badge-light-warning';
        case 'suspended':
            return 'badge-light-danger';
        case 'inactive':
            return 'badge-light-secondary';
        case 'deleted':
            return 'badge-light-dark';
        default:
            return 'badge-light-secondary';
    }
};

/**
 * Display name for a customer's city.
 */
export const getCustomerCityName = (customer) => {
    if (!customer) return null;
    return customer.cityName ?? customer.city_name ?? customer.city?.name ?? customer.city?.text ?? null;
};

/**
 * Display name for a customer's country.
 */
export const getCustomerCountryName = (customer) => {
    if (!customer) return null;
    return customer.countryName ?? customer.country_name ?? customer.country?.name ?? customer.country?.text ?? null;
};

/**
 * Put Sudan first in country select lists.
 */
export const sortCountriesSudanFirst = (countries = []) => {
    const isSudan = (country) => {
        const code = (country.code || '').toUpperCase();
        const label = (country.text || country.name || '').toLowerCase();
        return code === 'SD' || label.includes('sudan');
    };

    const sudan = countries.filter(isSudan);
    const rest = countries.filter((country) => !isSudan(country));

    return [...sudan, ...rest];
};

export const findSudanCountry = (countries = []) =>
    countries.find((country) => {
        const code = (country.code || '').toUpperCase();
        const label = (country.text || country.name || '').toLowerCase();
        return code === 'SD' || label.includes('sudan');
    }) ?? null;
