// gestion-commerciale-app/backend/controllers/report.controller.js

const JournalEntry = require('../models/JournalEntry.model');
const ChartOfAccounts = require('../models/ChartOfAccounts.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const mongoose = require('mongoose'); // Pour ObjectId si besoin de caster

// @desc    Générer le Grand Livre pour un compte ou tous les comptes sur une période
// @route   GET /api/reports/general-ledger
// @access  Private (Accountant, Admin, Manager for read-only)
// @query   startDate, endDate, accountId (ObjectId du compte), accountNumber
exports.getGeneralLedger = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, accountId, accountNumber } = req.query;

  const matchConditions = {};
  if (startDate) {
    matchConditions.date = { ...matchConditions.date, $gte: new Date(startDate) };
  }
  if (endDate) {
    // Pour inclure toute la journée de endDate, on va jusqu'au début du jour suivant
    const endOfDay = new Date(endDate);
    endOfDay.setDate(endOfDay.getDate() + 1);
    matchConditions.date = { ...matchConditions.date, $lt: endOfDay };
  }

  let targetAccountId = accountId;
  if (!targetAccountId && accountNumber) {
    const accountDoc = await ChartOfAccounts.findOne({ accountNumber }).select('_id');
    if (!accountDoc) {
      return next(new AppError(`Compte avec le numéro ${accountNumber} non trouvé.`, 404));
    }
    targetAccountId = accountDoc._id;
  }

  if (targetAccountId) {
    // Valider que targetAccountId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(targetAccountId)) {
        return next(new AppError('L\'ID du compte fourni est invalide.', 400));
    }
    matchConditions['lines.account'] = new mongoose.Types.ObjectId(targetAccountId);
  }


  // Agrégation pour extraire les lignes de journal pertinentes et les formater pour le grand livre
  const aggregationPipeline = [
    { $match: matchConditions }, // Filtre sur la date de l'écriture
    { $unwind: '$lines' },       // Décomposer le tableau 'lines' en documents séparés
    // Si un targetAccountId est spécifié, re-filtrer sur les lignes après unwind
    ...(targetAccountId ? [{ $match: { 'lines.account': new mongoose.Types.ObjectId(targetAccountId) } }] : []),
    {
      $lookup: { // Joindre les informations du compte depuis ChartOfAccounts
        from: 'chartofaccounts', // Nom de la collection (Mongoose le met au pluriel et en minuscules)
        localField: 'lines.account',
        foreignField: '_id',
        as: 'lines.accountDetails'
      }
    },
    { $unwind: { path: '$lines.accountDetails', preserveNullAndEmptyArrays: true } }, // Décomposer le résultat de lookup
    {
      $project: { // Sélectionner et formater les champs pour la sortie
        _id: 0, // Exclure l'ID de l'écriture de journal principale pour chaque ligne (ou le garder si utile)
        entryId: '$_id', // ID de l'écriture originale
        entryNumber: '$entryNumber',
        date: '$date',
        transactionType: '$transactionType',
        entryDescription: '$description', // Description de l'écriture globale
        lineDescription: '$lines.description',
        accountNumber: '$lines.accountDetails.accountNumber',
        accountName: '$lines.accountDetails.accountName',
        debit: '$lines.debit',
        credit: '$lines.credit',
        relatedDocumentType: '$relatedDocumentType',
        relatedDocumentId: '$relatedDocumentId'
      }
    },
    { $sort: { date: 1, entryNumber: 1 } } // Trier par date puis par numéro d'écriture
  ];

  const ledgerEntries = await JournalEntry.aggregate(aggregationPipeline);

  // Optionnel: Calculer le solde courant pour chaque ligne (plus complexe avec agrégation ou post-traitement)
  // Et le solde initial si une période est spécifiée pour un seul compte.

  res.status(200).json({
    success: true,
    count: ledgerEntries.length,
    data: ledgerEntries,
    filters: { startDate, endDate, accountId, accountNumber }
  });
});


