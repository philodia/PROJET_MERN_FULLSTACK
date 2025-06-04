// frontend/src/api/client.api.js
import apiClient from './index'; // Importe l'instance Axios configurée

const API_ENDPOINT = '/clients'; // L'endpoint de base pour les clients

/**
 * Récupère une liste de clients depuis le backend.
 * @param {object} params - Paramètres de requête optionnels (pagination, filtres, recherche).
 *                         Ex: { page: 1, limit: 10, search: 'acme', sortBy: 'companyName' }
 * @returns {Promise<object>} Une promesse qui se résout avec les données des clients et les informations de pagination.
 *                            Ex: { clients: [...], totalPages: 5, currentPage: 1, totalClients: 50 }
 * @throws {Error} Si la requête échoue.
 */
export const fetchClients = async (params = {}) => {
  try {
    const response = await apiClient.get(API_ENDPOINT, { params });
    return response.data; // Le backend devrait retourner un objet avec 'clients' et des métadonnées de pagination
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Récupère les détails d'un client spécifique par son ID.
 * @param {string} clientId - L'ID du client.
 * @returns {Promise<object>} Une promesse qui se résout avec les données du client.
 * @throws {Error} Si la requête échoue.
 */
export const fetchClientById = async (clientId) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINT}/${clientId}`);
    return response.data; // Le backend devrait retourner l'objet client
  } catch (error) {
    console.error(`Error fetching client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Crée un nouveau client.
 * @param {object} clientData - Les données du nouveau client.
 * @returns {Promise<object>} Une promesse qui se résout avec les données du client créé.
 * @throws {Error} Si la requête échoue.
 */
export const createClient = async (clientData) => {
  try {
    const response = await apiClient.post(API_ENDPOINT, clientData);
    return response.data; // Le backend devrait retourner le client créé
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

/**
 * Met à jour un client existant par son ID.
 * @param {string} clientId - L'ID du client à mettre à jour.
 * @param {object} clientData - Les données à mettre à jour.
 * @returns {Promise<object>} Une promesse qui se résout avec les données du client mis à jour.
 * @throws {Error} Si la requête échoue.
 */
export const updateClient = async (clientId, clientData) => {
  try {
    const response = await apiClient.put(`${API_ENDPOINT}/${clientId}`, clientData);
    return response.data; // Le backend devrait retourner le client mis à jour
  } catch (error) {
    console.error(`Error updating client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Supprime un client par son ID.
 * @param {string} clientId - L'ID du client à supprimer.
 * @returns {Promise<object>} Une promesse qui se résout avec un message de succès ou les données du client supprimé.
 * @throws {Error} Si la requête échoue.
 */
export const deleteClient = async (clientId) => {
  try {
    const response = await apiClient.delete(`${API_ENDPOINT}/${clientId}`);
    return response.data; // Le backend pourrait retourner un message de succès ou l'ID du client supprimé
  } catch (error) {
    console.error(`Error deleting client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Récupère l'historique d'interactions d'un client.
 * @param {string} clientId - L'ID du client.
 * @param {object} params - Paramètres de requête optionnels (pagination, filtres).
 * @returns {Promise<object>} Une promesse qui se résout avec l'historique des interactions.
 */
export const fetchClientHistory = async (clientId, params = {}) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINT}/${clientId}/history`, { params });
    return response.data; // Attend { history: [...], ...pagination }
  } catch (error) {
    console.error(`Error fetching history for client ${clientId}:`, error);
    throw error;
  }
};