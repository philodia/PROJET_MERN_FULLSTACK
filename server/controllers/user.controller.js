// gestion-commerciale-app/backend/controllers/user.controller.js

const User = require('../models/User.model');
const SecurityLog = require('../models/SecurityLog.model'); // Importer SecurityLog
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');

// Fonction utilitaire pour obtenir l'IP (simplifiée, à améliorer pour les proxies)
const getIpAddress = (req) => {
    return req.ip || req.headers['x-forwarded-for']?.split(',').shift() || req.connection?.remoteAddress;
};

// @desc    Récupérer tous les utilisateurs (avec filtres, tri, pagination)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .search(['username', 'email', 'firstName', 'lastName'])
    .sort()
    .limitFields()
    .paginate();

  const users = await features.mongooseQuery;

  const totalUsers = await new APIFeatures(User.find(features.mongooseQuery.getFilter()), req.query)
                                .filter()
                                .search(['username', 'email', 'firstName', 'lastName'])
                                .count();

  // Log de l'action (optionnel pour une simple lecture, mais peut être utile pour l'audit d'accès)
  // SecurityLog.createLog({
  //   level: 'INFO',
  //   action: 'ADMIN_GET_ALL_USERS',
  //   message: `L'administrateur ${req.user.username} a consulté la liste des utilisateurs. Critères: ${JSON.stringify(req.query)}`,
  //   userId: req.user.id,
  //   ipAddress: getIpAddress(req),
  //   userAgent: req.headers['user-agent'],
  // });

  res.status(200).json({
    success: true,
    count: users.length,
    total: totalUsers,
    pagination: {
        currentPage: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 100,
        totalPages: Math.ceil(totalUsers / (parseInt(req.query.limit, 10) || 100)) || 1
    },
    data: users,
  });
});

// @desc    Récupérer un utilisateur par son ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError(`Utilisateur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // SecurityLog.createLog({
  //   level: 'INFO',
  //   action: 'ADMIN_GET_USER_BY_ID',
  //   message: `L'administrateur ${req.user.username} a consulté l'utilisateur ${user.username} (ID: ${user._id}).`,
  //   userId: req.user.id,
  //   ipAddress: getIpAddress(req),
  //   userAgent: req.headers['user-agent'],
  //   targetResource: 'User',
  //   targetResourceId: user._id,
  // });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Créer un nouvel utilisateur (par un Admin)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const { username, email, password, firstName, lastName, role, isActive } = req.body;
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  const userExistsByEmail = await User.findOne({ email });
  if (userExistsByEmail) {
    SecurityLog.createLog({
        level: 'WARN',
        action: 'ADMIN_CREATE_USER_FAILURE',
        message: `Tentative par ${req.user.username} de créer un utilisateur avec un email existant: ${email}.`,
        userId: req.user.id,
        ipAddress, userAgent,
        details: { reason: 'Email already exists', providedData: req.body }
    });
    return next(new AppError('Un utilisateur avec cet email existe déjà.', 400));
  }
  const userExistsByUsername = await User.findOne({ username });
  if (userExistsByUsername) {
    SecurityLog.createLog({
        level: 'WARN',
        action: 'ADMIN_CREATE_USER_FAILURE',
        message: `Tentative par ${req.user.username} de créer un utilisateur avec un nom d'utilisateur existant: ${username}.`,
        userId: req.user.id,
        ipAddress, userAgent,
        details: { reason: 'Username already exists', providedData: req.body }
    });
    return next(new AppError('Un utilisateur avec ce nom d\'utilisateur existe déjà.', 400));
  }

  const user = await User.create({
    username, email, password, firstName, lastName, role, isActive,
  });

  SecurityLog.createLog({
    level: 'AUDIT',
    action: 'ADMIN_USER_CREATED',
    message: `L'administrateur ${req.user.username} a créé un nouvel utilisateur: ${user.username} (ID: ${user._id}).`,
    userId: req.user.id,
    ipAddress, userAgent,
    targetResource: 'User',
    targetResourceId: user._id,
    details: { createdUserData: { username: user.username, email: user.email, role: user.role, isActive: user.isActive } }
  });

  res.status(201).json({
    success: true,
    message: 'Utilisateur créé avec succès.',
    data: user,
  });
});

