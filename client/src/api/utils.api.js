// frontend/src/api/utils.api.js
import { ApiError } from './ApiError'; // Importer la classe d'erreur personnalisée

/**
 * Fonction utilitaire centralisée pour gérer et propager les erreurs d'API (typiquement d'Axios).
 * Elle logue l'erreur en console et propage une instance d'ApiError.
 */
export const handleError = (error, defaultMessage, apiContext = 'API') => {
  let errorMessage = defaultMessage;
  let errorDetails = null;
  let status = null;
  let isNetworkError = false;
  let isCancelRequest = false; // Renommé pour éviter confusion avec error.isCancel qui peut ne pas exister
  const originalErrorObject = error;

  if (error && typeof error.isAxiosError === 'boolean' && error.isAxiosError) {
    // C'est une erreur Axios
    isCancelRequest = !!(error.constructor.name === 'Cancel' || error.message === 'canceled'); // Meilleure détection d'annulation

    if (error.response) {
      // Le serveur a répondu avec un statut d'erreur (4xx, 5xx)
      const responseData = error.response.data;
      status = error.response.status;

      if (typeof responseData === 'object' && responseData !== null) {
        errorMessage = responseData.message || responseData.error?.message || responseData.error || error.message || defaultMessage;
        errorDetails = responseData.errors || responseData.details || null; // 'errors' pour validation
      } else if (typeof responseData === 'string' && responseData.length > 0) {
        errorMessage = responseData;
      } else {
        // Si response.data est vide ou non conforme, utiliser le message d'erreur d'Axios
        errorMessage = error.message || defaultMessage;
      }
      console.error(
        `Erreur ${apiContext} (Status ${status} - ${error.config?.method?.toUpperCase()} ${error.config?.url}):`,
        errorMessage,
        errorDetails ? `Détails: ${JSON.stringify(errorDetails)}` : '',
        "\nRéponse Serveur:", error.response.data,
      );
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion réseau ou l'état du serveur.";
      isNetworkError = true;
      console.error(
        `Erreur Réseau ${apiContext} (${error.config?.method?.toUpperCase()} ${error.config?.url}):`,
        errorMessage, error.request
      );
    } else {
      // Erreur de configuration de la requête Axios
      errorMessage = error.message || defaultMessage;
      console.error(
        `Erreur de Configuration ${apiContext} (${error.config?.method?.toUpperCase()} ${error.config?.url || 'URL non disponible'}):`,
        errorMessage, error
      );
    }
  } else if (error instanceof Error) {
    // Erreur JavaScript standard
    errorMessage = error.message || defaultMessage;
    console.error(`Erreur Inattendue (non-Axios) ${apiContext}:`, errorMessage, error);
  } else {
    // Autre type d'erreur (ex: chaîne lancée, bien que déconseillé)
    errorMessage = typeof error === 'string' ? error : defaultMessage;
    console.error(`Erreur Littérale Lancée ${apiContext}:`, errorMessage, error);
  }

  // Lancer une instance de la classe d'erreur personnalisée
  throw new ApiError(
    errorMessage,
    status,
    errorDetails,
    isNetworkError,
    isCancelRequest,
    originalErrorObject
  );
};


/**
 * Fonction utilitaire pour construire une chaîne de requête à partir d'un objet de paramètres.
 */
export const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  return queryString ? `?${queryString}` : '';
};