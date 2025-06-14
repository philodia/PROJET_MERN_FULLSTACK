// frontend/src/api/auth.api.js
import apiClient from './index';
import { handleError } from './utils.api'; // Assurez-vous que ce chemin est correct

const AUTH_API_BASE_URL = '/auth'; // Préfixe pour les routes d'authentification

/**
 * Envoie une requête de connexion au backend.
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} Les données de réponse, typiquement { user: object, token: string }.
 */
export const login = async (credentials) => {
  try {
    const response = await apiClient.post(`${AUTH_API_BASE_URL}/login`, credentials);
    // Supposant que le backend retourne { success: true, data: { user, token } }
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur lors de la connexion.");
  } catch (error) {
    handleError(error, "Échec de la connexion.", "AuthAPI:login");
  }
};

/**
 * Envoie une requête d'inscription au backend.
 * @param {object} userData - { username, email, password, role?, ... }
 * @returns {Promise<object>} Les données de réponse, typiquement { user: object, token?: string }.
 */
export const register = async (userData) => {
  try {
    const response = await apiClient.post(`${AUTH_API_BASE_URL}/register`, userData);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur lors de l'inscription.");
  } catch (error) {
    handleError(error, "Échec de l'inscription.", "AuthAPI:register");
  }
};

/**
 * Récupère les informations de l'utilisateur actuellement authentifié.
 * @returns {Promise<object>} Les données de l'utilisateur.
 */
export const getMe = async () => {
  try {
    const response = await apiClient.get(`${AUTH_API_BASE_URL}/me`);
    // Supposant que le backend retourne { success: true, data: userObject }
    if (response.data && response.data.success) {
      return response.data.data; // L'objet utilisateur
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour les informations utilisateur.");
  } catch (error) {
    handleError(error, "Impossible de récupérer les informations de l'utilisateur.", "AuthAPI:getMe");
  }
};

/**
 * Envoie une requête de déconnexion au backend (si l'API le supporte).
 * @returns {Promise<object>} La réponse du serveur (ex: { message: 'Déconnecté avec succès' }).
 */
export const logout = async () => {
  try {
    // Si votre backend a un endpoint de logout qui invalide le token (ex: via une liste noire)
    const response = await apiClient.post(`${AUTH_API_BASE_URL}/logout`);
    if (response.data && response.data.success) {
      return response.data;
    }
    // Même si le backend ne renvoie pas success:true, la déconnexion client aura lieu
    console.warn("Réponse du serveur pour logout non standard, mais déconnexion client effectuée.", response.data);
    return { message: "Déconnexion serveur potentiellement non effectuée, mais client déconnecté." };
  } catch (error) {
    // Ne pas bloquer la déconnexion client même si l'appel API échoue.
    // L'erreur sera loggée par handleError.
    console.warn("Erreur lors de la tentative de déconnexion côté serveur:", error.message || error);
    // On peut choisir de ne pas propager l'erreur ici pour que le logout client réussisse toujours,
    // ou la propager si on veut que le thunk Redux soit notifié de l'échec du logout serveur.
    // Pour l'instant, on ne la propage pas pour simplifier la déconnexion client.
    return { message: "Déconnexion client effectuée. Erreur de déconnexion serveur ignorée." };
  }
};

/**
 * Met à jour le mot de passe de l'utilisateur actuellement authentifié.
 * @param {object} passwordData - { currentPassword, newPassword }
 * @returns {Promise<object>} La réponse du serveur (ex: { message: 'Mot de passe mis à jour' }).
 */
export const changeMyPassword = async (passwordData) => {
  try {
    // L'endpoint pourrait aussi être /users/me/update-password ou similaire
    const response = await apiClient.put(`${AUTH_API_BASE_URL}/update-password`, passwordData);
    if (response.data && response.data.success) {
      return response.data; // Attend typiquement un message de succès
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur lors du changement de mot de passe.");
  } catch (error) {
    handleError(error, "Impossible de modifier le mot de passe.", "AuthAPI:changeMyPassword");
  }
};


// --- Fonctions pour la Réinitialisation de Mot de Passe (Exemples) ---

/**
 * Demande une réinitialisation de mot de passe pour l'email fourni.
 * @param {string} email - L'email de l'utilisateur.
 * @returns {Promise<object>} La réponse du serveur (ex: { message: 'Email de réinitialisation envoyé' }).
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post(`${AUTH_API_BASE_URL}/forgot-password`, { email });
    if (response.data && response.data.success) {
      return response.data;
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour la demande de réinitialisation.");
  } catch (error) {
    handleError(error, "Impossible d'envoyer la demande de réinitialisation de mot de passe.", "AuthAPI:requestPasswordReset");
  }
};

/**
 * Réinitialise le mot de passe en utilisant un token.
 * @param {string} token - Le token de réinitialisation reçu par email.
 * @param {string} newPassword - Le nouveau mot de passe.
 * @returns {Promise<object>} La réponse du serveur (ex: { message: 'Mot de passe réinitialisé avec succès' }).
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  try {
    // Le token peut être dans l'URL ou dans le corps, selon votre API backend. Ici, dans l'URL.
    const response = await apiClient.post(`${AUTH_API_BASE_URL}/reset-password/${token}`, { password: newPassword });
    if (response.data && response.data.success) {
      return response.data;
    }
    throw new Error(response.data?.message || "Réponse invalide du serveur pour la réinitialisation du mot de passe.");
  } catch (error) {
    handleError(error, "Impossible de réinitialiser le mot de passe.", "AuthAPI:resetPasswordWithToken");
  }
};


// --- Fonctions pour la Mise à Jour du Profil Utilisateur ---
// Celles-ci pourraient aussi être dans user.api.js si vous séparez plus.

/**
 * Met à jour le profil de l'utilisateur actuellement authentifié.
 * @param {object} profileData - Données du profil à mettre à jour (ex: { firstName, lastName, avatarUrl }).
 * @returns {Promise<object>} L'objet utilisateur mis à jour.
 */
export const updateMyProfile = async (profileData) => {
    try {
        const response = await apiClient.put(`${AUTH_API_BASE_URL}/me/profile`, profileData); // ou /users/me/profile
        if (response.data && response.data.success) {
            return response.data.data; // Attend l'objet utilisateur mis à jour
        }
        throw new Error(response.data?.message || "Réponse invalide du serveur lors de la mise à jour du profil.");
    } catch (error) {
        handleError(error, "Impossible de mettre à jour le profil.", "AuthAPI:updateMyProfile");
    }
};