// gestion-commerciale-app/backend/routes/quote.routes.js

const express = require('express');
const {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  updateQuoteStatus,
  // exportQuotePDF, // Si vous avez une fonction pour exporter en PDF
  // convertQuoteToInvoice, // Si vous avez cette fonctionnalité
  // convertQuoteToDeliveryNote, // Si vous avez cette fonctionnalité
} = require('../controllers/quote.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes pour les devis nécessitent une authentification.
router.use(protect);

// --- Routes CRUD principales pour les Devis ---

// GET /api/quotes - Récupérer tous les devis
// Accessible par Admin, Manager, Accountant
router.get('/', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getAllQuotes);

// POST /api/quotes - Créer un nouveau devis
// Accessible par Admin, Manager
router.post('/', authorize('ADMIN', 'MANAGER'), createQuote);

// GET /api/quotes/:id - Récupérer un devis spécifique par son ID
// Accessible par Admin, Manager, Accountant
router.get('/:id', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getQuoteById);

// PUT /api/quotes/:id - Mettre à jour un devis
// Accessible par Admin, Manager (avec des restrictions dans le contrôleur pour les statuts avancés)
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateQuote);

// DELETE /api/quotes/:id - Supprimer un devis
// Accessible par Admin (et Manager pour les brouillons, géré dans le contrôleur)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteQuote);


// --- Routes pour les actions spécifiques sur les Devis ---

// PATCH /api/quotes/:id/status - Changer le statut d'un devis
// Accessible par Admin, Manager
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), updateQuoteStatus);


// --- Routes optionnelles (à décommenter et implémenter si besoin) ---

// GET /api/quotes/:id/pdf - Télécharger le devis en PDF
// Accessible par Admin, Manager, Accountant (et peut-être le client si un système d'accès client est prévu)
// router.get('/:id/pdf', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), exportQuotePDF);

// POST /api/quotes/:id/convert-to-invoice - Convertir un devis en facture
// Accessible par Admin, Manager
// router.post('/:id/convert-to-invoice', authorize('ADMIN', 'MANAGER'), convertQuoteToInvoice);

// POST /api/quotes/:id/convert-to-delivery-note - Convertir un devis en bon de livraison
// Accessible par Admin, Manager
// router.post('/:id/convert-to-delivery-note', authorize('ADMIN', 'MANAGER'), convertQuoteToDeliveryNote);


module.exports = router;