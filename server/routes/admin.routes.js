// gestion-commerciale-app/backend/routes/admin.routes.js

const express = require('express');
const {
  getDashboardStats,
  getSecurityLogs,
  getChartsData
} = require('../controllers/admin.controller');

// Les contrôleurs pour la gestion CRUD des utilisateurs sont dans user.controller.js
// et les routes correspondantes sont dans user.routes.js, déjà protégées pour les admins.
// Il n'est donc pas nécessaire de les redéfinir ici, sauf si vous avez des actions admin
// très spécifiques sur les utilisateurs qui ne sont pas couvertes par le CRUD standard.
// Par exemple:
// const {
//   batchSuspendUsers,
//   impersonateUser,
// } = require('../controllers/adminUserActions.controller'); // Fichier contrôleur hypothétique

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes dans ce fichier sont réservées aux administrateurs.
router.use(protect); // S'assurer que l'utilisateur est connecté
router.use(authorize('ADMIN')); // S'assurer que l'utilisateur a le rôle ADMIN

// --- Routes pour les Statistiques et le Tableau de Bord ---

// @route   GET /api/admin/dashboard-stats
// @desc    Récupérer les statistiques clés pour le tableau de bord administrateur
// @access  Private/Admin
router.get('/dashboard-stats', getDashboardStats);

// @route   GET /api/admin/charts-data
// @desc    Récupérer les données formatées pour les graphiques du tableau de bord
// @access  Private/Admin
router.get('/charts-data', getChartsData);


// --- Routes pour les Journaux de Sécurité ---

// @route   GET /api/admin/security-logs
// @desc    Récupérer les journaux de sécurité avec filtres et pagination
// @access  Private/Admin
router.get('/security-logs', getSecurityLogs);


// --- Routes pour la Gestion des Utilisateurs (par l'Admin) ---
// Les routes CRUD de base pour les utilisateurs (lister, créer, voir, modifier, supprimer)
// sont déjà définies dans `user.routes.js` et sont protégées pour les admins.
// Par exemple:
// GET /api/users -> getAllUsers (admin)
// POST /api/users -> createUser (admin)
// GET /api/users/:id -> getUserById (admin)
// PUT /api/users/:id -> updateUser (admin)
// DELETE /api/users/:id -> deleteUser (admin)

// Si vous avez des actions d'administration d'utilisateurs plus spécifiques
// qui ne sont pas un simple CRUD, vous pouvez les ajouter ici.
// Exemple (nécessiterait des contrôleurs dédiés) :
//
// @route   POST /api/admin/users/batch-suspend
// @desc    Suspendre plusieurs utilisateurs en lot
// @access  Private/Admin
// router.post('/users/batch-suspend', batchSuspendUsers);
//
// @route   POST /api/admin/users/:id/impersonate
// @desc    Permettre à un admin de se connecter en tant qu'un autre utilisateur (avec précautions extrêmes)
// @access  Private/Admin
// router.post('/users/:id/impersonate', impersonateUser);


// Route de statut pour ce module (optionnel)
router.get('/status', (req, res) => {
    res.json({ status: 'OK', message: 'Admin module is active.' });
});


module.exports = router;