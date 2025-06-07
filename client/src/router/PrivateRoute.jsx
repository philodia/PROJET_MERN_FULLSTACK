// frontend/src/router/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Votre hook d'authentification
import LoadingSpinner from '../components/common/LoadingSpinner'; // Pour l'état de chargement initial de l'auth

const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    // Afficher un spinner pendant que l'état d'authentification est vérifié
    // (surtout au premier chargement de l'app)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner message="Vérification de l'authentification..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de connexion si non authentifié
    // Passer l'URL actuelle pour redirection après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Si des rôles sont spécifiés et que l'utilisateur n'a pas le bon rôle
    // Rediriger vers une page "Non Autorisé" ou le tableau de bord par défaut
    console.warn(`Accès refusé pour l'utilisateur ${user.username} (rôle: ${user.role}) à la route nécessitant les rôles: ${allowedRoles.join(', ')}`);
    return <Navigate to="/dashboard" state={{ unauthorized: true }} replace />; // Ou vers une page /unauthorized
  }

  // Si authentifié et (pas de rôles spécifiés OU rôle autorisé), rendre le contenu enfant
  return <Outlet />;
};

export default PrivateRoute;