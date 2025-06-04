// frontend/src/api/auth.api.js
import apiClient from './index'; // Importe l'instance Axios configurée

/**
 * Envoie une requête de connexion au backend.
 * @param {object} credentials - Les informations d'identification de l'utilisateur.
 * @param {string} credentials.email - L'email de l'utilisateur.
 * @param {string} credentials.password - Le mot de passe de l'utilisateur.
 * @returns {Promise<object>} Une promesse qui se résout avec les données utilisateur et le token.
 *                            Ex: { user: { id, username, email, role }, token: "jwt_token" }
 * @throws {Error} Si la requête échoue, une erreur sera levée (gérée par l'intercepteur Axios).
 */
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // Le backend devrait retourner { user, token }
  } catch (error) {
    // L'erreur est déjà traitée par l'intercepteur global d'apiClient (log, dispatch d'erreur, etc.)
    // On la propage pour que le thunk appelant (dans authSlice) puisse aussi réagir
    // et mettre à jour l'état d'erreur dans le store.
    // L'objet 'error' ici sera ce que l'intercepteur a retourné dans Promise.reject()
    // (généralement error.response.data ou un message d'erreur stringifié).
    throw error;
  }
};

/**
 * Envoie une requête d'inscription au backend.
 * @param {object} userData - Les données du nouvel utilisateur.
 * @param {string} userData.username - Le nom d'utilisateur.
 * @param {string} userData.email - L'email de l'utilisateur.
 * @param {string} userData.password - Le mot de passe.
 * @param {string} userData.role - Le rôle (si applicable à l'inscription publique, sinon géré par l'admin).
 * @returns {Promise<object>} Une promesse qui se résout avec les données du nouvel utilisateur et le token.
 * @throws {Error} Si la requête échoue.
 */
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data; // Le backend devrait retourner { user, token }
  } catch (error) {
    throw error;
  }
};

/**
 * Récupère les informations de l'utilisateur actuellement authentifié.
 * Cette requête utilisera le token JWT automatiquement ajouté par l'intercepteur d'apiClient.
 * @returns {Promise<object>} Une promesse qui se résout avec les données de l'utilisateur.
 *                            Ex: { id, username, email, role, lastLogin }
 * @throws {Error} Si la requête échoue (par exemple, token invalide ou expiré).
 */
export const fetchCurrentUser = async () => {
  try {
    // La route exacte peut varier, '/auth/me', '/users/me', '/profile' sont courants
    const response = await apiClient.get('/auth/me');
    return response.data; // Le backend devrait retourner l'objet utilisateur
  } catch (error) {
    throw error;
  }
};

/**
 * Envoie une requête de déconnexion au backend (si nécessaire).
 * Certaines implémentations JWT sont sans état côté serveur et n'ont pas besoin d'un appel de déconnexion.
 * D'autres peuvent vouloir invalider le token côté serveur (via une liste noire, etc.).
 * Si votre backend a un endpoint de logout, utilisez-le ici.
 * @returns {Promise<object>} Une promesse qui se résout avec la réponse du serveur.
 * @throws {Error} Si la requête échoue.
 */
export const logoutUser = async () => {
  // Décommentez et adaptez si votre backend a un endpoint de logout
  /*
  try {
    // Le token sera automatiquement envoyé par l'intercepteur
    const response = await apiClient.post('/auth/logout');
    return response.data; // Le backend pourrait retourner un message de succès
  } catch (error) {
    // Même si le logout backend échoue, on voudra probablement quand même déconnecter côté client.
    // L'important est que l'erreur soit loggée.
    console.error("Erreur lors de la tentative de déconnexion côté serveur:", error);
    throw error; // Propagez pour que le thunk puisse décider quoi faire.
  }
  */
  // Si pas d'endpoint de logout backend, cette fonction peut simplement retourner une promesse résolue.
  // La logique de suppression du token côté client est dans le slice Redux.
  return Promise.resolve({ message: "Déconnexion client effectuée." });
};

// Ajoutez d'autres fonctions d'API liées à l'authentification si nécessaire :
// - forgotPassword(email)
// - resetPassword(token, newPassword)
// - verifyEmail(token)
// etc.

// Exemple (si vous implémentez la réinitialisation de mot de passe) :
/*
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data; // Devrait contenir un message de succès
  } catch (error) {
    throw error;
  }
};

export const resetPasswordWithToken = async (token, newPassword) => {
  try {
    const response = await apiClient.post(`/auth/reset-password/${token}`, { password: newPassword });
    return response.data; // Devrait contenir un message de succès
  } catch (error) {
    throw error;
  }
};
*/