// @desc    Mettre à jour un utilisateur (par un Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const updateData = req.body; // Prend tous les champs du body
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];

  let user = await User.findById(userId);
  if (!user) {
    return next(new AppError(`Utilisateur non trouvé avec l'ID ${userId}`, 404));
  }

  // Stocker les anciennes valeurs pour le log
  const oldValues = {
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
  };

  // Mettre à jour les champs
  if (updateData.username && updateData.username !== user.username) {
    const usernameExists = await User.findOne({ username: updateData.username, _id: { $ne: userId } });
    if (usernameExists) {
      return next(new AppError('Ce nom d\'utilisateur est déjà pris.', 400));
    }
    user.username = updateData.username;
  }
  if (updateData.email && updateData.email !== user.email) {
    const emailExists = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
    if (emailExists) {
      return next(new AppError('Cet email est déjà utilisé par un autre compte.', 400));
    }
    user.email = updateData.email;
  }
  if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
  if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
  if (updateData.role) user.role = updateData.role;
  if (updateData.isActive !== undefined) user.isActive = updateData.isActive;

  if (updateData.password) {
    if (updateData.password.length < 8) {
      return next(new AppError('Le mot de passe doit contenir au moins 8 caractères.', 400));
    }
    user.password = updateData.password; // Le hook pre('save') s'occupera du hachage
  }

  const updatedUser = await user.save();

  // Préparer les nouvelles valeurs pour le log
  const newValues = {
    username: updatedUser.username,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
    ...(updateData.password && { passwordChanged: true }) // Indiquer si le mdp a été changé
  };

  SecurityLog.createLog({
    level: 'AUDIT',
    action: 'ADMIN_USER_UPDATED',
    message: `L'administrateur ${req.user.username} a mis à jour l'utilisateur ${updatedUser.username} (ID: ${updatedUser._id}).`,
    userId: req.user.id,
    ipAddress, userAgent,
    targetResource: 'User',
    targetResourceId: updatedUser._id,
    details: { oldValues, newValues }
  });

  res.status(200).json({
    success: true,
    message: 'Utilisateur mis à jour avec succès.',
    data: updatedUser,
  });
});


// @desc    Supprimer un utilisateur (par un Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'];
  const userToDelete = await User.findById(req.params.id);

  if (!userToDelete) {
    return next(new AppError(`Utilisateur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  if (req.user && req.user.id === userToDelete.id.toString()) {
    SecurityLog.createLog({
        level: 'WARN',
        action: 'ADMIN_DELETE_USER_FAILURE',
        message: `L'administrateur ${req.user.username} a tenté de se supprimer lui-même (ID: ${userToDelete._id}). Action refusée.`,
        userId: req.user.id,
        ipAddress, userAgent,
        targetResource: 'User',
        targetResourceId: userToDelete._id,
        details: { reason: 'Admin cannot delete self via this route' }
    });
    return next(new AppError('Vous ne pouvez pas supprimer votre propre compte administrateur via cette route.', 400));
  }

  const deletedUserDetails = {
      username: userToDelete.username,
      email: userToDelete.email,
      role: userToDelete.role,
      id: userToDelete._id
  };

  await userToDelete.deleteOne();

  SecurityLog.createLog({
    level: 'AUDIT',
    action: 'ADMIN_USER_DELETED',
    message: `L'administrateur ${req.user.username} a supprimé l'utilisateur ${deletedUserDetails.username} (ID: ${deletedUserDetails.id}).`,
    userId: req.user.id,
    ipAddress, userAgent,
    targetResource: 'User',
    targetResourceId: deletedUserDetails.id,
    details: { deletedUser: deletedUserDetails }
  });

  res.status(200).json({
    success: true,
    message: 'Utilisateur supprimé avec succès.',
    data: {},
  });
});