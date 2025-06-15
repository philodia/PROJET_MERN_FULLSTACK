// frontend/src/app/store.js
import { configureStore } from '@reduxjs/toolkit';

// --- Reducers des Features ---
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';

// Gestion des Utilisateurs (par l'Admin)
import usersAdminReducer from '../features/users/userSlice'; // Supposant que userSlice.js est pour l'admin
                                                          // et que le nom du slice est 'usersAdmin'

// Journaux de Sécurité (Admin)
import securityLogReducer from '../features/securityLogs/securityLogSlice'; // Assurez-vous que ce slice existe

// Modules Commerciaux
import clientReducer from '../features/clients/clientSlice';         // Existe
import productReducer from '../features/products/productSlice';       // À créer ou vérifier
import supplierReducer from '../features/suppliers/supplierSlice';   // À créer ou vérifier
import quoteReducer from '../features/quotes/quoteSlice';           // À créer ou vérifier
import deliveryNoteReducer from '../features/deliveryNotes/deliveryNoteSlice'; // À créer ou vérifier
//import invoiceReducer from '../features/invoices/invoiceSlice';         // Existe

// Modules Comptables (Exemples, à créer ou vérifier)
// import journalReducer from '../features/accounting/journalSlice';
// import ledgerReducer from '../features/accounting/ledgerSlice';
// import balanceSheetReducer from '../features/accounting/balanceSheetSlice';
// import chartOfAccountsReducer from '../features/accounting/chartOfAccountsSlice';

// (Optionnel) Dashboard Admin (si géré par Redux)
// import adminDashboardReducer from '../features/admin/adminDashboardSlice';

// (Optionnel) Middleware de logging pour le développement
// import logger from 'redux-logger'; // npm install --save-dev redux-logger

// --- Configuration du Root Reducer ---
const rootReducer = {
  auth: authReducer, // state.auth
  ui: uiReducer,     // state.ui

  // Section Admin
  usersAdmin: usersAdminReducer,   // state.usersAdmin (pour la liste des utilisateurs gérée par l'admin)
  securityLogs: securityLogReducer, // state.securityLogs
  // adminDashboard: adminDashboardReducer, // state.adminDashboard

  // Modules principaux
  clients: clientReducer,       // state.clients
  products: productReducer,     // state.products
  suppliers: supplierReducer,   // state.suppliers
  quotes: quoteReducer,         // state.quotes
  deliveryNotes: deliveryNoteReducer, // state.deliveryNotes
  // invoices: invoiceReducer,     // state.invoices

  // Modules comptables
  // journal: journalReducer,
  // ledger: ledgerReducer,
  // balanceSheet: balanceSheetReducer,
  // chartOfAccounts: chartOfAccountsReducer,
};

// --- Configuration des Middlewares ---
const middlewaresToApply = [];

if (process.env.NODE_ENV === 'development') {
  // const logger = require('redux-logger').default; // Importer dynamiquement si utilisé
  // middlewaresToApply.push(logger); // Décommentez si vous installez et utilisez redux-logger
}

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Configuration pour serializableCheck (par défaut activé avec avertissements)
      // Vous pouvez l'ignorer ou le configurer si vous avez des besoins spécifiques.
      // Ex: si vous stockez des fonctions non sérialisables dans des actions (non recommandé)
      // serializableCheck: {
      //   ignoredActions: ['ui/openModalWithCallback'],
      //   ignoredPaths: ['ui.modalProps.onConfirmCallback'],
      // }
    }).concat(middlewaresToApply), // Ajouter vos middlewares personnalisés ici

  // Activer les Redux DevTools en développement (comportement par défaut)
  // et les désactiver en production pour la performance et la sécurité.
  devTools: process.env.NODE_ENV !== 'production',
});

// --- Types pour TypeScript (bonne pratique même en JS pour la clarté) ---
/**
 * Le type de l'état racine global de l'application.
 * @typedef {ReturnType<typeof store.getState>} RootState
 */

/**
 * Le type de la fonction dispatch de l'application.
 * @typedef {typeof store.dispatch} AppDispatch
 */