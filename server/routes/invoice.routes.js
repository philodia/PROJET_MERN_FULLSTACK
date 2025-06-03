// gestion-commerciale-app/backend/routes/invoice.routes.js

const express = require('express');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  downloadInvoicePDF,
  // updateInvoiceStatus, // Si vous avez une route dédiée pour changer uniquement le statut
} = require('../controllers/invoice.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes pour les factures nécessitent une authentification.
router.use(protect);

// --- Routes CRUD principales pour les Factures ---

// GET /api/invoices - Récupérer toutes les factures
// Accessible par Admin, Manager, Accountant
router.get('/', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getAllInvoices);

// POST /api/invoices - Créer une nouvelle facture
// Accessible par Admin, Manager
router.post('/', authorize('ADMIN', 'MANAGER'), createInvoice);

// GET /api/invoices/:id - Récupérer une facture spécifique par son ID
// Accessible par Admin, Manager, Accountant
router.get('/:id', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getInvoiceById);

// PUT /api/invoices/:id - Mettre à jour une facture
// Accessible par Admin, Manager (avec restrictions dans le contrôleur pour les statuts/champs)
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateInvoice);

// DELETE /api/invoices/:id - Supprimer une facture (action très sensible)
// Accessible seulement par Admin (et avec restrictions dans le contrôleur)
router.delete('/:id', authorize('ADMIN'), deleteInvoice);


// --- Routes pour les actions spécifiques sur les Factures ---

// POST /api/invoices/:id/payments - Enregistrer un paiement pour une facture
// Accessible par Admin, Accountant, Manager
router.post('/:id/payments', authorize('ADMIN', 'ACCOUNTANT', 'MANAGER'), recordPayment);

// GET /api/invoices/:id/pdf - Télécharger la facture en PDF
// Accessible par Admin, Manager, Accountant
router.get('/:id/pdf', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), downloadInvoicePDF);

// Optionnel: Route dédiée pour changer le statut si la logique est complexe
// PATCH /api/invoices/:id/status - Changer le statut d'une facture
// router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), updateInvoiceStatus);


module.exports = router;