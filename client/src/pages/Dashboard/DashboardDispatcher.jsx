// frontend/src/pages/Dashboard/DashboardDispatcher.jsx
import React, { Suspense, lazy } from 'react'; // Suspense et lazy si les dashboards sont lazy loadés
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // CHEMIN CORRIGÉ ICI
import LoadingSpinner from '../../components/common/LoadingSpinner'; // Pour Suspense fallback

// Importer les pages de dashboard spécifiques (potentiellement avec lazy loading)
// Si elles sont dans le même dossier 'Dashboard' :
const AdminDashboardPage = lazy(() => import('./AdminDashboardPage'));
const ManagerDashboardPage = lazy(() => import('./ManagerDashboardPage'));
const AccountantDashboardPage = lazy(() => import('./AccountantDashboardPage'));
// const UserDashboardPage = lazy(() => import('./UserDashboardPage')); // Si vous en avez un

// Spinner pour le lazy loading des dashboards
const DashboardLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)', width: '100%' }}> {/* Ajuster la hauteur si nécessaire */}
    <LoadingSpinner message="Chargement du tableau de bord..." />
  </div>
);


const DashboardDispatcher = () => {
  const { user, isAuthenticated /* , isAdmin, hasRole */ } = useAuth(); // isAdmin et hasRole sont déjà dans useAuth

  // Si l'authentification est toujours en cours via useAuth, afficher un loader
  // Cela dépend de comment useAuth gère son état isLoading initial
  // if (authIsLoading && !isAuthenticated) {
  //   return <DashboardLoadingFallback />;
  // }

  // Si non authentifié (devrait être attrapé par PrivateRoute, mais double sécurité)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Déterminer quel dashboard afficher en fonction du rôle
  // L'ordre est important si un utilisateur peut avoir plusieurs rôles pertinents (ex: ADMIN est aussi MANAGER)
  // useAuth devrait fournir des helpers comme `isAdmin`, `isManager`, etc.
  if (user.role === 'ADMIN') {
    return <AdminDashboardPage />;
  }
  if (user.role === 'MANAGER') {
    return <ManagerDashboardPage />;
  }
  if (user.role === 'ACCOUNTANT') {
    return <AccountantDashboardPage />;
  }
  // if (user.role === 'USER') { // Si vous avez un dashboard spécifique pour le rôle USER
  //   return <UserDashboardPage />;
  // }

  // Fallback pour un utilisateur authentifié dont le rôle n'a pas de dashboard spécifique
  // ou si la logique ci-dessus n'a pas matché (ex: rôle USER sans dashboard USER)
  console.warn(`DashboardDispatcher: Aucun dashboard spécifique trouvé pour le rôle "${user.role}". Redirection vers le profil.`);
  return <Navigate to="/profile" replace />;
};

// Envelopper le composant avec Suspense s'il lazy load ses propres enfants
// ou si les dashboards sont eux-mêmes lazy loadés ici.
const LazyDashboardDispatcher = () => (
  <Suspense fallback={<DashboardLoadingFallback />}>
    <DashboardDispatcher />
  </Suspense>
);

export default LazyDashboardDispatcher; // Exporter la version avec Suspense