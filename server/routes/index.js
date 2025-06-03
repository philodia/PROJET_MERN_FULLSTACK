// gestion-commerciale-app/backend/routes/index.js

const express = require('express');
const router = express.Router();

// Importer les différents fichiers de routes des modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const clientRoutes = require('./client.routes');
const supplierRoutes = require('./supplier.routes');
const quoteRoutes = require('./quote.routes');
const deliveryNoteRoutes = require('./deliveryNote.routes');
const invoiceRoutes = require('./invoice.routes');
const accountingRoutes = require('./accounting.routes');
const adminRoutes = require('./admin.routes');
// const reportRoutes = require('./report.routes'); // Si vous avez un fichier séparé pour les rapports

// Définir un préfixe de base pour toutes les routes de l'API (optionnel ici,
// car le préfixe '/api' est généralement appliqué dans server.js)

// Monter les routes des modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/clients', clientRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/quotes', quoteRoutes);
router.use('/delivery-notes', deliveryNoteRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/accounting', accountingRoutes); // Pour journal, grand livre, bilan, etc.
router.use('/admin', adminRoutes); // Pour stats, logs, gestion utilisateurs avancée
// router.use('/reports', reportRoutes);

// Route de test simple pour vérifier que le routeur principal fonctionne
router.get('/status', (req, res) => {
  res.json({ status: 'OK', message: 'API Main Router is active.' });
});

module.exports = router;