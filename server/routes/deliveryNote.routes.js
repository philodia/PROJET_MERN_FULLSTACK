// gestion-commerciale-app/backend/routes/deliveryNote.routes.js

const express = require('express');
const {
  getAllDeliveryNotes,
  getDeliveryNoteById,
  createDeliveryNote,
  updateDeliveryNote,
  deleteDeliveryNote,
  updateDeliveryNoteStatus,
  // exportDeliveryNotePDF, // Si vous implémentez l'export PDF
} = require('../controllers/deliveryNote.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes pour les bons de livraison nécessitent une authentification.
router.use(protect);

// --- Routes CRUD principales pour les Bons de Livraison ---

// GET /api/delivery-notes - Récupérer tous les bons de livraison
// Accessible par Admin, Manager, Accountant
router.get('/', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getAllDeliveryNotes);

// POST /api/delivery-notes - Créer un nouveau bon de livraison
// Accessible par Admin, Manager
router.post('/', authorize('ADMIN', 'MANAGER'), createDeliveryNote);

// GET /api/delivery-notes/:id - Récupérer un bon de livraison spécifique par son ID
// Accessible par Admin, Manager, Accountant
router.get('/:id', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getDeliveryNoteById);

// PUT /api/delivery-notes/:id - Mettre à jour un bon de livraison
// Accessible par Admin, Manager (avec restrictions dans le contrôleur pour les statuts avancés)
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateDeliveryNote);

// DELETE /api/delivery-notes/:id - Supprimer un bon de livraison
// Accessible seulement par Admin (action sensible, surtout si le stock a été impacté)
router.delete('/:id', authorize('ADMIN'), deleteDeliveryNote);


// --- Routes pour les actions spécifiques sur les Bons de Livraison ---

// PATCH /api/delivery-notes/:id/status - Changer le statut d'un bon de livraison
// Accessible par Admin, Manager (ceux qui gèrent le processus logistique)
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), updateDeliveryNoteStatus);


// --- Route optionnelle pour l'export PDF (à décommenter et implémenter si besoin) ---

// GET /api/delivery-notes/:id/pdf - Télécharger le bon de livraison en PDF
// Accessible par Admin, Manager, Accountant
// router.get('/:id/pdf', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), exportDeliveryNotePDF);


module.exports = router;