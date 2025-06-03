// gestion-commerciale-app/backend/routes/product.routes.js

const express = require('express');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} = require('../controllers/product.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// --- Routes Publiques ou avec accès moins restreint (à ajuster selon vos besoins) ---

// GET /api/products - Récupérer tous les produits et services
// Peut être public ou nécessiter une simple authentification selon la politique du catalogue.
// Pour cet exemple, nous le laissons accessible aux utilisateurs connectés.
// Si public, retirez 'protect'. Si pour tous les connectés, 'protect' suffit.
router.get('/', protect, getAllProducts); // Ou simplement getAllProducts si public

// GET /api/products/:id - Récupérer un produit ou service spécifique par son ID
router.get('/:id', protect, getProductById); // Ou simplement getProductById si public


// --- Routes nécessitant des droits spécifiques (Admin, Manager) ---

// POST /api/products - Créer un nouveau produit ou service
// Accessible par Admin, Manager
router.post('/', protect, authorize('ADMIN', 'MANAGER'), createProduct);

// PUT /api/products/:id - Mettre à jour un produit ou service
// Accessible par Admin, Manager
router.put('/:id', protect, authorize('ADMIN', 'MANAGER'), updateProduct);

// DELETE /api/products/:id - Supprimer un produit ou service
// Accessible seulement par Admin (action sensible)
router.delete('/:id', protect, authorize('ADMIN'), deleteProduct);

// POST /api/products/:id/adjust-stock - Ajuster manuellement le stock d'un produit
// Accessible par Admin, Manager (ceux qui gèrent les stocks)
router.post('/:id/adjust-stock', protect, authorize('ADMIN', 'MANAGER'), adjustStock);


module.exports = router;