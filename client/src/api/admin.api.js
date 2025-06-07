// frontend/src/api/admin.api.js
import apiClient from './index'; // Instance Axios préconfigurée

/**
 * Gère et propage les erreurs API de manière standardisée.
 * @param {Error} error - Objet erreur d'Axios ou natif.
 * @param {string} defaultMessage - Message par défaut en cas d'absence de détails spécifiques.
 * @param {string} apiName - Contexte ou nom de l'appel API (utilisé pour le logging).
 * @throws {object} Objet d'erreur structuré.
 */
const handleError = (error, defaultMessage, apiName = 'AdminAPI') => {
  const response = error.response;
  const errorMessage =
    response?.data?.message || error.message || defaultMessage;

  const errorDetails =
    response?.data?.errors || response?.data?.details || null;

  const status = response?.status;

  console.error(
    `Erreur [${apiName}] (${response?.config?.method?.toUpperCase()} ${response?.config?.url}):`,
    errorMessage,
    response?.data || error
  );

  throw {
    message: errorMessage,
    details: errorDetails,
    status: status,
    rawError: response?.data || error,
  };
};

/**
 * Récupère les données globales du tableau de bord administrateur.
 * @returns {Promise<object>} Résultats structurés pour dashboard admin.
 */
export const getAdminDashboardData = async () => {
  try {
    const response = await apiClient.get('/admin/dashboard/stats');

    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }

    throw new Error(
      response.data?.message || 'Réponse invalide du serveur (dashboard-stats).'
    );
  } catch (error) {
    handleError(
      error,
      'Impossible de charger les données du tableau de bord.',
      'getAdminDashboardData'
    );
  }
};

/**
 * Récupère les journaux de sécurité avec pagination, tri et filtres.
 * @param {object} params - Ex: { page: 1, limit: 20, sort: '-timestamp', action: 'LOGIN_FAIL' }
 * @returns {Promise<object>} Structure normalisée pour les slices.
 */
export const getSecurityLogs = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/security-logs', { params });

    if (response.data?.success) {
      const { data, pagination, totalLogs } = response.data;

      return {
        data: data || [],
        currentPage: pagination?.currentPage || 1,
        totalPages: pagination?.totalPages || 1,
        totalItems: totalLogs || 0,
        limit: pagination?.limit || params.limit || 25,
      };
    }

    throw new Error(
      response.data?.message || 'Réponse invalide (security-logs).'
    );
  } catch (error) {
    handleError(
      error,
      'Impossible de charger les journaux de sécurité.',
      'getSecurityLogs'
    );
  }
};

// --------------------------------------------------------------------------------------
// Fonctions alternatives en cas de séparation des points d’accès du dashboard admin
// --------------------------------------------------------------------------------------

/*
// Récupère les cartes de résumé (total utilisateurs, factures, etc.)
export const getAdminSummaryCards = async () => {
  try {
    const response = await apiClient.get('/admin/dashboard/summary-cards');

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Réponse invalide (summary-cards).');
  } catch (error) {
    handleError(error, 'Erreur chargement cartes résumé.', 'getAdminSummaryCards');
  }
};

// Données pour le graphique des ventes
export const getAdminSalesChartData = async () => {
  try {
    const response = await apiClient.get('/admin/dashboard/sales-chart');

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Réponse invalide (sales-chart).');
  } catch (error) {
    handleError(error, 'Erreur chargement graph ventes.', 'getAdminSalesChartData');
  }
};

// Graphique des rôles utilisateurs
export const getAdminUserRolesChartData = async () => {
  try {
    const response = await apiClient.get('/admin/dashboard/user-roles-chart');

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Réponse invalide (user-roles-chart).');
  } catch (error) {
    handleError(error, 'Erreur chargement graph rôles.', 'getAdminUserRolesChartData');
  }
};

// Activités récentes du système
export const getAdminRecentActivities = async (limit = 5) => {
  try {
    const response = await apiClient.get('/admin/dashboard/recent-activities', {
      params: { limit },
    });

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Réponse invalide (recent-activities).');
  } catch (error) {
    handleError(error, 'Erreur chargement activités récentes.', 'getAdminRecentActivities');
  }
};
*/

// --------------------------------------------------------------------------------------
// Ajouter ici d’autres fonctions API liées à l’administration si besoin
// --------------------------------------------------------------------------------------
