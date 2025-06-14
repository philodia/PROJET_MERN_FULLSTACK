// gestion-commerciale-app/backend/controllers/admin.controller.js
const User = require('../models/User.model');
const Invoice = require('../models/Invoice.model');
const Product = require('../models/Product.model');
const Quote = require('../models/Quote.model');
const SecurityLog = require('../models/SecurityLog.model');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
const { getMonthDateRange, getPastMonthsDateRanges } = require('../utils/date.utils'); // Supposant que vous créez ce fichier

// Constantes pour les statuts (exemple, à définir dans un fichier constants.js)
const INVOICE_STATUS = {
  PAID: 'PAID',
  UNPAID: 'UNPAID', // Remplacer par SENT si c'est plus approprié pour "en attente"
  OVERDUE: 'OVERDUE',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  SENT: 'SENT', // Ajouté pour plus de clarté
  // ... autres statuts
};

const PRODUCT_STOCK_STATUS = { // Pas directement utilisé ici mais pour la sémantique
    CRITICAL: 'CRITICAL',
};

// @desc    Récupérer les statistiques clés et données pour le tableau de bord administrateur
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getAdminDashboardStats = asyncHandler(async (req, res, next) => {
  console.log('Contrôleur getAdminDashboardStats atteint !');

  const now = new Date();
  const currentMonthDateRange = getMonthDateRange(now.getFullYear(), now.getMonth());

  // --- Statistiques pour les StatCards ---
  const totalUsersPromise = User.countDocuments();
  const pendingInvoicesCountPromise = Invoice.countDocuments({
    status: { $in: [INVOICE_STATUS.SENT, INVOICE_STATUS.OVERDUE, INVOICE_STATUS.PARTIALLY_PAID] }
  });

  const monthlyRevenuePromise = Invoice.aggregate([
    {
      $match: {
        status: INVOICE_STATUS.PAID,
        paidAt: { $gte: currentMonthDateRange.startDate, $lte: currentMonthDateRange.endDate }, // UTILISER paidAt
      },
    },
    { $group: { _id: null, totalAmount: { $sum: '$totalTTC' } } },
  ]);

  const criticalStockItemsCountPromise = Product.countDocuments({
    isService: { $ne: true }, // Pour exclure les services
    $expr: { $lte: ['$stockQuantity', '$criticalStockThreshold'] },
  });

  // --- Données pour le graphique des ventes (6 derniers mois) ---
  const past6MonthsRanges = getPastMonthsDateRanges(6);
  const salesChartLabels = past6MonthsRanges.map(r => r.label);
  const salesChartPromises = past6MonthsRanges.map(range =>
    Invoice.aggregate([
      { $match: { status: INVOICE_STATUS.PAID, paidAt: { $gte: range.start, $lte: range.end } } }, // UTILISER paidAt
      { $group: { _id: null, total: { $sum: '$totalTTC' } } },
    ]).then(result => (result.length > 0 ? result[0].total : 0))
  );

  // --- Données pour le graphique des rôles utilisateurs ---
  const userRolesAggregationPromise = User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $project: { roleName: '$_id', count: 1, _id: 0 } }, // Renommer _id pour plus de clarté
    { $sort: { count: -1 } }, // Trier par nombre décroissant
  ]);

  // --- Flux d'activité récente ---
  const recentActivitiesPromise = SecurityLog.find()
    .sort({ timestamp: -1 })
    .limit(7) // Un peu plus pour une liste
    .populate('user', 'username email avatarUrl'); // Populer avec plus d'infos si utile

  // Exécuter toutes les promesses
  // Utiliser Promise.allSettled pour obtenir des résultats même si certaines promesses échouent (plus robuste pour un dashboard)
  const results = await Promise.allSettled([
    totalUsersPromise,
    pendingInvoicesCountPromise,
    monthlyRevenuePromise,
    criticalStockItemsCountPromise,
    Promise.all(salesChartPromises), // Ceci est déjà un Promise.all, donc il échouera si une des requêtes de vente échoue
    userRolesAggregationPromise,
    recentActivitiesPromise,
  ]);

  // Fonction helper pour extraire la valeur de Promise.allSettled
  const getValue = (result, defaultValue = 0) => result.status === 'fulfilled' ? result.value : defaultValue;

  const totalUsers = getValue(results[0], 0);
  const pendingInvoicesCount = getValue(results[1], 0);
  const monthlyRevenueResult = getValue(results[2], [{ totalAmount: 0 }]); // Agrégation retourne un tableau
  const criticalStockItemsCount = getValue(results[3], 0);
  const salesDataForChart = getValue(results[4], salesChartLabels.map(() => 0)); // Tableau de 0 si échec
  const userRolesAggregation = getValue(results[5], []);
  const recentActivities = getValue(results[6], []);


  const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].totalAmount : 0;

  // Préparer la réponse
  const summaryCards = {
    totalUsers: { value: totalUsers },
    pendingInvoices: { value: pendingInvoicesCount },
    monthlyRevenue: { value: parseFloat(monthlyRevenue.toFixed(2)), unit: '€' }, // Assumer EUR
    criticalStockItems: { value: criticalStockItemsCount },
  };

  const salesChartData = {
    labels: salesChartLabels,
    datasets: [{
      label: 'Revenu Mensuel (€)',
      data: salesDataForChart,
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.3)',
      fill: true,
      tension: 0.4,
    }],
  };

  const roleColors = { ADMIN: '#FF6384', MANAGER: '#36A2EB', ACCOUNTANT: '#FFCE56', USER: '#4BC0C0', default: '#9966FF' };
  const userRolesChartData = {
    labels: userRolesAggregation.map(roleGroup => (roleGroup.roleName ? (roleGroup.roleName.charAt(0).toUpperCase() + roleGroup.roleName.slice(1).toLowerCase()) : 'Non Défini')),
    datasets: [{
      label: 'Répartition des Rôles',
      data: userRolesAggregation.map(roleGroup => roleGroup.count),
      backgroundColor: userRolesAggregation.map(roleGroup => roleColors[roleGroup.roleName] || roleColors.default),
      hoverOffset: 4,
    }],
  };

  res.status(200).json({
    success: true,
    data: {
      summaryCards,
      salesChartData,
      userRolesChartData,
      recentActivities,
    }
  });
});


