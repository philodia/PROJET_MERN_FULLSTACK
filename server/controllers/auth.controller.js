// gestion-commerciale-app/backend/controllers/auth.controller.js

const User = require('../models/User.model');
const SecurityLog = require('../models/SecurityLog.model'); // Importer le modèle SecurityLog
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const { sendTokenResponse } = require('../utils/jwt.utils');
const config = require('../config');

// Fonction utilitaire pour obtenir l'IP (simplifiée, à améliorer pour les proxies)
const getIpAddress = (req) => {
    // Si 'trust proxy' est configuré dans Express (app.set('trust proxy', 1);), req.ip est plus fiable.
    // Sinon, une approche de base.
    return req.ip || req.headers['x-forwarded-for']?.split(',').shift() || req.connection?.remoteAddress;
};

// @desc    Enregistrer un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, firstName, lastName, role } = req.body;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const userExistsByEmail = await User.findOne({ email });
  if (userExistsByEmail) {
    SecurityLog.createLog({
      level: 'WARN',
      action: 'AUTH_REGISTER_ATTEMPT_FAILURE',
      message: `Tentative d'enregistrement échouée: l'email ${email} existe déjà.`,
      usernameAttempt: username,
      ipAddress,
      userAgent,
      details: { reason: 'Email already exists', providedEmail: email }
    });
    return next(new AppError('Un utilisateur avec cet email existe déjà.', 400));
  }

  const userExistsByUsername = await User.findOne({ username });
  if (userExistsByUsername) {
    SecurityLog.createLog({
      level: 'WARN',
      action: 'AUTH_REGISTER_ATTEMPT_FAILURE',
      message: `Tentative d'enregistrement échouée: le nom d'utilisateur ${username} existe déjà.`,
      usernameAttempt: username,
      ipAddress,
      userAgent,
      details: { reason: 'Username already exists', providedUsername: username }
    });
    return next(new AppError('Un utilisateur avec ce nom d\'utilisateur existe déjà.', 400));
  }

  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role,
  });

  if (user) {
    SecurityLog.createLog({
      level: 'INFO',
      action: 'AUTH_REGISTER_SUCCESS',
      message: `Nouvel utilisateur enregistré: ${user.username} (ID: ${user._id}).`,
      userId: user._id,
      ipAddress,
      userAgent,
      targetResource: 'User',
      targetResourceId: user._id,
      details: { email: user.email, role: user.role }
    });
    sendTokenResponse(user, 201, res, 'Utilisateur enregistré avec succès.');
  } else {
    SecurityLog.createLog({
        level: 'ERROR',
        action: 'AUTH_REGISTER_FAILURE',
        message: `Échec de la création de l'utilisateur pour ${email}/${username} - Données invalides ou erreur interne.`,
        usernameAttempt: username,
        ipAddress,
        userAgent,
        details: { body: req.body } // Logger les données envoyées pour investigation
    });
    return next(new AppError('Données utilisateur invalides ou erreur lors de la création.', 400));
  }
});

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  if (!email || !password) {
    SecurityLog.createLog({
      level: 'WARN',
      action: 'AUTH_LOGIN_ATTEMPT_FAILURE',
      message: `Tentative de connexion échouée: email ou mot de passe manquant. Email tenté: ${email || 'N/A'}.`,
      usernameAttempt: email,
      ipAddress,
      userAgent,
      details: { reason: 'Missing credentials' }
    });
    return next(new AppError('Veuillez fournir un email et un mot de passe.', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    SecurityLog.createLog({
      level: 'WARN',
      action: 'AUTH_LOGIN_FAILURE',
      message: `Tentative de connexion échouée pour l'email ${email}. Raison: Utilisateur non trouvé.`,
      usernameAttempt: email,
      ipAddress,
      userAgent,
      details: { reason: 'User not found' }
    });
    return next(new AppError('Identifiants invalides (email ou mot de passe incorrect).', 401));
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    SecurityLog.createLog({
      level: 'WARN',
      action: 'AUTH_LOGIN_FAILURE',
      message: `Tentative de connexion échouée pour l'utilisateur ${user.username} (ID: ${user._id}). Raison: Mot de passe incorrect.`,
      userId: user._id,
      usernameAttempt: email,
      ipAddress,
      userAgent,
      details: { reason: 'Invalid password' }
    });
    return next(new AppError('Identifiants invalides (email ou mot de passe incorrect).', 401));
  }

  if (!user.isActive) {
    SecurityLog.createLog({
      level: 'WARN',
      action: 'AUTH_LOGIN_FAILURE',
      message: `Tentative de connexion échouée pour l'utilisateur ${user.username} (ID: ${user._id}). Raison: Compte inactif.`,
      userId: user._id,
      ipAddress,
      userAgent,
      details: { reason: 'Account inactive' }
    });
    return next(new AppError('Votre compte a été désactivé. Veuillez contacter l\'administrateur.', 403));
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  SecurityLog.createLog({
    level: 'INFO',
    action: 'AUTH_LOGIN_SUCCESS',
    message: `Utilisateur ${user.username} (ID: ${user._id}) connecté avec succès.`,
    userId: user._id,
    ipAddress,
    userAgent,
  });
  sendTokenResponse(user, 200, res, 'Connexion réussie.');
});

// @desc    Déconnecter un utilisateur
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  // req.user est disponible grâce au middleware 'protect'
  SecurityLog.createLog({
    level: 'INFO',
    action: 'AUTH_LOGOUT_SUCCESS',
    message: `Utilisateur ${req.user.username} (ID: ${req.user.id}) déconnecté.`,
    userId: req.user.id,
    ipAddress,
    userAgent,
  });

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.status(200).json({ success: true, message: 'Déconnexion réussie.' });
});

