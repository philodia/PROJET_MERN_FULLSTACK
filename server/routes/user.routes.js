// gestion-commerciale-app/backend/routes/user.routes.js

const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

// Importer les middlewares d'authentification et d'autorisation
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Appliquer le middleware 'protect' à toutes les routes de ce routeur,
// puis le middleware 'authorize' pour s'assurer que seul un ADMIN peut y accéder.
// C'est une façon concise de protéger toutes les routes ci-dessous.
router.use(protect);
router.use(authorize('ADMIN')); // Seuls les utilisateurs avec le rôle 'ADMIN' peuvent accéder à ces routes.

// @route   GET /api/users
// @desc    Récupérer tous les utilisateurs (Admin)
// @access  Private/Admin
router.get('/', getAllUsers);

// @route   POST /api/users
// @desc    Créer un nouvel utilisateur (Admin)
// @access  Private/Admin
router.post('/', createUser);

// @route   GET /api/users/:id
// @desc    Récupérer un utilisateur spécifique par son ID (Admin)
// @access  Private/Admin
router.get('/:id', getUserById);

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur (Admin)
// @access  Private/Admin
router.put('/:id', updateUser);

// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur (Admin)
// @access  Private/Admin
router.delete('/:id', deleteUser);

module.exports = router;