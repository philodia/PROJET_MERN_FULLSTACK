// frontend/src/api/index.js
import axios from 'axios';
import { store } from '../app/store'; // Pour accéder au token et dispatcher
import { logout } from '../features/auth/authSlice'; // Uniquement l'action logout nécessaire ici

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Décommentez la ligne suivante si votre backend utilise des cookies HTTP Only pour JWT
  // ET que le frontend et le backend sont sur des origines (domaines/ports) différentes,
  // même en développement (ex: frontend sur localhost:3000, backend sur localhost:5000).
  // Assurez-vous que votre backend est configuré pour CORS avec `Access-Control-Allow-Credentials: true`.
  // withCredentials: true,
});

// Intercepteur de requête pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Les erreurs ici sont généralement des problèmes de configuration de la requête elle-même
    console.error('Erreur de configuration de la requête Axios:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs globales
apiClient.interceptors.response.use(
  (response) => {
    // Toute réponse avec un statut dans la plage 2xx passera ici
    return response;
  },
  (error) => {
    // Toute réponse avec un statut en dehors de la plage 2xx passera ici
    const { response, request, message } = error;

    if (response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      console.error('API Erreur - Réponse:', response.data);
      console.error('API Erreur - Statut:', response.status);
      // console.error('API Erreur - Headers:', response.headers); // Moins utile généralement

      if (response.status === 401) {
        // Si l'utilisateur était authentifié, le déconnecter.
        // Cela gère les tokens expirés ou invalides pour les utilisateurs connectés.
        // Ne pas déconnecter si l'erreur 401 provient d'une tentative de connexion échouée.
        if (store.getState().auth.isAuthenticated) {
          console.warn('Token invalide ou expiré. Déconnexion de l\'utilisateur.');
          store.dispatch(logout());
          // La redirection vers /login devrait être gérée par l'UI
          // en observant le changement de l'état isAuthenticated.
        }
        // Le thunk qui a initié cet appel API recevra cette erreur 401
        // et pourra mettre à jour son propre état d'erreur (par exemple, dans authSlice).
      } else if (response.status === 403) {
        // Erreur 403 (Interdit) - L'utilisateur est authentifié mais n'a pas les droits.
        // Le thunk/service appelant devrait gérer l'affichage d'un message approprié.
        console.warn('Accès refusé (403). L\'utilisateur n\'a pas les permissions.');
      }
      // Pour les autres erreurs serveur (4xx, 5xx), le thunk/service appelant
      // est responsable de la gestion et de l'affichage du message d'erreur.
    } else if (request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      // (ex: problème réseau, serveur backend non démarré)
      console.error('API Erreur - Pas de réponse:', error.message); // error.message contient plus d'infos ici
    } else {
      // Quelque chose s'est produit lors de la configuration de la requête qui a déclenché une erreur
      console.error('API Erreur - Configuration requête:', message);
    }

    // Propager l'objet d'erreur Axios complet.
    // Le bloc `catch` dans le thunk (ou l'appel API) pourra alors inspecter
    // `error.response`, `error.request`, `error.message` pour une gestion plus fine.
    return Promise.reject(error);
  }
);

export default apiClient;