// @desc    Obtenir l'utilisateur actuellement connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('Utilisateur non trouvé.', 404));
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Mettre à jour les détails de l'utilisateur connecté
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, username } = req.body;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];
  const originalUser = await User.findById(req.user.id); // Pour comparer les changements

  const fieldsToUpdate = {};
  const changedFields = {};

  if (firstName !== undefined && firstName !== originalUser.firstName) {
    fieldsToUpdate.firstName = firstName;
    changedFields.firstName = { old: originalUser.firstName, new: firstName };
  }
  if (lastName !== undefined && lastName !== originalUser.lastName) {
    fieldsToUpdate.lastName = lastName;
    changedFields.lastName = { old: originalUser.lastName, new: lastName };
  }
  if (username && username !== originalUser.username) {
    const userExists = await User.findOne({ username: username, _id: { $ne: req.user.id } });
    if (userExists) {
      return next(new AppError('Ce nom d\'utilisateur est déjà pris.', 400));
    }
    fieldsToUpdate.username = username;
    changedFields.username = { old: originalUser.username, new: username };
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return next(new AppError('Aucun champ à mettre à jour fourni ou aucune modification détectée.', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  SecurityLog.createLog({
    level: 'AUDIT',
    action: 'USER_DETAILS_UPDATED',
    message: `Détails de l'utilisateur ${updatedUser.username} (ID: ${updatedUser._id}) mis à jour par lui-même.`,
    userId: updatedUser._id,
    ipAddress,
    userAgent,
    targetResource: 'User',
    targetResourceId: updatedUser._id,
    details: { fieldsChanged: changedFields }
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
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new AppError('Veuillez fournir le mot de passe actuel, le nouveau mot de passe et sa confirmation.', 400));
  }
  if (newPassword !== confirmNewPassword) {
    return next(new AppError('Le nouveau mot de passe et sa confirmation ne correspondent pas.', 400));
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('Utilisateur non trouvé.', 404));
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    SecurityLog.createLog({
        level: 'WARN',
        action: 'USER_PASSWORD_UPDATE_FAILURE',
        message: `Tentative de mise à jour du mot de passe échouée pour ${user.username} (ID: ${user._id}). Raison: Mot de passe actuel incorrect.`,
        userId: user._id,
        ipAddress,
        userAgent,
        details: { reason: 'Incorrect current password' }
    });
    return next(new AppError('Votre mot de passe actuel est incorrect.', 401));
  }

  if (await user.matchPassword(newPassword)) { // Utiliser matchPassword pour comparer le nouveau avec l'actuel (haché)
    return next(new AppError('Le nouveau mot de passe doit être différent de l\'ancien.', 400));
  }

  user.password = newPassword;
  await user.save(); // Déclenche le hook pre('save') pour hachage et passwordChangedAt

  SecurityLog.createLog({
    level: 'AUDIT',
    action: 'USER_PASSWORD_UPDATED',
    message: `Mot de passe de l'utilisateur ${user.username} (ID: ${user._id}) mis à jour par lui-même.`,
    userId: user._id,
    ipAddress,
    userAgent,
    targetResource: 'User',
    targetResourceId: user._id
  });

  sendTokenResponse(user, 200, res, 'Mot de passe mis à jour avec succès. Une nouvelle session a été initiée.');
});