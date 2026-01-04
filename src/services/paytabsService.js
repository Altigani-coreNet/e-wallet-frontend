import axios from 'axios';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

export const generateQrCode = async (amount) => {
  const token = getApiToken();
  const response = await axios.post(
    SOFTPOS_ENDPOINTS.PAYTABS.GENERATE_QR,
    { amount },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const checkStatus = async (tranRef) => {
  const token = getApiToken();
  const response = await axios.get(
    SOFTPOS_ENDPOINTS.PAYTABS.CHECK_STATUS(tranRef),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );
  return response.data;
};
















