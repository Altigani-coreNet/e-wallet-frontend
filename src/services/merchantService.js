import axios from 'axios';
import { AUTH_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

export const getMerchantCurrency = async () => {
    const token = getToken();

    try {
        const response = await axios.get(AUTH_ENDPOINTS.MERCHANT_CURRENCY, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching merchant currency:', error);
        throw error;
    }
};