// @desc    Récupérer les journaux de sécurité (avec filtres, tri, pagination)
// @route   GET /api/admin/security-logs
// @access  Private/Admin
exports.getSecurityLogs = asyncHandler(async (req, res, next) => {
  const defaultSort = '-timestamp'; // Tri par défaut
  const query = SecurityLog.find().populate('user', 'username email avatarUrl');

  const features = new APIFeatures(query, req.query)
    .filter()
    .search(['action', 'ipAddress', 'details', 'user.username', 'user.email']) // Champs de recherche étendus
    .sort(defaultSort) // Laisser APIFeatures gérer le tri par défaut
    .limitFields()
    .paginate();

  const logs = await features.mongooseQuery;

  // Pour le comptage total, appliquer les mêmes filtres et recherches
  const countQuery = SecurityLog.find();
  const countFeatures = new APIFeatures(countQuery, req.query)
    .filter()
    .search(['action', 'ipAddress', 'details', 'user.username', 'user.email']);

  const totalLogs = await countFeatures.count();

  res.status(200).json({
    success: true,
    countOnPage: logs.length,
    totalLogs: totalLogs,
    pagination: features.paginationDetails, // APIFeatures devrait fournir cela
    data: logs,
  });
});


// @desc    (Optionnel) Récupérer des données spécifiques pour des graphiques si nécessaire
// @route   GET /api/admin/charts-data
// @access  Private/Admin
exports.getAdminChartsData = asyncHandler(async (req, res, next) => {
  // Si cette route est maintenue, elle devrait avoir une logique distincte
  // Par exemple, des agrégations plus complexes ou des données non incluses dans le dashboard principal.

  // Exemple: Répartition des statuts des devis
  const quoteStatusColors = { DRAFT: '#6c757d', SENT: '#0dcaf0', ACCEPTED: '#198754', REJECTED: '#dc3545', EXPIRED: '#ffc107' };
  const quoteStatusDistributionResult = await Quote.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } }
  ]);

  const quoteStatusDistribution = {
    labels: quoteStatusDistributionResult.map(item => item.status),
    datasets: [{
      label: 'Statuts des Devis',
      data: quoteStatusDistributionResult.map(item => item.count),
      backgroundColor: quoteStatusDistributionResult.map(item => quoteStatusColors[item.status] || '#adb5bd'),
    }]
  };

  res.status(200).json({
    success: true,
    data: {
      quoteStatusDistribution,
      // ... autres données de graphiques spécifiques ...
    }
  });
});