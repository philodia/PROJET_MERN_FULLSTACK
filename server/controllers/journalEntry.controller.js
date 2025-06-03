// gestion-commerciale-app/backend/controllers/journalEntry.controller.js

const JournalEntry = require('../models/JournalEntry.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
// const { generateDocumentNumber } = require('../utils/generateNumber'); // Si la numérotation n'est pas dans le hook du modèle

// @desc    Récupérer toutes les écritures du journal (avec filtres, tri, pagination)
// @route   GET /api/accounting/journal-entries
// @access  Private (Accountant, Admin, Manager for read-only)
exports.getAllJournalEntries = asyncHandler(async (req, res, next) => {
  // Pré-population des comptes dans les lignes pour un affichage plus riche
  const baseQuery = JournalEntry.find()
    .populate('createdBy', 'username email')
    .populate('lines.account', 'accountNumber accountName type'); // Populer les infos de compte dans chaque ligne

  const features = new APIFeatures(baseQuery, req.query)
    .filter() // Filtres sur date (ex: date[gte], date[lte]), transactionType, etc.
    .search(['entryNumber', 'description', 'lines.description', 'lines.accountNumber', 'lines.accountName']) // Champs pour la recherche regex
    .sort() // Par défaut, tri par date d'écriture ou comme spécifié
    .limitFields()
    .paginate();

  // S'assurer que le tri par défaut est pertinent, par exemple par date puis numéro d'écriture
  if (!req.query.sort) {
    features.mongooseQuery = features.mongooseQuery.sort('-date -entryNumber');
  }

  const journalEntries = await features.mongooseQuery;

  const totalEntries = await new APIFeatures(JournalEntry.find(features.mongooseQuery.getFilter()), req.query)
    .filter()
    .search(['entryNumber', 'description', 'lines.description', 'lines.accountNumber', 'lines.accountName'])
    .count();

  res.status(200).json({
    success: true,
    count: journalEntries.length,
    total: totalEntries,
    pagination: {
      currentPage: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50, // Limite par défaut
      totalPages: Math.ceil(totalEntries / (parseInt(req.query.limit, 10) || 50)) || 1
    },
    data: journalEntries,
  });
});

// @desc    Récupérer une écriture de journal spécifique par son ID MongoDB
// @route   GET /api/accounting/journal-entries/:id
// @access  Private (Accountant, Admin, Manager for read-only)
exports.getJournalEntryById = asyncHandler(async (req, res, next) => {
  const journalEntry = await JournalEntry.findById(req.params.id)
    .populate('createdBy', 'username email')
    .populate('lines.account', 'accountNumber accountName type'); // Populer les infos de compte

  if (!journalEntry) {
    return next(new AppError(`Écriture de journal non trouvée avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: journalEntry,
  });
});

// @desc    Créer une nouvelle écriture de journal manuelle
// @route   POST /api/accounting/journal-entries
// @access  Private (Accountant, Admin)
// Note: Les écritures automatiques (ventes, achats) sont créées par AccountingService.
//       Ce endpoint est pour les écritures manuelles (OD, salaires, etc.).
exports.createManualJournalEntry = asyncHandler(async (req, res, next) => {
  const { date, description, lines, transactionType, currency } = req.body;

  if (!date || !description || !lines || lines.length < 2 || !transactionType) {
    return next(new AppError('Date, description, type de transaction et au moins deux lignes d\'écriture sont requis.', 400));
  }

  // Valider que chaque ligne a un compte, et soit un débit soit un crédit (pas les deux)
  // et que l'écriture est équilibrée. Cette validation est aussi dans le modèle,
  // mais une vérification ici peut donner un retour plus rapide.
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (!line.account || (line.debit === undefined && line.credit === undefined)) {
      return next(new AppError('Chaque ligne d\'écriture doit avoir un compte et un montant (débit ou crédit).', 400));
    }
    if (typeof line.debit === 'number' && line.debit < 0) return next(new AppError('Le montant au débit ne peut pas être négatif.', 400));
    if (typeof line.credit === 'number' && line.credit < 0) return next(new AppError('Le montant au crédit ne peut pas être négatif.', 400));
    if (line.debit > 0 && line.credit > 0) return next(new AppError('Une ligne ne peut pas avoir à la fois un débit et un crédit positifs.', 400));

    totalDebit += line.debit || 0;
    totalCredit += line.credit || 0;
  }

  if (Math.abs(totalDebit - totalCredit) >= 0.001) { // Utiliser une tolérance
    return next(new AppError(`L'écriture de journal n'est pas équilibrée. Débits: ${totalDebit}, Crédits: ${totalCredit}`, 400));
  }


  const entryData = {
    date,
    description,
    lines,
    transactionType: transactionType || 'MANUAL_JOURNAL', // Forcer ou par défaut si manuel
    currency: currency || 'EUR',
    createdBy: req.user.id, // Utilisateur connecté
    // entryNumber sera généré par le hook pre('validate') du modèle
    // relatedDocumentType et relatedDocumentId peuvent être omis ou null pour les écritures manuelles,
    // sauf si elles se rapportent à un document spécifique non standard.
  };

  const newEntry = await JournalEntry.create(entryData);

  res.status(201).json({
    success: true,
    message: 'Écriture de journal manuelle créée avec succès.',
    data: newEntry,
  });
});


// @desc    Mettre à jour une écriture de journal manuelle (ATTENTION: NON RECOMMANDÉ en compta)
// @route   PUT /api/accounting/journal-entries/:id
// @access  Private (Admin - avec de fortes restrictions)
// NOTE: La modification d'écritures comptables validées est généralement interdite.
//       Les erreurs sont corrigées par des écritures de contre-passation ou d'extourne.
//       Cette fonction est fournie à titre d'exemple et devrait être utilisée avec une extrême prudence,
//       ou limitée aux écritures en statut "DRAFT" si vous implémentez un tel statut.
exports.updateManualJournalEntry = asyncHandler(async (req, res, next) => {
  const entryId = req.params.id;
  const { date, description, lines, transactionType, currency } = req.body;

  let journalEntry = await JournalEntry.findById(entryId);
  if (!journalEntry) {
    return next(new AppError(`Écriture de journal non trouvée avec l'ID ${entryId}`, 404));
  }

  // Vérifier si l'écriture peut être modifiée (ex: seulement si 'MANUAL_JOURNAL' et par un Admin)
  // if (journalEntry.transactionType !== 'MANUAL_JOURNAL' || req.user.role !== 'ADMIN') {
  //   return next(new AppError('Seules les écritures manuelles peuvent être modifiées par un administrateur.', 403));
  // }
  // Ou si vous avez un statut 'DRAFT':
  // if (journalEntry.status !== 'DRAFT') {
  //    return next(new AppError('Seules les écritures en brouillon peuvent être modifiées.', 403));
  // }
  console.warn(`AVERTISSEMENT: Modification d'une écriture de journal existante (ID: ${entryId}) par l'utilisateur ${req.user.id}. Ceci n'est généralement pas une pratique comptable standard.`);


  // Valider les lignes et l'équilibre si elles sont modifiées
  if (lines) {
    if (lines.length < 2) return next(new AppError('Une écriture doit contenir au moins deux lignes.', 400));
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
        if (!line.account || (line.debit === undefined && line.credit === undefined)) return next(new AppError('Ligne invalide.', 400));
        if (line.debit > 0 && line.credit > 0) return next(new AppError('Débit et crédit positifs sur la même ligne.', 400));
        totalDebit += line.debit || 0;
        totalCredit += line.credit || 0;
    }
    if (Math.abs(totalDebit - totalCredit) >= 0.001) {
        return next(new AppError(`L'écriture n'est pas équilibrée. Débits: ${totalDebit}, Crédits: ${totalCredit}`, 400));
    }
    journalEntry.lines = lines;
  }

  if (date) journalEntry.date = date;
  if (description !== undefined) journalEntry.description = description;
  if (transactionType) journalEntry.transactionType = transactionType; // Soyez prudent en changeant le type
  if (currency) journalEntry.currency = currency;
  // Ne pas mettre à jour createdBy. updatedBy n'est pas dans le modèle par principe.

  const updatedEntry = await journalEntry.save(); // Déclenche les validateurs du modèle

  res.status(200).json({
    success: true,
    message: 'Écriture de journal (manuelle) mise à jour avec prudence.',
    data: updatedEntry,
  });
});

// @desc    Supprimer/Annuler une écriture de journal (ATTENTION: NON RECOMMANDÉ en compta)
// @route   DELETE /api/accounting/journal-entries/:id
// @access  Private (Admin - avec de fortes restrictions)
// NOTE: La suppression d'écritures comptables est interdite. Préférer une écriture d'extourne (annulation).
//       Ce endpoint est fourni à des fins d'administration exceptionnelle (ex: correction d'une erreur de saisie en DEV).
//       En production, il devrait être désactivé ou très fortement contrôlé.
exports.deleteJournalEntry = asyncHandler(async (req, res, next) => {
  const journalEntry = await JournalEntry.findById(req.params.id);

  if (!journalEntry) {
    return next(new AppError(`Écriture de journal non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Vérifications avant suppression (ex: seulement si 'MANUAL_JOURNAL' et aucune période clôturée)
  // if (journalEntry.transactionType !== 'MANUAL_JOURNAL' /* && !isPeriodClosed(journalEntry.date) */ ) {
  //   return next(new AppError('Cette écriture ne peut pas être supprimée directement. Veuillez créer une écriture d'extourne.', 403));
  // }
  console.warn(`AVERTISSEMENT: Suppression d'une écriture de journal (ID: ${req.params.id}, Num: ${journalEntry.entryNumber}) par l'utilisateur ${req.user.id}. Ceci est une opération non standard en comptabilité.`);

  await journalEntry.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Écriture de journal supprimée (opération exceptionnelle).',
    data: {},
  });
});