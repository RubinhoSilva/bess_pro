import axios from 'axios';
import toast from 'react-hot-toast';
import { FrontendCalculationLogger } from './calculationLogger';

// Configuração base da API
const getApiBaseUrl = () => {
  // Verifica múltiplas condições para detectar produção
  const isProduction = import.meta.env.PROD || 
                      import.meta.env.MODE === 'production' || 
                      window.location.hostname !== 'localhost';
  
  if (isProduction) {
    return 'https://api.besspro.vizad.com.br/api/v1';
  }
  
  // Em desenvolvimento, usa localhost
  return 'http://localhost:8010/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

// Logger global para APIs
const apiLogger = new FrontendCalculationLogger('api-global');

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token - check both localStorage and sessionStorage
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log API calls para cálculos e operações importantes
    if (config.url && (
      config.url.includes('calculation') ||
      config.url.includes('solar') ||
      config.url.includes('pvgis') ||
      config.url.includes('irradiation') ||
      config.url.includes('bess') ||
      config.url.includes('financial')
    )) {
      apiLogger.apiCall(
        `${config.method?.toUpperCase()} ${config.url}`,
        config.method?.toUpperCase() || 'GET',
        config.data || config.params
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log responses para cálculos e operações importantes
    if (response.config.url && (
      response.config.url.includes('calculation') ||
      response.config.url.includes('solar') ||
      response.config.url.includes('pvgis') ||
      response.config.url.includes('irradiation') ||
      response.config.url.includes('bess') ||
      response.config.url.includes('financial')
    )) {
      apiLogger.apiResponse(
        `${response.config.method?.toUpperCase()} ${response.config.url}`,
        response.status,
        response.data
      );
    }

    return response;
  },
  (error) => {
    // Handle auth errors globally
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-remember');
      localStorage.removeItem('auth-expiration');
      sessionStorage.removeItem('auth-token');
      
      // Only redirect if not already on login page to avoid loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Sessão expirada'));
    }
    
    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.error?.details) {
      error.response.data.error.details.forEach((detail: any) => {
        toast.error(detail.msg || detail.message);
      });
    }

    // Handle conflict errors (409) - like duplicate email
    if (error.response?.status === 409) {
      const message = error.response.data?.error?.message || 'Conflito de dados';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post('/auth/login', credentials),
    
    register: (userData: {
      email: string;
      password: string;
      name: string;
      company?: string;
    }) => api.post('/auth/register', userData),
    
    me: () => api.get('/auth/me'),
    
    refreshToken: (refreshToken: string) =>
      api.post('/auth/refresh-token', { refreshToken }),
  },

  // Projects
  projects: {
    list: (params?: {
      page?: number;
      pageSize?: number;
      projectType?: string;
      hasLocation?: boolean;
      searchTerm?: string;
    }) => api.get('/projects', { params }),
    
    get: (id: string) => api.get(`/projects/${id}`),
    
    create: (projectData: any) => api.post('/projects', projectData),
    
    update: (id: string, projectData: any) => api.put(`/projects/${id}`, projectData),
    
    delete: (id: string) => api.delete(`/projects/${id}`),
    
    clone: (id: string, newProjectName: string) =>
      api.post(`/projects/${id}/clone`, { newProjectName }),
  },

  // Leads
  leads: {
    list: (params?: { page?: number; pageSize?: number; searchTerm?: string }) =>
      api.get('/leads', { params }),
    
    get: (id: string) => api.get(`/leads/${id}`),
    
    create: (leadData: any) => api.post('/leads', leadData),
    
    update: (id: string, leadData: any) => api.put(`/leads/${id}`, leadData),
    
    delete: (id: string) => api.delete(`/leads/${id}`),
    
    convert: (id: string, projectData: { projectName: string; projectType: string }) =>
      api.post(`/leads/${id}/convert`, projectData),
  },

  // Models 3D
  models3D: {
    list: (params?: { projectId?: string }) => api.get('/models-3d', { params }),
    
    upload: (formData: FormData) => api.post('/models-3d/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    
    get: (id: string) => api.get(`/models-3d/${id}`),
    
    delete: (id: string) => api.delete(`/models-3d/${id}`),
    
    getSignedUrl: (id: string) => api.get(`/models-3d/${id}/signed-url`),
  },

  // Clients
  clients: {
    list: (params?: { page?: number; pageSize?: number; searchTerm?: string }) =>
      api.get('/clients', { params }),
    
    get: (id: string) => api.get(`/clients/${id}`),
    
    create: (clientData: any) => api.post('/clients', clientData),
    
    update: (id: string, clientData: any) => api.put(`/clients/${id}`, clientData),
    
    delete: (id: string) => api.delete(`/clients/${id}`),
    
    convertLead: (leadId: string) => api.post(`/clients/convert-lead/${leadId}`),
    
    revertToLead: (clientId: string) => api.post(`/clients/revert-to-lead/${clientId}`),
  },

  // Calculations
  calculations: {
    // NOVO: Endpoint standalone sem projeto
    solarSystemStandalone: (data: any) =>
      api.post(`/calculations/solar-system`, data),
    
    // Endpoints legados (mantidos para compatibilidade)
    solarSystem: (projectId: string, data: any) =>
      api.post(`/calculations/projects/${projectId}/solar-system`, data),
    
    financial: (projectId: string, data: any) =>
      api.post(`/calculations/projects/${projectId}/financial-analysis`, data),

    // Generic post method for calculations
    post: (endpoint: string, data: any) => api.post(endpoint, data),
  },
};

export default api;
export { api };