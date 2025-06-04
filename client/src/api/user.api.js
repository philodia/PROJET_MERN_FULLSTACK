// frontend/src/api/user.api.js
import apiClient from './index'; // Importe l'instance Axios configurée

const API_ENDPOINT = '/users'; // L'endpoint de base pour les utilisateurs

/**
 * Récupère une liste d'utilisateurs depuis le backend.
 * @param {object} params - Paramètres de requête optionnels (pagination, filtres, recherche).
 *                         Ex: { page: 1, limit: 10, search: 'john', role: 'MANAGER' }
 * @returns {Promise<object>} Une promesse qui se résout avec les données des utilisateurs et les informations de pagination.
 *                            Ex: { users: [...], totalPages: 5, currentPage: 1, totalUsers: 50 }
 * @throws {Error} Si la requête échoue.
 */
export const fetchUsers = async (params = {}) => {
  try {
    const response = await apiClient.get(API_ENDPOINT, { params });
    return response.data; // Le backend devrait retourner un objet avec 'users' et des métadonnées de pagination
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Récupère les détails d'un utilisateur spécifique par son ID.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<object>} Une promesse qui se résout avec les données de l'utilisateur.
 * @throws {Error} Si la requête échoue.
 */
export const fetchUserById = async (userId) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINT}/${userId}`);
    return response.data; // Le backend devrait retourner l'objet utilisateur
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

/**
 * Crée un nouvel utilisateur.
 * @param {object} userData - Les données du nouvel utilisateur.
 * @returns {Promise<object>} Une promesse qui se résout avec les données de l'utilisateur créé.
 * @throws {Error} Si la requête échoue.
 */
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post(API_ENDPOINT, userData);
    return response.data; // Le backend devrait retourner l'utilisateur créé
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Met à jour un utilisateur existant par son ID.
 * @param {string} userId - L'ID de l'utilisateur à mettre à jour.
 * @param {object} userData - Les données à mettre à jour.
 * @returns {Promise<object>} Une promesse qui se résout avec les données de l'utilisateur mis à jour.
 * @throws {Error} Si la requête échoue.
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`${API_ENDPOINT}/${userId}`, userData);
    return response.data; // Le backend devrait retourner l'utilisateur mis à jour
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Supprime un utilisateur par son ID.
 * @param {string} userId - L'ID de l'utilisateur à supprimer.
 * @returns {Promise<object>} Une promesse qui se résout avec un message de succès ou les données de l'utilisateur supprimé.
 * @throws {Error} Si la requête échoue.
 */
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`${API_ENDPOINT}/${userId}`);
    return response.data; // Le backend pourrait retourner un message de succès ou l'ID de l'utilisateur supprimé
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

// Fonctions supplémentaires si nécessaire (ex: suspendre/activer un utilisateur)
/**
 * Active ou suspend un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {boolean} isActive - True pour activer, false pour suspendre.
 * @returns {Promise<object>} Une promesse qui se résout avec l'utilisateur mis à jour.
 */
// export const setUserStatus = async (userId, isActive) => {
//   try {
//     const response = await apiClient.patch(`${API_ENDPOINT}/${userId}/status`, { isActive });
//     return response.data;
//   } catch (error) {
//     console.error(`Error setting status for user ${userId}:`, error);
//     throw error;
//   }
// };