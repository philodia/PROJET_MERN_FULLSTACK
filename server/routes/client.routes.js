// gestion-commerciale-app/backend/routes/client.routes.js

const express = require('express');
const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addClientInteraction,
  deleteClientInteraction,
} = require('../controllers/client.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes pour les clients nécessitent une authentification.
router.use(protect);

// --- Routes CRUD principales pour les Clients ---

// GET /api/clients - Récupérer tous les clients
// Accessible par Admin, Manager, Accountant
router.get('/', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getAllClients);

// POST /api/clients - Créer un nouveau client
// Accessible par Admin, Manager
router.post('/', authorize('ADMIN', 'MANAGER'), createClient);

// GET /api/clients/:id - Récupérer un client spécifique par son ID
// Accessible par Admin, Manager, Accountant
router.get('/:id', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getClientById);

// PUT /api/clients/:id - Mettre à jour un client
// Accessible par Admin, Manager
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateClient);

// DELETE /api/clients/:id - Supprimer un client
// Accessible seulement par Admin (plus restrictif pour la suppression)
router.delete('/:id', authorize('ADMIN'), deleteClient);


// --- Routes pour les Interactions Client ---

// POST /api/clients/:id/interactions - Ajouter une interaction à un client
// Accessible par Admin, Manager
router.post('/:id/interactions', authorize('ADMIN', 'MANAGER'), addClientInteraction);

// DELETE /api/clients/:id/interactions/:interactionId - Supprimer une interaction d'un client
// Accessible par Admin, Manager (ou le créateur de l'interaction si vous ajoutez cette logique)
router.delete('/:id/interactions/:interactionId', authorize('ADMIN', 'MANAGER'), deleteClientInteraction);


module.exports = router;