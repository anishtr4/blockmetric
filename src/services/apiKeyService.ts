import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const createApiKey = async (name: string, allowedOrigins: string[]) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/keys`,
    { name, allowedOrigins },
    getAuthHeader()
  );
  return response.data;
};

export const getApiKeys = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/api/keys`,
    getAuthHeader()
  );
  return response.data;
};

export const deleteApiKey = async (key: string) => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/keys/${key}`,
    getAuthHeader()
  );
  return response.data;
};