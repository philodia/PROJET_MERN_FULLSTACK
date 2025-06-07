// frontend/src/router/index.js
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';
//import AuthLayout from '../components/layout/AuthLayout'; // Utilisé par les pages elles-mêmes

// Composant de Route Protégée
import PrivateRoute from './PrivateRoute';

// --- Spinner de chargement pour le lazy loading ---
import LoadingSpinner from '../components/common/LoadingSpinner';
const FullPageSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <LoadingSpinner message="Chargement de la page..." />
  </div>
);

// --- Importation des Pages (avec Lazy Loading) ---
// Pages d'Authentification
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
//const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage')); // Si vous l'avez
//const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPasswordPage')); // Si vous l'avez
//const ResetPasswordPage = lazy(() => import('../pages/Auth/ResetPasswordPage')); // Si vous l'avez

// Pages Principales (après authentification)
const AdminDashboardPage = lazy(() => import('../pages/Dashboard/AdminDashboardPage'));
//const ManagerDashboardPage = lazy(() => import('../pages/Dashboard/ManagerDashboardPage'));
//const AccountantDashboardPage = lazy(() => import('../pages/Dashboard/AccountantDashboardPage'));
const UserProfilePage = lazy(() => import('../pages/Profile/UserProfilePage'));

// Clients
const ClientListPage = lazy(() => import('../pages/Clients/ClientListPage'));
const ClientCreatePage = lazy(() => import('../pages/Clients/ClientCreatePage'));
const ClientEditPage = lazy(() => import('../pages/Clients/ClientEditPage'));
const ClientDetailPage = lazy(() => import('../pages/Clients/ClientDetailPage'));
// const ClientGridViewPage = lazy(() => import('../pages/Clients/ClientGridViewPage')); // Si vous avez cette vue

// Fournisseurs
const SupplierListPage = lazy(() => import('../pages/Suppliers/SupplierListPage'));
const SupplierCreatePage = lazy(() => import('../pages/Suppliers/SupplierCreatePage'));
const SupplierEditPage = lazy(() => import('../pages/Suppliers/SupplierEditPage'));
const SupplierDetailPage = lazy(() => import('../pages/Suppliers/SupplierDetailPage'));

// Produits & Stock
const ProductListPage = lazy(() => import('../pages/Products/ProductListPage'));
const ProductCreatePage = lazy(() => import('../pages/Products/ProductCreatePage'));
const ProductEditPage = lazy(() => import('../pages/Products/ProductEditPage'));
const ProductDetailPage = lazy(() => import('../pages/Products/ProductDetailPage'));
const StockManagementPage = lazy(() => import('../pages/Stock/StockManagementPage'));

// Devis
const QuoteListPage = lazy(() => import('../pages/Quotes/QuoteListPage'));
const QuoteCreatePage = lazy(() => import('../pages/Quotes/QuoteCreatePage'));
const QuoteEditPage = lazy(() => import('../pages/Quotes/QuoteEditPage'));
const QuoteDetailPage = lazy(() => import('../pages/Quotes/QuoteDetailPage'));

// Bons de Livraison
const DeliveryNoteListPage = lazy(() => import('../pages/DeliveryNotes/DeliveryNoteListPage'));
const DeliveryNoteCreatePage = lazy(() => import('../pages/DeliveryNotes/DeliveryNoteCreatePage'));
const DeliveryNoteEditPage = lazy(() => import('../pages/DeliveryNotes/DeliveryNoteEditPage'));
const DeliveryNoteDetailPage = lazy(() => import('../pages/DeliveryNotes/DeliveryNoteDetailPage'));

// Factures
const InvoiceListPage = lazy(() => import('../pages/Invoices/InvoiceListPage'));
const InvoiceCreatePage = lazy(() => import('../pages/Invoices/InvoiceCreatePage'));
const InvoiceEditPage = lazy(() => import('../pages/Invoices/InvoiceEditPage'));
const InvoiceDetailPage = lazy(() => import('../pages/Invoices/InvoiceDetailPage'));

// Comptabilité
const JournalPage = lazy(() => import('../pages/Accounting/JournalPage'));
const JournalEntryCreatePage = lazy(() => import('../pages/Accounting/JournalEntryCreatePage'));
const LedgerPage = lazy(() => import('../pages/Accounting/LedgerPage'));
const BalanceSheetPage = lazy(() => import('../pages/Accounting/BalanceSheetPage'));
const ChartOfAccountsPage = lazy(() => import('../pages/Accounting/ChartOfAccountsPage'));
const ChartOfAccountCreatePage = lazy(() => import('../pages/Accounting/ChartOfAccountCreatePage'));
const ChartOfAccountEditPage = lazy(() => import('../pages/Accounting/ChartOfAccountEditPage'));

// Administration
const UserManagementPage = lazy(() => import('../pages/Admin/UserManagementPage'));
const UserCreatePage = lazy(() => import('../pages/Admin/UserCreatePage')); // Peut être Admin/UserCreatePage.jsx
const UserEditPage = lazy(() => import('../pages/Admin/UserEditPage'));
const SecurityLogPage = lazy(() => import('../pages/Admin/SecurityLogPage'));
// const SettingsPage = lazy(() => import('../pages/Admin/SettingsPage'));

