// gestion-commerciale-app/backend/routes/auth.routes.js

const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  // forgotPassword,     // Décommentez si vous implémentez ces fonctionnalités
  // resetPassword,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware'); // Importer uniquement 'protect' pour la plupart des routes ici

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Enregistrer un nouvel utilisateur
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Connecter un utilisateur existant
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Déconnecter l'utilisateur actuel
// @access  Private (nécessite d'être connecté pour avoir un cookie à invalider)
router.post('/logout', protect, logout); // 'protect' pour s'assurer qu'un utilisateur est identifié pour la déconnexion

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur actuellement connecté
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/updatedetails
// @desc    Mettre à jour les détails du profil de l'utilisateur connecté
// @access  Private
router.put('/updatedetails', protect, updateDetails);

// @route   PUT /api/auth/updatepassword
// @desc    Mettre à jour le mot de passe de l'utilisateur connecté
// @access  Private
router.put('/updatepassword', protect, updatePassword);


// --- Routes optionnelles pour la réinitialisation de mot de passe ---
// @route   POST /api/auth/forgotpassword
// @desc    Demander une réinitialisation de mot de passe (envoi d'email avec token)
// @access  Public
// router.post('/forgotpassword', forgotPassword);

// @route   PUT /api/auth/resetpassword/:resettoken
// @desc    Réinitialiser le mot de passe en utilisant le token
// @access  Public (le token lui-même sert d'autorisation temporaire)
// router.put('/resetpassword/:resettoken', resetPassword);


module.exports = router;