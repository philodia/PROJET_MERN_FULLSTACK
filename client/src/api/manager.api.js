// frontend/src/api/manager.api.js
import apiClient from './index';
import { handleError } from './utils.api'; // Assurez-vous que ce chemin est correct

const MANAGER_API_BASE_URL = '/manager'; // Préfixe pour les routes manager, ex: /api/manager

/**
 * Récupère les données agrégées pour le tableau de bord du manager.
 * Le backend filtre les données pour le manager authentifié.
 *
 * @returns {Promise<object>} Un objet contenant les données du dashboard.
 *          Ex: {
 *                summaryStats: {
 *                  activeQuotes: { value: number, trend?: string },
 *                  pendingInvoices: { value: number, trend?: string },
 *                  monthlySales: { value: number, unit: string, trend?: string },
 *                  activeProjects: { value: number, trend?: string }
 *                },
 *                recentQuotes: Array<object>,
 *                recentInvoices: Array<object>,
 *                salesPerformanceChart: { labels: Array<string>, datasets: Array<object> }
 *              }
 */
export const getManagerDashboardData = async () => {
  try {
    const response = await apiClient.get(`${MANAGER_API_BASE_URL}/dashboard-data`);
    // Supposant une réponse backend: { success: true, data: { dashboardObject } }
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour les données du tableau de bord manager.");
  } catch (error) {
    handleError(error, "Impossible de charger les données du tableau de bord manager.", "getManagerDashboardData");
  }
};

/**
 * Récupère la liste des devis spécifiquement liés au manager (ex: créés par lui, assignés).
 * @param {object} params - Paramètres de requête (ex: { page: 1, limit: 10, status: 'SENT', sort: '-createdAt' }).
 * @returns {Promise<object>} Objet contenant les devis et les informations de pagination.
 *                            Ex: { data: quotes[], currentPage, totalPages, totalItems, limit }
 */
export const getMyManagerQuotes = async (params) => {
  try {
    const response = await apiClient.get(`${MANAGER_API_BASE_URL}/quotes`, { params });
    if (response.data && response.data.success) {
      // Adapter si la structure de la pagination du backend est différente
      return {
        data: response.data.data,
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalItems: response.data.totalItems, // ou response.data.totalQuotes
        limit: response.data.pagination.limit,
      };
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour les devis du manager.");
  } catch (error) {
    handleError(error, "Impossible de charger les devis du manager.", "getMyManagerQuotes");
  }
};

/**
 * Récupère la liste des factures spécifiquement liées au manager.
 * @param {object} params - Paramètres de requête (ex: { page: 1, limit: 10, status: 'OVERDUE', sort: 'dueDate' }).
 * @returns {Promise<object>} Objet contenant les factures et les informations de pagination.
 */
export const getMyManagerInvoices = async (params) => {
  try {
    const response = await apiClient.get(`${MANAGER_API_BASE_URL}/invoices`, { params });
    if (response.data && response.data.success) {
      return { /* ... structure similaire à getMyManagerQuotes ... */ };
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour les factures du manager.");
  } catch (error) {
    handleError(error, "Impossible de charger les factures du manager.", "getMyManagerInvoices");
  }
};

/**
 * Permet à un manager d'approuver un devis.
 * @param {string} quoteId - L'ID du devis à approuver.
 * @param {object} [approvalData] - Données supplémentaires pour l'approbation (ex: notes).
 * @returns {Promise<object>} Le devis mis à jour.
 */
export const approveQuoteByManager = async (quoteId, approvalData = {}) => {
  try {
    const response = await apiClient.post(`${MANAGER_API_BASE_URL}/quotes/${quoteId}/approve`, approvalData);
    if (response.data && response.data.success) {
      return response.data.data; // Le devis mis à jour
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour l'approbation du devis.");
  } catch (error) {
    handleError(error, "Impossible d'approuver le devis.", "approveQuoteByManager");
  }
};

/**
 * Récupère les clients gérés ou principalement contactés par le manager.
 * @param {object} params - Paramètres de requête (page, limit, sort, etc.)
 * @returns {Promise<object>} Objet contenant les clients et les informations de pagination.
 */
export const getMyManagerClients = async (params) => {
    try {
        const response = await apiClient.get(`${MANAGER_API_BASE_URL}/clients`, { params });
        if (response.data && response.data.success) {
            return {
                data: response.data.data,
                currentPage: response.data.pagination.currentPage,
                totalPages: response.data.pagination.totalPages,
                totalItems: response.data.totalItems,
                limit: response.data.pagination.limit,
            };
        }
        throw new Error(response.data?.message || "Réponse invalide du serveur pour les clients du manager.");
    } catch (error) {
        handleError(error, "Impossible de charger les clients du manager.", "getMyManagerClients");
    }
};


// Ajoutez d'autres fonctions API spécifiques aux managers ici, par exemple :
// - Suivi des performances de l'équipe (si le manager gère une équipe)
// - Gestion de projets spécifiques
// - Rapports personnalisés pour le manager