// @desc    Générer un Bilan simplifié (Actif = Passif + Capitaux Propres) à une date donnée
// @route   GET /api/reports/balance-sheet
// @access  Private (Accountant, Admin, Manager for read-only)
// @query   asOfDate (date à laquelle calculer le bilan, par défaut aujourd'hui)
exports.getBalanceSheet = asyncHandler(async (req, res, next) => {
  const asOfDateQuery = req.query.asOfDate;
  let asOfDate;

  if (asOfDateQuery) {
    asOfDate = new Date(asOfDateQuery);
    // Pour inclure toutes les transactions jusqu'à la fin de ce jour
    asOfDate.setHours(23, 59, 59, 999);
  } else {
    asOfDate = new Date(); // Par défaut, aujourd'hui à l'heure actuelle
    asOfDate.setHours(23, 59, 59, 999); // Fin de la journée actuelle
  }

  // 1. Obtenir tous les comptes du plan comptable
  const allAccounts = await ChartOfAccounts.find({ isActive: true });
  if (!allAccounts || allAccounts.length === 0) {
    return next(new AppError('Plan comptable non trouvé ou vide. Impossible de générer le bilan.', 500));
  }

  // 2. Calculer le solde de chaque compte à la date 'asOfDate'
  const accountBalances = {}; // { accountId: { name, number, type, balance }, ... }

  const journalLinesUpToDate = await JournalEntry.aggregate([
    { $match: { date: { $lte: asOfDate } } }, // Toutes les écritures jusqu'à la date spécifiée
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.account', // Grouper par ID de compte
        totalDebit: { $sum: '$lines.debit' },
        totalCredit: { $sum: '$lines.credit' }
      }
    }
  ]);

  // Initialiser les soldes
  allAccounts.forEach(acc => {
    accountBalances[acc._id.toString()] = {
      _id: acc._id.toString(),
      name: acc.accountName,
      number: acc.accountNumber,
      type: acc.type, // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
      normalBalance: acc.normalBalance, // DEBIT ou CREDIT
      balance: 0
    };
  });

  // Appliquer les mouvements
  journalLinesUpToDate.forEach(entry => {
    const accountIdStr = entry._id.toString();
    if (accountBalances[accountIdStr]) {
      let balance = (entry.totalDebit || 0) - (entry.totalCredit || 0);
      // Inverser le signe si le solde normal est Crédit pour que les passifs/produits apparaissent positifs
      if (accountBalances[accountIdStr].normalBalance === 'CREDIT') {
        balance = -balance;
      }
      accountBalances[accountIdStr].balance = parseFloat(balance.toFixed(2));
    }
  });


  // 3. Structurer le Bilan
  const balanceSheet = {
    assets: { total: 0, accounts: [] },
    liabilities: { total: 0, accounts: [] },
    equity: { total: 0, accounts: [] },
    // Les revenus et dépenses ne sont pas directement dans le bilan, mais leur solde (résultat) l'est.
    // Pour un bilan simplifié, on peut calculer le résultat net et l'ajouter aux capitaux propres.
    netIncomeForPeriod: 0, // Bénéfice ou perte de l'exercice (ou depuis le début jusqu'à asOfDate)
  };

  let totalRevenue = 0;
  let totalExpense = 0;

  for (const accId in accountBalances) {
    const acc = accountBalances[accId];
    if (acc.type === 'ASSET') {
      balanceSheet.assets.accounts.push(acc);
      balanceSheet.assets.total += acc.balance;
    } else if (acc.type === 'LIABILITY') {
      balanceSheet.liabilities.accounts.push(acc);
      balanceSheet.liabilities.total += acc.balance;
    } else if (acc.type === 'EQUITY') {
      balanceSheet.equity.accounts.push(acc);
      balanceSheet.equity.total += acc.balance;
    } else if (acc.type === 'REVENUE') {
      totalRevenue += acc.balance; // Les revenus augmentent les capitaux propres (solde créditeur -> positif ici)
    } else if (acc.type === 'EXPENSE') {
      totalExpense += acc.balance; // Les dépenses diminuent les capitaux propres (solde débiteur -> positif ici)
    }
  }

  // Le résultat net est Produits - Charges.
  // Si normalBalance est 'CREDIT' pour REVENUE, acc.balance est déjà positif.
  // Si normalBalance est 'DEBIT' pour EXPENSE, acc.balance est déjà positif.
  // Donc, Résultat Net = Total Produits (positif) - Total Charges (positif)
  balanceSheet.netIncomeForPeriod = parseFloat((totalRevenue - totalExpense).toFixed(2));

  // Ajouter le résultat net aux capitaux propres pour l'équation du bilan
  balanceSheet.equity.total = parseFloat((balanceSheet.equity.total + balanceSheet.netIncomeForPeriod).toFixed(2));


  // Vérification de l'équation comptable (Actif = Passif + Capitaux Propres)
  const totalAssets = parseFloat(balanceSheet.assets.total.toFixed(2));
  const totalLiabilitiesAndEquity = parseFloat((balanceSheet.liabilities.total + balanceSheet.equity.total).toFixed(2));
  const balanceCheck = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01; // Tolérance pour arrondis

  res.status(200).json({
    success: true,
    asOfDate: asOfDate.toISOString().split('T')[0],
    data: balanceSheet,
    equation: {
        assets: totalAssets,
        liabilitiesAndEquity: totalLiabilitiesAndEquity,
        difference: parseFloat((totalAssets - totalLiabilitiesAndEquity).toFixed(2)),
        balanced: balanceCheck
    }
  });
});


// D'autres rapports pourraient inclure :
// - Compte de Résultat (Profit & Loss Statement)
// - Balance Agée Clients / Fournisseurs
// - Tableau des flux de trésorerie (plus complexe)
// - Déclarations de TVA