// gestion-commerciale-app/backend/controllers/chartOfAccounts.controller.js

const ChartOfAccounts = require('../models/ChartOfAccounts.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Récupérer tous les comptes du plan comptable
// @route   GET /api/accounting/chart-of-accounts
// @access  Private (Accountant, Admin, Manager for read-only)
exports.getAllAccounts = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(ChartOfAccounts.find(), req.query)
    .filter()
    .search(['accountNumber', 'accountName', 'description'])
    .sort() // Par défaut, tri par accountNumber ou comme spécifié
    .limitFields()
    .paginate();

  // S'assurer que le tri par défaut est pertinent, par exemple par accountNumber
  if (!req.query.sort) {
    features.mongooseQuery = features.mongooseQuery.sort('accountNumber');
  }

  const accounts = await features.mongooseQuery;

  const totalAccounts = await new APIFeatures(ChartOfAccounts.find(features.mongooseQuery.getFilter()), req.query)
    .filter()
    .search(['accountNumber', 'accountName', 'description'])
    .count();

  res.status(200).json({
    success: true,
    count: accounts.length,
    total: totalAccounts,
    pagination: {
      currentPage: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 100, // Une limite plus élevée peut être utile pour le PC
      totalPages: Math.ceil(totalAccounts / (parseInt(req.query.limit, 10) || 100)) || 1
    },
    data: accounts,
  });
});

// @desc    Récupérer un compte spécifique par son ID MongoDB
// @route   GET /api/accounting/chart-of-accounts/:id
// @access  Private (Accountant, Admin, Manager for read-only)
exports.getAccountById = asyncHandler(async (req, res, next) => {
  const account = await ChartOfAccounts.findById(req.params.id);

  if (!account) {
    return next(new AppError(`Compte non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: account,
  });
});

// @desc    Récupérer un compte par son numéro de compte (accountNumber)
// @route   GET /api/accounting/chart-of-accounts/number/:accountNumber
// @access  Private (Accountant, Admin, Manager for read-only)
exports.getAccountByNumber = asyncHandler(async (req, res, next) => {
    const accountNumber = req.params.accountNumber;
    const account = await ChartOfAccounts.findOne({ accountNumber });

    if (!account) {
      return next(new AppError(`Compte non trouvé avec le numéro ${accountNumber}`, 404));
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  });


// @desc    Créer un nouveau compte dans le plan comptable
// @route   POST /api/accounting/chart-of-accounts
// @access  Private (Admin, ou Accountant avec droits spécifiques)
exports.createAccount = asyncHandler(async (req, res, next) => {
  const { accountNumber, accountName, type, subType, description, isControlAccount, isTaxRelated, normalBalance, isActive } = req.body;

  // Vérifier l'unicité du numéro de compte (déjà gérée par l'index unique du modèle,
  // mais une vérification ici peut fournir un message d'erreur plus immédiat)
  const existingAccount = await ChartOfAccounts.findOne({ accountNumber });
  if (existingAccount) {
    return next(new AppError(`Un compte avec le numéro '${accountNumber}' existe déjà.`, 400));
  }

  const newAccount = await ChartOfAccounts.create({
    accountNumber,
    accountName,
    type,
    subType,
    description,
    isControlAccount,
    isTaxRelated,
    normalBalance,
    isActive,
  });

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès dans le plan comptable.',
    data: newAccount,
  });
});

// @desc    Mettre à jour un compte existant
// @route   PUT /api/accounting/chart-of-accounts/:id
// @access  Private (Admin, ou Accountant avec droits spécifiques)
exports.updateAccount = asyncHandler(async (req, res, next) => {
  const accountId = req.params.id;
  const { accountNumber, accountName, type, subType, description, isControlAccount, isTaxRelated, normalBalance, isActive } = req.body;

  let account = await ChartOfAccounts.findById(accountId);
  if (!account) {
    return next(new AppError(`Compte non trouvé avec l'ID ${accountId}`, 404));
  }

  // Si le numéro de compte est modifié, vérifier son unicité
  if (accountNumber && accountNumber !== account.accountNumber) {
    const existingAccountWithNewNumber = await ChartOfAccounts.findOne({ accountNumber: accountNumber, _id: { $ne: accountId } });
    if (existingAccountWithNewNumber) {
      return next(new AppError(`Un autre compte avec le numéro '${accountNumber}' existe déjà.`, 400));
    }
    account.accountNumber = accountNumber;
  }

  // Mettre à jour les autres champs
  if (accountName !== undefined) account.accountName = accountName;
  if (type) account.type = type; // Valider par l'enum du modèle
  if (subType !== undefined) account.subType = subType;
  if (description !== undefined) account.description = description;
  if (isControlAccount !== undefined) account.isControlAccount = isControlAccount;
  if (isTaxRelated !== undefined) account.isTaxRelated = isTaxRelated;
  if (normalBalance !== undefined) account.normalBalance = normalBalance; // Valider par l'enum
  if (isActive !== undefined) account.isActive = isActive;

  const updatedAccount = await account.save(); // Utiliser save() pour exécuter les validateurs Mongoose

  res.status(200).json({
    success: true,
    message: 'Compte mis à jour avec succès.',
    data: updatedAccount,
  });
});

// @desc    Supprimer un compte du plan comptable
// @route   DELETE /api/accounting/chart-of-accounts/:id
// @access  Private (Admin)
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const account = await ChartOfAccounts.findById(req.params.id);

  if (!account) {
    return next(new AppError(`Compte non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Avant de supprimer, il est CRUCIAL de vérifier si ce compte est utilisé
  // dans des écritures de journal (JournalEntry).
  // Si c'est le cas, la suppression ne devrait pas être autorisée ou devrait
  // être gérée avec une extrême prudence (ex: archiver le compte, le remplacer).
  // Cette vérification peut être complexe et coûteuse si vous avez beaucoup d'écritures.
  // Exemple de vérification (nécessite d'importer le modèle JournalEntry) :
  // const JournalEntry = require('../models/JournalEntry.model');
  // const usageCount = await JournalEntry.countDocuments({ 'lines.account': account._id });
  // if (usageCount > 0) {
  //   return next(
  //     new AppError(
  //       `Ce compte (N°${account.accountNumber}) est utilisé dans ${usageCount} écriture(s) de journal et ne peut pas être supprimé. Considérez de le désactiver.`,
  //       400
  //     )
  //   );
  // }

  await account.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Compte supprimé avec succès du plan comptable.',
    data: {},
  });
});