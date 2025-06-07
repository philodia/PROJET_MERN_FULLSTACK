// gestion-commerciale-app/backend/controllers/admin.controller.js

const User = require('../models/User.model');
const Invoice = require('../models/Invoice.model');
const Product = require('../models/Product.model');
const Quote = require('../models/Quote.model');
// const DeliveryNote = require('../models/DeliveryNote.model'); // Décommentez si utilisé
const SecurityLog = require('../models/SecurityLog.model');
// const { AppError } = require('../middleware/error.middleware'); // Non utilisé directement ici
const asyncHandler = require('../middleware/asyncHandler.middleware'); // Assurez-vous que c'est bien un middleware et pas juste une fonction
const APIFeatures = require('../utils/apiFeatures');

// @desc    Récupérer les statistiques clés et données pour le tableau de bord administrateur
// @route   GET /api/admin/dashboard/stats  (Note: la route dans admin.routes.js est /dashboard/stats)
// @access  Private/Admin
exports.getAdminDashboardStats = asyncHandler(async (req, res, next) => {
  console.log('Contrôleur getAdminDashboardStats atteint !'); // Pour le debug

  const now = new Date();
  const startOfMonthCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonthCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // --- Statistiques pour les StatCards ---
  const totalUsersPromise = User.countDocuments();
  const pendingInvoicesCountPromise = Invoice.countDocuments({ status: { $in: ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'] } });

  const monthlyRevenuePromise = Invoice.aggregate([
    {
      $match: {
        status: 'PAID',
        // Idéalement, filtrer sur une `paymentDate` si elle existe.
        // Sinon, updatedAt peut être utilisé si la facture passe à PAID à ce moment-là.
        updatedAt: { $gte: startOfMonthCurrent, $lte: endOfMonthCurrent },
      },
    },
    { $group: { _id: null, totalAmount: { $sum: '$totalTTC' } } },
  ]);

  const criticalStockItemsCountPromise = Product.countDocuments({
    isService: false,
    $expr: { $lte: ['$stockQuantity', '$criticalStockThreshold'] },
  });

  // --- Données pour le graphique des ventes (Ex: 6 derniers mois) ---
  const salesChartPromises = [];
  const salesChartLabels = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i); // Utiliser now.getMonth() pour la cohérence
    const monthName = date.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
    salesChartLabels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));

    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    salesChartPromises.push(
      Invoice.aggregate([
        { $match: { status: 'PAID', updatedAt: { $gte: start, $lte: end } } }, // ou issueDate/paymentDate
        { $group: { _id: null, total: { $sum: '$totalTTC' } } },
      ]).then(result => (result.length > 0 ? result[0].total : 0)) // Retourner seulement le total ou 0
    );
  }

  // --- Données pour le graphique des rôles utilisateurs ---
  const userRolesAggregationPromise = User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // --- Flux d'activité récente ---
  const recentActivitiesPromise = SecurityLog.find()
    .sort({ timestamp: -1 })
    .limit(5) // Limiter à 5 pour le dashboard
    .populate('user', 'username'); // Populer 'user' au lieu de 'userId' si votre modèle SecurityLog a une ref 'user'

  // Exécuter toutes les promesses en parallèle
  const [
    totalUsers,
    pendingInvoicesCount,
    monthlyRevenueResult,
    criticalStockItemsCount,
    salesDataForChart, // Sera un tableau de totaux mensuels
    userRolesAggregation,
    recentActivities,
  ] = await Promise.all([
    totalUsersPromise,
    pendingInvoicesCountPromise,
    monthlyRevenuePromise,
    criticalStockItemsCountPromise,
    Promise.all(salesChartPromises), // Exécuter toutes les promesses de ventes
    userRolesAggregationPromise,
    recentActivitiesPromise,
  ]);

  const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].totalAmount : 0;

  const summaryCards = {
    totalUsers: { value: totalUsers, isLoading: false, /* trend et trendDirection à calculer si besoin */ },
    pendingInvoices: { value: pendingInvoicesCount, isLoading: false },
    monthlyRevenue: { value: parseFloat(monthlyRevenue.toFixed(2)), unit: '€', isLoading: false },
    criticalStockItems: { value: criticalStockItemsCount, isLoading: false },
  };

  const salesChartData = {
    labels: salesChartLabels,
    datasets: [{
      label: 'Revenu (€)',
      data: salesDataForChart,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
      tension: 0.3,
    }],
  };

  const userRolesChartData = {
    labels: userRolesAggregation.map(roleGroup => (roleGroup._id ? (roleGroup._id.charAt(0).toUpperCase() + roleGroup._id.slice(1).toLowerCase()) : 'Non Défini')),
    datasets: [{
      label: 'Répartition des Rôles',
      data: userRolesAggregation.map(roleGroup => roleGroup.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',  // ADMIN
        'rgba(54, 162, 235, 0.7)',  // MANAGER
        'rgba(255, 206, 86, 0.7)',  // ACCOUNTANT
        'rgba(75, 192, 192, 0.7)',  // USER (si vous l'ajoutez)
        'rgba(153, 102, 255, 0.7)', // Autre couleur
      ],
    }],
  };

  res.status(200).json({
    success: true,
    data: { // Le frontend s'attend à cette structure si on se base sur l'exemple précédent
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
  // La requête de base pour le comptage total
  const baseQueryForCount = SecurityLog.find();
  const countFeatures = new APIFeatures(baseQueryForCount, req.query)
    .filter()
    .search(['details', 'action', 'usernameAttempt', 'ipAddress']); // 'message' et 'targetResource' étaient des exemples
  const totalLogs = await countFeatures.count();


  // La requête pour récupérer les données paginées et triées
  const mainQuery = SecurityLog.find().populate('user', 'username email'); // 'userId' devient 'user' après populate
  const features = new APIFeatures(mainQuery, req.query)
    .filter()
    .search(['details', 'action', 'usernameAttempt', 'ipAddress'])
    .sort()
    .limitFields()
    .paginate();

  // Tri par défaut si non spécifié
  if (!req.query.sort) {
    features.mongooseQuery = features.mongooseQuery.sort('-timestamp');
  }

  const logs = await features.mongooseQuery;
  const limit = parseInt(req.query.limit, 10) || 25; // Default limit
  const page = parseInt(req.query.page, 10) || 1; // Default page

  res.status(200).json({
    success: true,
    countOnPage: logs.length, // Nombre de logs sur la page actuelle
    totalLogs: totalLogs,   // Nombre total de logs correspondant aux filtres
    pagination: {
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(totalLogs / limit) || 1,
    },
    data: logs,
  });
});


// @desc    Récupérer des données pour les graphiques du tableau de bord admin
// @route   GET /api/admin/charts-data
// @access  Private/Admin
// NOTE: Cette route est redondante si getAdminDashboardStats retourne déjà toutes les données.
// Si vous la gardez, assurez-vous que sa logique est distincte et nécessaire.
exports.getAdminChartsData = asyncHandler(async (req, res, next) => {
    console.log('Contrôleur getAdminChartsData atteint !');
    // --- Exemple 1: Ventes par mois sur les 12 derniers mois ---
    // (La logique est déjà dans getAdminDashboardStats, à factoriser si besoin)
    // Pour l'instant, on renvoie des données vides pour éviter la duplication ou une erreur
    const salesByMonth = { labels: [], datasets: [{ data: [] }] };

    // --- Exemple 2: Répartition des statuts des devis ---
    const quoteStatusDistribution = await Quote.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: '$count' } }
    ]);

    // --- Exemple 3: Top 5 des produits les plus vendus ---
    // (Logique déjà dans getAdminDashboardStats, à factoriser)
    const topSellingProducts = [];


    res.status(200).json({
        success: true,
        data: {
            salesByMonth,
            quoteStatusDistribution,
            topSellingProducts,
        }
    });
});

// Il est important que le nom des fonctions exportées ici corresponde
// à ce qui est importé dans admin.routes.js