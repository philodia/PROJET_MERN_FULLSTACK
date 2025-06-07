// frontend/src/hooks/useAuth.js
import { useSelector } from 'react-redux';
import { useMemo, useCallback } from 'react';

import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthToken,
  selectAuthStatus,
  selectAuthError,
} from '../features/auth/authSlice';

/**
 * Hook personnalisé pour accéder à l'état d'authentification et aux informations de l'utilisateur.
 */
export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectAuthToken);
  const authStatus = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const isLoading = useMemo(() => authStatus === 'loading', [authStatus]);

  const isAdmin = useMemo(() => !!user && user.role === 'ADMIN', [user]);
  const isManager = useMemo(() => !!user && user.role === 'MANAGER', [user]);
  const isAccountant = useMemo(() => !!user && user.role === 'ACCOUNTANT', [user]);
  const isUserRole = useMemo(() => !!user && user.role === 'USER', [user]);

  /**
   * Vérifie si l'utilisateur actuel a un rôle spécifique ou un des rôles d'un tableau.
   * @param {string|string[]} roleOrRolesToCheck - Le rôle (chaîne) ou un tableau de rôles à vérifier.
   * @returns {boolean} True si l'utilisateur a le rôle requis, false sinon.
   */
  const hasRole = useCallback(
    (roleOrRolesToCheck) => {
      if (!user || !user.role) return false;

      const currentUserRole = user.role;

      if (Array.isArray(roleOrRolesToCheck)) {
        return roleOrRolesToCheck.includes(currentUserRole);
      }

      return currentUserRole === roleOrRolesToCheck;
    },
    [user]
  );

  return {
    user,
    isAuthenticated,
    token,
    isLoading,
    authStatus,
    error,
    isAdmin,
    isManager,
    isAccountant,
    isUserRole,
    hasRole,
  };
};
