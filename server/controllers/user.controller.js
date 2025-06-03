// gestion-commerciale-app/backend/controllers/user.controller.js

const User = require('../models/User.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures'); // Pour la pagination, le filtrage, etc.

// @desc    Récupérer tous les utilisateurs (avec filtres, tri, pagination)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .search(['username', 'email', 'firstName', 'lastName']) // Champs pour la recherche regex
    .sort()
    .limitFields()
    .paginate();

  const users = await features.mongooseQuery;

  const totalUsers = await new APIFeatures(User.find(features.mongooseQuery.getFilter()), req.query) // Utiliser le même filtre pour le comptage
                                .filter() // Ré-appliquer le filtre de base, pas les autres comme sort/paginate
                                .search(['username', 'email', 'firstName', 'lastName'])
                                .count();

  res.status(200).json({
    success: true,
    count: users.length,
    total: totalUsers,
    pagination: { // Informations de pagination optionnelles
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

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Créer un nouvel utilisateur (par un Admin)
// @route   POST /api/users
// @access  Private/Admin
// Note: La création d'utilisateur "publique" (register) est dans auth.controller.js
exports.createUser = asyncHandler(async (req, res, next) => {
  const { username, email, password, firstName, lastName, role, isActive } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const userExistsByEmail = await User.findOne({ email });
  if (userExistsByEmail) {
    return next(new AppError('Un utilisateur avec cet email existe déjà.', 400));
  }
  const userExistsByUsername = await User.findOne({ username });
  if (userExistsByUsername) {
    return next(new AppError('Un utilisateur avec ce nom d\'utilisateur existe déjà.', 400));
  }

  const user = await User.create({
    username,
    email,
    password, // Le hachage est géré par le hook pre('save') du modèle
    firstName,
    lastName,
    role,
    isActive,
  });

  // Ne pas renvoyer le token ici, c'est une création par admin, pas un self-register/login
  res.status(201).json({
    success: true,
    message: 'Utilisateur créé avec succès.',
    data: user, // Le mot de passe n'est pas renvoyé grâce à select: false
  });
});

// @desc    Mettre à jour un utilisateur (par un Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const { username, email, firstName, lastName, role, isActive } = req.body;

  // Récupérer l'utilisateur à mettre à jour
  let user = await User.findById(userId);
  if (!user) {
    return next(new AppError(`Utilisateur non trouvé avec l'ID ${userId}`, 404));
  }

  // Préparer les champs à mettre à jour
  if (username && username !== user.username) {
    const usernameExists = await User.findOne({ username: username, _id: { $ne: userId } });
    if (usernameExists) {
        return next(new AppError('Ce nom d\'utilisateur est déjà pris.', 400));
    }
    user.username = username;
  }
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email: email, _id: { $ne: userId } });
    if (emailExists) {
        return next(new AppError('Cet email est déjà utilisé par un autre compte.', 400));
    }
    user.email = email;
  }
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (role) user.role = role; // S'assurer que le rôle est valide (géré par l'enum)
  if (isActive !== undefined) user.isActive = isActive;

  // Si le mot de passe est fourni dans la requête, le mettre à jour
  // Le hook pre('save') s'occupera du hachage et de passwordChangedAt
  if (req.body.password) {
    if (req.body.password.length < 8) { // ou la minlength de votre schéma
        return next(new AppError('Le mot de passe doit contenir au moins 8 caractères.', 400));
    }
    user.password = req.body.password;
  }

  const updatedUser = await user.save(); // Déclenche les hooks (hachage mdp si changé) et les validateurs

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
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError(`Utilisateur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Empêcher un admin de se supprimer lui-même par cette route (ou ajouter une logique spécifique)
  if (req.user && req.user.id === user.id.toString()) {
      return next(new AppError('Vous ne pouvez pas supprimer votre propre compte administrateur via cette route.', 400));
  }

  // Vous pourriez implémenter une suppression logique (soft delete) en mettant isActive à false,
  // ou une suppression réelle.
  // Pour une suppression réelle :
  await user.deleteOne(); // Ou User.findByIdAndDelete(req.params.id)

  // Pour une suppression logique (soft delete) :
  // user.isActive = false;
  // await user.save();

  res.status(200).json({ // Ou 204 No Content si vous ne renvoyez rien
    success: true,
    message: 'Utilisateur supprimé avec succès.',
    data: {}, // Ou null
  });
});