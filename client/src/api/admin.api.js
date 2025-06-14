// frontend/src/api/admin.api.js
import apiClient from './index'; // Votre instance Axios configurée
import { handleError } from './utils.api'; // Importer la fonction de gestion d'erreur

const ADMIN_API_BASE_URL = '/admin'; // Préfixe pour les routes admin, ex: /api/admin

/**
 * Récupère les données complètes pour le tableau de bord administrateur.
 * @returns {Promise<object>} Les données du dashboard structurées.
 */
export const getAdminDashboardData = async () => {
  try {
    const response = await apiClient.get(`${ADMIN_API_BASE_URL}/dashboard-stats`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    // Si success:false ou data est manquant mais la requête est 2xx
    throw new Error(response.data?.message || "Réponse invalide du serveur pour les données du dashboard.");
  } catch (error) {
    // Utiliser handleError
    handleError(error, "Impossible de charger les données du tableau de bord.", "AdminAPI:getAdminDashboardData");
  }
};

/**
 * Récupère les journaux de sécurité avec pagination, filtres et tri.
 * @param {object} params - Paramètres de requête (page, limit, sort, filtres...).
 * @returns {Promise<object>} Objet structuré pour le slice:
 *                            { data: logs[], currentPage, totalPages, totalItems, limit }
 */
export const getSecurityLogs = async (params) => {
  try {
    const response = await apiClient.get(`${ADMIN_API_BASE_URL}/security-logs`, { params });
    if (response.data && response.data.success) {
      // Transformer la réponse pour correspondre à ce que securityLogSlice.js attend
      return {
        data: response.data.data,
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.totalLogs,
        limit: response.data.pagination.limit,
      };
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour les journaux de sécurité.");
  } catch (error) {
    // Utiliser handleError
    handleError(error, "Impossible de charger les journaux de sécurité.", "AdminAPI:getSecurityLogs");
  }
};


// Si vous réactivez les fonctions granulaires pour le dashboard, appliquez handleError aussi :
/*
export const getAdminSummaryCards = async () => {
  try {
    const response = await apiClient.get(`${ADMIN_API_BASE_URL}/dashboard/summary-cards`); // Ajustez l'URL si nécessaire
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Réponse invalide pour les cartes résumé.");
  } catch (error) {
    handleError(error, "Erreur chargement cartes résumé.", "AdminAPI:getAdminSummaryCards");
  }
};

export const getAdminSalesChartData = async () => {
  try {
    const response = await apiClient.get(`${ADMIN_API_BASE_URL}/dashboard/sales-chart`); // Ajustez l'URL
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Réponse invalide pour le graphique des ventes.");
  } catch (error) {
    handleError(error, "Erreur chargement données graph ventes.", "AdminAPI:getAdminSalesChartData");
  }
};

export const getAdminUserRolesChartData = async () => {
  try {
    const response = await apiClient.get(`${ADMIN_API_BASE_URL}/dashboard/user-roles-chart`); // Ajustez l'URL
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Réponse invalide pour le graphique des rôles.");
  } catch (error) {
    handleError(error, "Erreur chargement données graph rôles.", "AdminAPI:getAdminUserRolesChartData");
  }
};

export const getAdminRecentActivities = async (limit = 5) => {
  try {
    const response = await apiClient.get(`${ADMIN_API_BASE_URL}/dashboard/recent-activities`, { params: { limit } }); // Ajustez l'URL
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Réponse invalide pour les activités récentes.");
  } catch (error) {
    handleError(error, "Erreur chargement activités récentes.", "AdminAPI:getAdminRecentActivities");
  }
};
*/

// Ajoutez ici d'autres fonctions API spécifiques à l'administration et utilisez handleError.
// Par exemple, pour la gestion des utilisateurs par l'admin (si elles ne sont pas dans user.api.js)

/**
 * Récupère tous les utilisateurs pour l'administration (avec pagination, filtres).
 * @param {object} params - Paramètres de requête.
 * @returns {Promise<object>} Données des utilisateurs et pagination.
 */
// export const getAllUsersForAdmin = async (params) => {
//   try {
//     const response = await apiClient.get(`${ADMIN_API_BASE_URL}/users`, { params });
//     if (response.data && response.data.success) {
//       return { // Adapter à la structure attendue par userSlice (version admin)
//         data: response.data.data,
//         currentPage: response.data.pagination.currentPage,
//         totalPages: response.data.pagination.totalPages,
//         totalItems: response.data.totalUsers,
//         limit: response.data.pagination.limit,
//       };
//     }
//     throw new Error(response.data?.message || "Réponse invalide du serveur pour la liste des utilisateurs.");
//   } catch (error) {
//     handleError(error, "Impossible de charger la liste des utilisateurs.", "AdminAPI:getAllUsersForAdmin");
//   }
// };

// ... fonctions pour createUserByAdmin, updateUserByAdmin, deleteUserByAdmin ...
// en utilisant handleError dans leurs blocs catch.