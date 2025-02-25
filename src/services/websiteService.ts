import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Website {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  createdAt: string;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const getWebsites = async (): Promise<Website[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/websites`,
    getAuthHeader()
  );
  return response.data;
};

export const createWebsite = async (data: { name: string; domain: string }): Promise<Website> => {
  const response = await axios.post(
    `${API_BASE_URL}/api/websites`,
    data,
    getAuthHeader()
  );
  return response.data;
};

export const deleteWebsite = async (id: string): Promise<void> => {
  await axios.delete(
    `${API_BASE_URL}/api/websites/${id}`,
    getAuthHeader()
  );
};

export const updateWebsite = async (id: string, data: { name: string; domain: string }): Promise<Website> => {
  const response = await axios.put(
    `${API_BASE_URL}/api/websites/${id}`,
    data,
    getAuthHeader()
  );
  return response.data;
};