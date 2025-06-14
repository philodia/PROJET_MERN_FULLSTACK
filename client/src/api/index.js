// frontend/src/api/index.js
import axios from 'axios';
import { store } from '../app/store';
// IMPORTER LE NOM CORRECT EXPORTÉ PAR authSlice.js
import { logoutClientSideInternal } from '../features/auth/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erreur de configuration de la requête Axios:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, request, message, config } = error;
    if (response) {
      const status = response.status;
      const url = config?.url;
      const isAuthenticated = store.getState().auth.isAuthenticated; // Vérifier l'état actuel
      const isLoginAttempt = url?.includes('/auth/login');

      if (status === 401 && isAuthenticated && !isLoginAttempt) {
        console.warn(`Token invalide ou expiré sur ${url}. Déconnexion client.`);
        // UTILISER L'ACTION CORRECTEMENT IMPORTÉE
        store.dispatch(logoutClientSideInternal());
      } else if (status === 403) {
        console.warn(`Accès refusé (403) sur ${url}. L'utilisateur n'a pas les permissions.`);
      }
    } else if (request) {
      console.error(`API Erreur - Pas de réponse du serveur pour la requête à ${config?.url}:`, message);
    } else {
      console.error('API Erreur - Erreur de configuration de la requête:', message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;