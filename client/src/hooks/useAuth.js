// frontend/src/hooks/useAuth.js
import { useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthToken,
  selectAuthIsLoading,
  selectAuthError,
} from '../features/auth/authSlice'; // Assurez-vous que le chemin est correct

/**
 * Hook personnalisé pour accéder à l'état d'authentification et aux informations de l'utilisateur.
 *
 * @returns {object} Un objet contenant :
 *  - `user`: Les informations de l'utilisateur connecté (ou null).
 *  - `isAuthenticated`: Un booléen indiquant si l'utilisateur est authentifié.
 *  - `token`: Le token d'authentification (ou null).
 *  - `isLoading`: Un booléen indiquant si l'état d'authentification est en cours de chargement.
 *  - `error`: L'erreur d'authentification (ou null).
 *  - `isAdmin`: Un booléen indiquant si l'utilisateur a le rôle 'ADMIN'.
 *  - `isManager`: Un booléen indiquant si l'utilisateur a le rôle 'MANAGER'.
 *  - `isAccountant`: Un booléen indiquant si l'utilisateur a le rôle 'ACCOUNTANT'.
 *  - `hasRole(roleOrRoles)`: Une fonction pour vérifier si l'utilisateur a un rôle spécifique ou l'un des rôles d'un tableau.
 */
export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectAuthToken);
  const isLoading = useSelector(selectAuthIsLoading);
  const error = useSelector(selectAuthError);

  // Fonctions utilitaires pour vérifier les rôles (ajustez les noms des rôles si nécessaire)
  const isAdmin = !!user && user.role === 'ADMIN';
  const isManager = !!user && user.role === 'MANAGER';
  const isAccountant = !!user && user.role === 'ACCOUNTANT';

  /**
   * Vérifie si l'utilisateur actuel a un rôle spécifique ou l'un des rôles d'un tableau.
   * @param {string|string[]} roleOrRoles - Le rôle (chaîne) ou un tableau de rôles à vérifier.
   * @returns {boolean} True si l'utilisateur a le rôle requis, false sinon.
   */
  const hasRole = (roleOrRoles) => {
    if (!user || !user.role) {
      return false;
    }
    if (Array.isArray(roleOrRoles)) {
      return roleOrRoles.includes(user.role);
    }
    return user.role === roleOrRoles;
  };

  return {
    user,
    isAuthenticated,
    token,
    isLoading,
    error,
    isAdmin,
    isManager,
    isAccountant,
    hasRole,
  };
};

// Vous pouvez aussi exporter directement la fonction si vous préférez
// export default useAuth;