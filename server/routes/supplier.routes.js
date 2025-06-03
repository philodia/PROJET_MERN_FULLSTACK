// gestion-commerciale-app/backend/routes/supplier.routes.js

const express = require('express');
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  addSupplierInteraction,
  deleteSupplierInteraction,
} = require('../controllers/supplier.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes pour les fournisseurs nécessitent une authentification.
router.use(protect);

// --- Routes CRUD principales pour les Fournisseurs ---

// GET /api/suppliers - Récupérer tous les fournisseurs
// Accessible par Admin, Manager, Accountant (pour consultation)
router.get('/', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getAllSuppliers);

// POST /api/suppliers - Créer un nouveau fournisseur
// Accessible par Admin, Manager (ceux qui gèrent les relations fournisseurs)
router.post('/', authorize('ADMIN', 'MANAGER'), createSupplier);

// GET /api/suppliers/:id - Récupérer un fournisseur spécifique par son ID
// Accessible par Admin, Manager, Accountant
router.get('/:id', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getSupplierById);

// PUT /api/suppliers/:id - Mettre à jour un fournisseur
// Accessible par Admin, Manager
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateSupplier);

// DELETE /api/suppliers/:id - Supprimer un fournisseur
// Accessible seulement par Admin (action sensible)
router.delete('/:id', authorize('ADMIN'), deleteSupplier);


// --- Routes pour les Interactions Fournisseur ---

// POST /api/suppliers/:id/interactions - Ajouter une interaction à un fournisseur
// Accessible par Admin, Manager
router.post('/:id/interactions', authorize('ADMIN', 'MANAGER'), addSupplierInteraction);

// DELETE /api/suppliers/:id/interactions/:interactionId - Supprimer une interaction d'un fournisseur
// Accessible par Admin, Manager
router.delete('/:id/interactions/:interactionId', authorize('ADMIN', 'MANAGER'), deleteSupplierInteraction);


module.exports = router;