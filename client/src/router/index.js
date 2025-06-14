// frontend/src/router/index.js
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from '../components/layout/MainLayout';
import PrivateRoute from './PrivateRoute'; // Assurez-vous que PrivateRoute gère bien allowedRoles
import LoadingSpinner from '../components/common/LoadingSpinner';

const FullPageSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bs-light)' }}>
    <LoadingSpinner size="lg" message="Chargement..." />
  </div>
);

// --- Pages ---
// Auth
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
// const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
// const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage'));

// Dashboards & Profile
const DashboardDispatcher = lazy(() => import('../pages/Dashboard/DashboardDispatcher')); // Composant de redirection
const UserProfilePage = lazy(() => import('../pages/Profile/ProfilePage')); // Renommé ProfilePage

// Modules (Exemples, ajoutez tous les vôtres)
const ClientListPage = lazy(() => import('../pages/Clients/ClientListPage'));
const ClientCreatePage = lazy(() => import('../pages/Clients/ClientCreatePage'));
const ClientEditPage = lazy(() => import('../pages/Clients/ClientEditPage'));
// ... autres imports lazy pour toutes vos pages ...
const InvoiceListPage = lazy(() => import('../pages/Invoices/InvoiceListPage'));
const InvoiceCreatePage = lazy(() => import('../pages/Invoices/InvoiceCreatePage'));
const InvoiceEditPage = lazy(() => import('../pages/Invoices/InvoiceEditPage'));
const InvoiceDetailPage = lazy(() => import('../pages/Invoices/InvoiceDetailPage'));


// Admin Pages
const AdminUserManagementPage = lazy(() => import('../pages/Admin/UserManagementPage'));
const AdminUserCreatePage = lazy(() => import('../pages/Admin/UserCreatePage'));
const AdminUserEditPage = lazy(() => import('../pages/Admin/UserEditPage'));
const AdminSecurityLogPage = lazy(() => import('../pages/Admin/SecurityLogPage'));

// Not Found
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));


const AppRouter = () => {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Routes Publiques (gèrent leur propre AuthLayout si besoin) */}
        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}
        {/* <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> */}

        {/* Routes Protégées par Authentification */}
        <Route element={<PrivateRoute />}> {/* Vérifie si l'utilisateur est authentifié */}
          <Route element={<MainLayout />}> {/* Applique le layout principal */}
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardDispatcher />} />
            <Route path="/profile" element={<UserProfilePage />} />

            {/* Section Commerciale (Accessible par ADMIN, MANAGER) */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
              <Route path="/clients" element={<ClientListPage />} />
              <Route path="/clients/new" element={<ClientCreatePage />} />
              <Route path="/clients/edit/:clientId" element={<ClientEditPage />} />
              {/* ... autres routes commerciales: fournisseurs, produits, devis, BL ... */}
            </Route>

            {/* Section Facturation (Accessible par ADMIN, MANAGER, ACCOUNTANT) */}
            {/* Note: Si un manager peut voir les factures, PrivateRoute doit le permettre */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER', 'ACCOUNTANT']} />}>
              <Route path="/invoices" element={<InvoiceListPage />} />
              <Route path="/invoices/new" element={<InvoiceCreatePage />} />
              <Route path="/invoices/edit/:invoiceId" element={<InvoiceEditPage />} />
              <Route path="/invoices/view/:invoiceId" element={<InvoiceDetailPage />} />
            </Route>
            
            {/* Section Comptabilité (Accessible par ADMIN, ACCOUNTANT) */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'ACCOUNTANT']} />}>
              {/* <Route path="/accounting/journal" element={<JournalPage />} /> */}
              {/* ... autres routes comptables ... */}
            </Route>

            {/* Section Administration (Accessible uniquement par ADMIN) */}
            {/* On peut préfixer avec "admin" pour le groupement logique des URLS */}
            <Route path="admin" element={<PrivateRoute allowedRoles={['ADMIN']} />}>
              {/* Redirection pour /admin vers une page admin par défaut ou le premier item */}
              <Route index element={<Navigate to="users" replace />} />
              <Route path="users" element={<AdminUserManagementPage />} />
              <Route path="users/new" element={<AdminUserCreatePage />} />
              <Route path="users/edit/:userId" element={<AdminUserEditPage />} />
              <Route path="security-logs" element={<AdminSecurityLogPage />} />
              {/* <Route path="settings" element={<SettingsPage />} /> */}
            </Route>

          </Route> {/* Fin MainLayout */}
        </Route> {/* Fin PrivateRoute (authentification) */}

        {/* Page Non Trouvée */}
        <Route path="*" element={
          <MainLayout> {/* Optionnel: afficher NotFoundPage dans le MainLayout */}
            <NotFoundPage />
          </MainLayout>
        } />
        {/* Ou sans MainLayout: <Route path="*" element={<NotFoundPage />} /> */}

      </Routes>
    </Suspense>
  );
};

export default AppRouter;