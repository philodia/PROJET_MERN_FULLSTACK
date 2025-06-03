// gestion-commerciale-app/backend/controllers/admin.controller.js

const User = require('../models/User.model');
const Invoice = require('../models/Invoice.model');
const Product = require('../models/Product.model');
const Quote = require('../models/Quote.model');
const DeliveryNote = require('../models/DeliveryNote.model');
const SecurityLog = require('../models/SecurityLog.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Récupérer les statistiques clés pour le tableau de bord administrateur
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  // Date de début du mois actuel
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Fin du dernier jour du mois

  const totalUsers = User.countDocuments();
  const activeUsers = User.countDocuments({ isActive: true });

  const pendingInvoices = Invoice.countDocuments({ status: { $in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] } });
  const paidInvoicesThisMonth = Invoice.countDocuments({
    status: 'PAID',
    // 'paymentHistory.date' pourrait être plus précis si vous voulez les paiements du mois
    // ou 'updatedAt' si le passage à PAID met à jour ce champ de manière fiable.
    // Pour l'instant, on se base sur la date de mise à jour de la facture.
    updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
  });

  const monthlyRevenuePromise = Invoice.aggregate([
    {
      $match: {
        status: 'PAID', // Uniquement les factures payées
        // Si vous stockez la date de paiement, filtrez dessus.
        // Sinon, utilisez issueDate ou une date de 'paiement' dans paymentHistory.
        // Pour cet exemple, on prend les factures payées dont la date d'émission est dans le mois.
        // Idéalement, vous sommeriez les paiements du mois.
        issueDate: { $gte: startOfMonth, $lte: endOfMonth } // Ou une date de paiement effective
      }
    },
    {
      $group: {
        _id: null, // Grouper tous les documents
        totalRevenue: { $sum: '$totalTTC' } // Sommer le totalTTC des factures payées
      }
    }
  ]);

  const criticalStockProducts = Product.countDocuments({
    isService: false,
    $expr: { $lte: ['$stockQuantity', '$criticalStockThreshold'] } // stockQuantity <= criticalStockThreshold
  });

  const recentSecurityLogsCount = SecurityLog.countDocuments({
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Dernières 24h
  });

  // Exécuter toutes les promesses en parallèle
  const [
    usersCount,
    activeUsersCount,
    pendingInvoicesCount,
    paidInvoicesCount,
    revenueResult,
    criticalStockCount,
    securityLogsCount
  ] = await Promise.all([
    totalUsers,
    activeUsers,
    pendingInvoices,
    paidInvoicesThisMonth,
    monthlyRevenuePromise,
    criticalStockProducts,
    recentSecurityLogsCount
  ]);

  const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  res.status(200).json({
    success: true,
    data: {
      totalUsers: usersCount,
      activeUsers: activeUsersCount,
      pendingInvoices: pendingInvoicesCount,
      paidInvoicesThisMonth: paidInvoicesCount,
      monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
      criticalStockProducts: criticalStockCount,
      recentSecurityLogsCount: securityLogsCount,
      // Vous pouvez ajouter d'autres statistiques ici :
      // - Nombre total de clients
      // - Nombre de devis en attente
      // - Nombre de BL à expédier
    }
  });
});


// @desc    Récupérer les journaux de sécurité (avec filtres, tri, pagination)
// @route   GET /api/admin/security-logs
// @access  Private/Admin
exports.getSecurityLogs = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(
    SecurityLog.find().populate('userId', 'username email'), // Populer l'utilisateur si un ID est présent
    req.query
  )
    .filter() // Filtres sur timestamp, level, action, userId, ipAddress, etc.
    .search(['message', 'action', 'usernameAttempt', 'ipAddress', 'targetResource'])
    .sort() // Par défaut, tri par timestamp descendant
    .limitFields()
    .paginate();

  // Tri par défaut si non spécifié
  if (!req.query.sort) {
    features.mongooseQuery = features.mongooseQuery.sort('-timestamp');
  }

  const logs = await features.mongooseQuery;

  const totalLogs = await new APIFeatures(SecurityLog.find(features.mongooseQuery.getFilter()), req.query)
    .filter()
    .search(['message', 'action', 'usernameAttempt', 'ipAddress', 'targetResource'])
    .count();

  res.status(200).json({
    success: true,
    count: logs.length,
    total: totalLogs,
    pagination: {
      currentPage: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50,
      totalPages: Math.ceil(totalLogs / (parseInt(req.query.limit, 10) || 50)) || 1
    },
    data: logs,
  });
});


// @desc    Récupérer des données pour les graphiques du tableau de bord admin
// @route   GET /api/admin/charts-data
// @access  Private/Admin
exports.getChartsData = asyncHandler(async (req, res, next) => {
    // --- Exemple 1: Ventes par mois sur les 12 derniers mois ---
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0,0,0,0);

    const salesByMonth = await Invoice.aggregate([
        {
            $match: {
                status: 'PAID', // Ou 'SENT' si vous voulez le revenu "attendu"
                issueDate: { $gte: twelveMonthsAgo } // Factures des 12 derniers mois
            }
        },
        {
            $group: {
                _id: { year: { $year: '$issueDate' }, month: { $month: '$issueDate' } },
                totalSales: { $sum: '$totalTTC' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        },
        {
            $project: {
                _id: 0,
                month: '$_id.month',
                year: '$_id.year',
                label: { $concat: [ { $toString: '$_id.month' }, '/', { $toString: '$_id.year' } ] },
                totalSales: '$totalSales',
                invoiceCount: '$count'
            }
        }
    ]);

    // --- Exemple 2: Répartition des statuts des devis ---
    const quoteStatusDistribution = await Quote.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: '$count'
            }
        }
    ]);

    // --- Exemple 3: Top 5 des produits les plus vendus (en quantité sur les factures payées) ---
    const topSellingProducts = await Invoice.aggregate([
        { $match: { status: 'PAID' } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product', // ou '$items.productName' si vous voulez le nom direct
                totalQuantitySold: { $sum: '$items.quantity' }
            }
        },
        {
            $lookup: { // Pour obtenir le nom du produit
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true} },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: 5 },
        {
            $project: {
                _id: 0,
                productId: '$_id',
                productName: '$productInfo.name',
                totalQuantitySold: '$totalQuantitySold'
            }
        }
    ]);


    res.status(200).json({
        success: true,
        data: {
            salesByMonth,
            quoteStatusDistribution,
            topSellingProducts,
            // Ajoutez d'autres données pour graphiques ici
        }
    });
});


// Les contrôleurs pour la gestion des utilisateurs (CRUD complet) sont déjà dans user.controller.js
// mais pourraient être dupliqués ou appelés ici si l'Admin a des actions spécifiques supplémentaires
// non couvertes par le CRUD standard (ex: batch actions, impersonation).
// Pour l'instant, on suppose que user.controller.js gère le CRUD admin des utilisateurs.