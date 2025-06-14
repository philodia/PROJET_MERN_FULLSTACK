// gestion-commerciale-app/backend/routes/index.js
// Ce fichier agit comme le routeur principal pour tous les endpoints de l'API
// qui seront préfixés par '/api' dans server.js.

const express = require('express');
const router = express.Router(); // Créer une instance de express.Router()

// --- Importer les Routeurs des Différents Modules ---
// Assurez-vous que les chemins et les noms de fichiers sont exacts.
const authRoutes = require('./auth.routes');           // Authentification (login, register, me, etc.)
const userRoutes = require('./user.routes');           // Gestion des utilisateurs (potentiellement pour le profil de l'utilisateur connecté)
const productRoutes = require('./product.routes');       // Gestion des produits/services et stock
const clientRoutes = require('./client.routes');         // Gestion des clients
const supplierRoutes = require('./supplier.routes');     // Gestion des fournisseurs
const quoteRoutes = require('./quote.routes');          // Gestion des devis
const deliveryNoteRoutes = require('./deliveryNote.routes'); // Gestion des bons de livraison
const invoiceRoutes = require('./invoice.routes');        // Gestion des factures
const accountingRoutes = require('./accounting.routes');   // Routes pour la comptabilité (journal, grand livre, etc.)
const adminRoutes = require('./admin.routes');          // Routes spécifiques à l'administration (dashboard, logs, gestion globale)

// Optionnel: si vous avez des rapports complexes qui méritent leur propre module de routes
// const reportRoutes = require('./report.routes');

// --- Monter les Routeurs des Modules sur leurs Chemins Respectifs ---
// Ces chemins seront relatifs au préfixe global défini dans server.js (ex: '/api')

router.use('/auth', authRoutes);                     // Ex: /api/auth/login
router.use('/users', userRoutes);                   // Ex: /api/users/profile (si c'est une route utilisateur)
router.use('/products', productRoutes);               // Ex: /api/products
router.use('/clients', clientRoutes);                 // Ex: /api/clients
router.use('/suppliers', supplierRoutes);             // Ex: /api/suppliers
router.use('/quotes', quoteRoutes);                  // Ex: /api/quotes
router.use('/delivery-notes', deliveryNoteRoutes);    // Ex: /api/delivery-notes
router.use('/invoices', invoiceRoutes);               // Ex: /api/invoices
router.use('/accounting', accountingRoutes);          // Ex: /api/accounting/journal
router.use('/admin', adminRoutes);                   // Ex: /api/admin/dashboard-stats

// Si vous avez des rapports :
// router.use('/reports', reportRoutes);              // Ex: /api/reports/sales-summary

// --- Route de Statut pour ce Routeur Principal ---
// Utile pour vérifier si ce module de routage est correctement chargé et accessible.
// Sera accessible via /api/status (si monté sur /api dans server.js)
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API Main Router is active and healthy.',
    timestamp: new Date().toISOString(),
  });
});

// Exporter le routeur principal pour qu'il soit utilisé dans server.js
module.exports = router;