import axios from 'axios';
import { webodmConfig } from './config';

const api = axios.create({
  baseURL: webodmConfig.apiUrl,
  headers: {
    'Authorization': `Token ${webodmConfig.apiToken}`,
    'Content-Type': 'application/json',
  },
});

export default api;