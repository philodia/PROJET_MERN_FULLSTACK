// gestion-commerciale-app/backend/routes/admin.routes.js

const express = require('express');
const {
  getAdminDashboardStats, // Nom plus spécifique
  getSecurityLogs,
  getAdminChartsData      // Nom plus spécifique
  // ... autres contrôleurs spécifiques à l'admin
} = require('../controllers/admin.controller'); // Assurez-vous que ce chemin est correct

// Importer les middlewares d'authentification et d'autorisation
const { protect, authorize } = require('../middleware/auth.middleware'); // Assurez-vous que ce chemin est correct

const router = express.Router();

// Appliquer les middlewares de protection à toutes les routes de ce routeur
router.use(protect);
router.use(authorize('ADMIN'));

// --- Routes pour les Statistiques et le Tableau de Bord ---
router.get('/dashboard/stats', getAdminDashboardStats); // CORRIGÉ ICI
router.get('/charts-data', getAdminChartsData); // Voir note sur la redondance potentielle

// --- Routes pour les Journaux de Sécurité ---
router.get('/security-logs', getSecurityLogs);

// --- Routes pour la Gestion des Utilisateurs (par l'Admin) ---
// ... (commentaires et exemples comme ci-dessus) ...

router.get('/status-check', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Module Admin opérationnel.' });
});

module.exports = router;