// Page Non Trouvée
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));


const AppRouter = () => {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Routes Publiques (utilisent AuthLayout via la page elle-même) */}
        <Route path="/login" element={<LoginPage />} />
        {/* Décommentez si vous avez ces pages et qu'elles utilisent AuthLayout */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}
        {/* <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> */}


        {/* Routes Protégées (utilisent MainLayout) */}
        <Route element={<PrivateRoute />}> {/* Enveloppe toutes les routes qui nécessitent MainLayout et authentification */}
          <Route element={<MainLayout />}> {/* Layout pour les routes enfants */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Redirection par défaut */}

            {/* Tableaux de Bord (à affiner selon les rôles si nécessaire) */}
            <Route path="/dashboard" element={<AdminDashboardPage />} /> {/* Ou un composant de sélection de dashboard */}
            {/* Exemple de dashboards spécifiques par rôle :
            <Route path="/dashboard/admin" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></PrivateRoute>} />
            <Route path="/dashboard/manager" element={<PrivateRoute allowedRoles={['MANAGER']}><ManagerDashboardPage /></PrivateRoute>} />
            <Route path="/dashboard/accountant" element={<PrivateRoute allowedRoles={['ACCOUNTANT']}><AccountantDashboardPage /></PrivateRoute>} />
            */}
            <Route path="/profile" element={<UserProfilePage />} />

            {/* Clients */}
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/new" element={<ClientCreatePage />} />
            <Route path="/clients/edit/:clientId" element={<ClientEditPage />} />
            <Route path="/clients/view/:clientId" element={<ClientDetailPage />} />

            {/* Fournisseurs */}
            <Route path="/suppliers" element={<SupplierListPage />} />
            <Route path="/suppliers/new" element={<SupplierCreatePage />} />
            <Route path="/suppliers/edit/:supplierId" element={<SupplierEditPage />} />
            <Route path="/suppliers/view/:supplierId" element={<SupplierDetailPage />} />

            {/* Produits & Stock */}
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/edit/:productId" element={<ProductEditPage />} />
            <Route path="/products/view/:productId" element={<ProductDetailPage />} />
            <Route path="/stock" element={<StockManagementPage />} />

            {/* Devis */}
            <Route path="/quotes" element={<QuoteListPage />} />
            <Route path="/quotes/new" element={<QuoteCreatePage />} />
            <Route path="/quotes/edit/:quoteId" element={<QuoteEditPage />} />
            <Route path="/quotes/view/:quoteId" element={<QuoteDetailPage />} />

            {/* Bons de Livraison */}
            <Route path="/delivery-notes" element={<DeliveryNoteListPage />} />
            <Route path="/delivery-notes/new" element={<DeliveryNoteCreatePage />} />
            <Route path="/delivery-notes/edit/:dnId" element={<DeliveryNoteEditPage />} />
            <Route path="/delivery-notes/view/:dnId" element={<DeliveryNoteDetailPage />} />

            {/* Factures */}
            <Route path="/invoices" element={<InvoiceListPage />} />
            <Route path="/invoices/new" element={<InvoiceCreatePage />} /> {/* Peut prendre ?fromDeliveryNoteId= ou ?fromQuoteId= */}
            <Route path="/invoices/edit/:invoiceId" element={<InvoiceEditPage />} />
            <Route path="/invoices/view/:invoiceId" element={<InvoiceDetailPage />} />

            {/* Comptabilité */}
            <Route path="/accounting/journal" element={<JournalPage />} />
            <Route path="/accounting/journal/new" element={<JournalEntryCreatePage />} />
            {/* <Route path="/accounting/journal/edit/:entryId" element={<JournalEntryEditPage />} /> */}
            {/* <Route path="/accounting/journal/:entryId" element={<JournalEntryDetailPage />} /> */}
            <Route path="/accounting/ledger" element={<LedgerPage />} />
            {/* <Route path="/accounting/ledger/:accountId" element={<LedgerAccountDetailPage />} /> */}
            <Route path="/accounting/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="/accounting/chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="/accounting/chart-of-accounts/new" element={<ChartOfAccountCreatePage />} />
            <Route path="/accounting/chart-of-accounts/edit/:accountId" element={<ChartOfAccountEditPage />} />


            {/* Administration (protégé par rôle si PrivateRoute le gère) */}
            <Route path="/admin/user-management" element={<PrivateRoute allowedRoles={['ADMIN']}><UserManagementPage /></PrivateRoute>} />
            <Route path="/admin/user-management/new" element={<PrivateRoute allowedRoles={['ADMIN']}><UserCreatePage /></PrivateRoute>} />
            <Route path="/admin/user-management/edit/:userId" element={<PrivateRoute allowedRoles={['ADMIN']}><UserEditPage /></PrivateRoute>} />
            <Route path="/admin/security-logs" element={<PrivateRoute allowedRoles={['ADMIN']}><SecurityLogPage /></PrivateRoute>} />
            {/* <Route path="/admin/settings" element={<PrivateRoute allowedRoles={['ADMIN']}><SettingsPage /></PrivateRoute>} /> */}

          </Route> {/* Fin des routes utilisant MainLayout */}
        </Route> {/* Fin des PrivateRoute */}


        {/* Page Non Trouvée */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;