// gestion-commerciale-app/backend/controllers/auth.controller.js

const User = require('../models/User.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const { sendTokenResponse, generateToken } = require('../utils/jwt.utils'); // generateToken n'est plus directement utilisé ici si sendTokenResponse le fait
const { comparePassword } = require('../utils/password.utils'); // Pas nécessaire ici si on utilise user.matchPassword()
const config = require('../config'); // Pour JWT_COOKIE_EXPIRES_IN
// const crypto = require('crypto'); // Si vous implémentez la réinitialisation de mot de passe

// @desc    Enregistrer un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public (ou Admin si vous voulez que seuls les admins créent des comptes)
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  // Vérifier si l'utilisateur existe déjà (par email ou username)
  const userExistsByEmail = await User.findOne({ email });
  if (userExistsByEmail) {
    return next(new AppError('Un utilisateur avec cet email existe déjà.', 400));
  }
  const userExistsByUsername = await User.findOne({ username });
  if (userExistsByUsername) {
    return next(new AppError('Un utilisateur avec ce nom d\'utilisateur existe déjà.', 400));
  }

  // Créer l'utilisateur
  // Le hachage du mot de passe est géré par le hook pre('save') du modèle User
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role, // S'assurer que le rôle est valide (géré par l'enum du modèle)
  });

  if (user) {
    sendTokenResponse(user, 201, res, 'Utilisateur enregistré avec succès.');
  } else {
    // Normalement, si User.create échoue, il lèvera une erreur attrapée par asyncHandler
    return next(new AppError('Données utilisateur invalides ou erreur lors de la création.', 400));
  }
});

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Vérifier si email et mot de passe existent
  if (!email || !password) {
    return next(new AppError('Veuillez fournir un email et un mot de passe.', 400));
  }

  // 2) Vérifier si l'utilisateur existe et si le mot de passe est correct
  //    Nous devons explicitement sélectionner le mot de passe car il a `select: false` dans le modèle.
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Identifiants invalides (email ou mot de passe incorrect).', 401)); // Message générique pour la sécurité
  }

  // Utiliser la méthode matchPassword du modèle User, qui utilise notre utilitaire comparePassword
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new AppError('Identifiants invalides (email ou mot de passe incorrect).', 401));
  }

  // 3) Vérifier si le compte est actif
  if (!user.isActive) {
    return next(new AppError('Votre compte a été désactivé. Veuillez contacter l\'administrateur.', 403));
  }

  // 4) Mettre à jour la date de dernière connexion
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false }); // Sauvegarder sans re-valider/re-hacher le mdp

  // 5) Si tout est ok, envoyer le token au client
  sendTokenResponse(user, 200, res, 'Connexion réussie.');
});

// @desc    Déconnecter un utilisateur
// @route   POST /api/auth/logout
// @access  Private (nécessite d'être connecté)
exports.logout = asyncHandler(async (req, res, next) => {
  // Pour déconnecter, nous supprimons le cookie JWT côté client.
  // Le token lui-même reste valide jusqu'à son expiration, mais sans le cookie,
  // le client ne peut plus l'envoyer automatiquement.
  // Une solution plus robuste impliquerait une liste noire de tokens côté serveur (plus complexe).

  res.cookie('jwt', 'loggedout', { // Remplacer le cookie par une valeur vide ou 'loggedout'
    expires: new Date(Date.now() + 10 * 1000), // Expiration très courte
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.status(200).json({ success: true, message: 'Déconnexion réussie.' });
});

// @desc    Obtenir l'utilisateur actuellement connecté
// @route   GET /api/auth/me
// @access  Private (utilise le middleware 'protect')
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user est défini par le middleware 'protect'
  // Nous récupérons à nouveau l'utilisateur pour avoir les données les plus fraîches
  // et potentiellement appliquer des projections ou des populate si nécessaire.
  const user = await User.findById(req.user.id);

  if (!user) {
    // Ce cas ne devrait pas arriver si 'protect' fonctionne correctement
    return next(new AppError('Utilisateur non trouvé.', 404));
  }

  res.status(200).json({
    success: true,
    data: user, // Le modèle User a `toJSON: { virtuals: true }` donc les virtuels sont inclus
                // Le mot de passe est exclu par défaut grâce à `select: false`
  });
});


// --- Fonctions optionnelles pour la mise à jour du profil et du mot de passe ---

// @desc    Mettre à jour les détails de l'utilisateur connecté
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  // Champs autorisés à être mis à jour (exclure rôle, email, mot de passe ici)
  const { firstName, lastName, username /*, autres champs modifiables */ } = req.body;

  const fieldsToUpdate = {};
  if (firstName) fieldsToUpdate.firstName = firstName;
  if (lastName) fieldsToUpdate.lastName = lastName;
  if (username) { // Si le username est modifiable, vérifier l'unicité
    const userExists = await User.findOne({ username: username, _id: { $ne: req.user.id } });
    if (userExists) {
        return next(new AppError('Ce nom d\'utilisateur est déjà pris.', 400));
    }
    fieldsToUpdate.username = username;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return next(new AppError('Aucun champ à mettre à jour fourni.', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true, // Retourner le document mis à jour
    runValidators: true, // Exécuter les validateurs du schéma sur les champs mis à jour
  });

  res.status(200).json({
    success: true,
    message: 'Détails mis à jour avec succès.',
    data: updatedUser,
  });
});

// @desc    Mettre à jour le mot de passe de l'utilisateur connecté
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new AppError('Veuillez fournir le mot de passe actuel, le nouveau mot de passe et sa confirmation.', 400));
  }

  if (newPassword !== confirmNewPassword) {
    return next(new AppError('Le nouveau mot de passe et sa confirmation ne correspondent pas.', 400));
  }

  // Récupérer l'utilisateur AVEC son mot de passe actuel pour le comparer
  const user = await User.findById(req.user.id).select('+password');

  if (!user) { // Ne devrait pas arriver si 'protect' fonctionne
      return next(new AppError('Utilisateur non trouvé.', 404));
  }

  // Vérifier le mot de passe actuel
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Votre mot de passe actuel est incorrect.', 401));
  }

  // Vérifier si le nouveau mot de passe est différent de l'ancien
  if (currentPassword === newPassword) {
    return next(new AppError('Le nouveau mot de passe doit être différent de l\'ancien.', 400));
  }

  // Mettre à jour le mot de passe (le hook pre('save') dans User.model s'occupera du hachage et de passwordChangedAt)
  user.password = newPassword;
  await user.save(); // Cela déclenchera le hook pre('save')

  // Le token JWT actuel sera invalidé à la prochaine requête si passwordChangedAt est utilisé dans 'protect'
  // Renvoyer un nouveau token pour maintenir la session.
  sendTokenResponse(user, 200, res, 'Mot de passe mis à jour avec succès. Veuillez vous reconnecter si nécessaire.');
});


// --- Fonctions pour la réinitialisation de mot de passe (à implémenter si besoin) ---
// exports.forgotPassword = asyncHandler(async (req, res, next) => { /* ... */ });
// exports.resetPassword = asyncHandler(async (req, res, next) => { /* ... */ });