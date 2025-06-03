// gestion-commerciale-app/backend/controllers/product.controller.js

const Product = require('../models/Product.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
const { generateDocumentNumber } = require('../utils/generateNumber'); // Pour générer SKU si besoin

// @desc    Récupérer tous les produits et services
// @route   GET /api/products
// @access  Public (ou Private selon vos besoins de visibilité du catalogue)
exports.getAllProducts = asyncHandler(async (req, res, next) => {
  // On ne peuple pas 'supplier' par défaut ici pour garder la réponse légère.
  // Si besoin, le client peut demander une population spécifique ou un endpoint détaillé.
  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .search(['name', 'sku', 'description', 'category', 'tags'])
    .sort()
    .limitFields()
    .paginate();

  const products = await features.mongooseQuery;

  const totalProducts = await new APIFeatures(Product.find(features.mongooseQuery.getFilter()), req.query)
                                .filter()
                                .search(['name', 'sku', 'description', 'category', 'tags'])
                                .count();

  res.status(200).json({
    success: true,
    count: products.length,
    total: totalProducts,
    pagination: {
        currentPage: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 25,
        totalPages: Math.ceil(totalProducts / (parseInt(req.query.limit, 10) || 25)) || 1
    },
    data: products,
  });
});

// @desc    Récupérer un produit ou service par son ID
// @route   GET /api/products/:id
// @access  Public (ou Private)
exports.getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('supplier', 'companyName supplierNumber email') // Populer les infos de base du fournisseur
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');

  if (!product) {
    return next(new AppError(`Produit ou service non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Créer un nouveau produit ou service
// @route   POST /api/products
// @access  Private (Manager, Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
  const productData = { ...req.body };
  productData.createdBy = req.user.id; // Assigner l'utilisateur connecté

  // Générer un SKU si non fourni et si ce n'est pas un service (et si la logique est activée)
  if (!productData.sku && (productData.isService === false || productData.isService === undefined)) {
    try {
        productData.sku = await generateDocumentNumber('PRODUCT_SKU', 'SKU', 6);
    } catch (error) {
        console.error("Erreur lors de la génération du SKU:", error);
        // Optionnel: return next(new AppError('Impossible de générer le SKU du produit.', 500));
    }
  } else if (productData.sku) {
    // Vérifier l'unicité si SKU est fourni manuellement
    const existingProductBySKU = await Product.findOne({ sku: productData.sku.toUpperCase() });
    if (existingProductBySKU) {
        return next(new AppError(`Un produit avec le SKU '${productData.sku.toUpperCase()}' existe déjà.`, 400));
    }
    productData.sku = productData.sku.toUpperCase(); // S'assurer que le SKU est en majuscules
  }

  // Vérifier l'unicité du nom (déjà gérée par l'index unique du modèle, mais une vérification ici peut donner un meilleur message d'erreur)
  const existingProductByName = await Product.findOne({ name: productData.name });
  if (existingProductByName) {
    return next(new AppError(`Un produit ou service avec le nom '${productData.name}' existe déjà.`, 400));
  }

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    message: 'Produit/Service créé avec succès.',
    data: product,
  });
});

// @desc    Mettre à jour un produit ou service
// @route   PUT /api/products/:id
// @access  Private (Manager, Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;
  const updateData = { ...req.body };
  updateData.updatedBy = req.user.id;

  let product = await Product.findById(productId);

  if (!product) {
    return next(new AppError(`Produit ou service non trouvé avec l'ID ${productId}`, 404));
  }

  // Gérer la mise à jour du nom et vérifier l'unicité
  if (updateData.name && updateData.name !== product.name) {
    const existingProductByName = await Product.findOne({ name: updateData.name, _id: { $ne: productId } });
    if (existingProductByName) {
        return next(new AppError(`Un autre produit ou service avec le nom '${updateData.name}' existe déjà.`, 400));
    }
  }

  // Gérer la mise à jour du SKU et vérifier l'unicité
  if (updateData.sku && updateData.sku.toUpperCase() !== product.sku) {
    const skuUpper = updateData.sku.toUpperCase();
    const existingProductBySKU = await Product.findOne({ sku: skuUpper, _id: { $ne: productId } });
    if (existingProductBySKU) {
        return next(new AppError(`Un autre produit avec le SKU '${skuUpper}' existe déjà.`, 400));
    }
    updateData.sku = skuUpper; // S'assurer que le SKU est en majuscules
  }


  // Si isService est modifié, les hooks pre('save') du modèle devraient gérer la réinitialisation des champs de stock.
  // Cependant, si on utilise findByIdAndUpdate, il faut gérer cela ici ou s'assurer que les validateurs et hooks sont bien exécutés.
  // L'option `runValidators: true` aide, mais les hooks de document ne sont pas exécutés par findByIdAndUpdate.
  // Préférable d'utiliser product.save() pour les mises à jour complexes.

  // Pour plus de contrôle avec les hooks (comme celui qui ajuste les champs de stock si isService change) :
  Object.assign(product, updateData); // Appliquer les modifications à l'instance du document
  const updatedProduct = await product.save(); // Sauvegarder, ce qui exécute les hooks et validateurs

  // Alternative avec findByIdAndUpdate (plus simple mais moins de contrôle sur les hooks):
  // const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
  //   new: true,
  //   runValidators: true,
  // });

  if (!updatedProduct) {
      return next(new AppError(`Produit ou service non trouvé avec l'ID ${productId} lors de la tentative de mise à jour.`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'Produit/Service mis à jour avec succès.',
    data: updatedProduct,
  });
});

// @desc    Supprimer un produit ou service
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError(`Produit ou service non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Avant de supprimer, vérifier les dépendances (ex: lignes de factures, devis, stock dans des commandes en cours)
  // C'est une logique complexe qui dépend de vos autres modèles.
  // Exemple simplifié :
  // const isInInvoiceLine = await InvoiceLine.countDocuments({ product: product._id });
  // if (isInInvoiceLine > 0) {
  //   return next(new AppError('Ce produit est utilisé dans des factures et ne peut pas être supprimé. Considérez de le désactiver.', 400));
  // }
  // Vous pourriez plutôt le marquer comme `isActive: false` (soft delete).

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Produit/Service supprimé avec succès.',
    data: {},
  });
});

// @desc    Ajuster manuellement le stock d'un produit
// @route   POST /api/products/:id/adjust-stock
// @access  Private (Manager, Admin)
exports.adjustStock = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const { adjustment, reason, newStockQuantity } = req.body; // `adjustment` peut être positif ou négatif, ou `newStockQuantity` pour définir une nouvelle valeur

    const product = await Product.findById(productId);

    if (!product) {
        return next(new AppError(`Produit non trouvé avec l'ID ${productId}`, 404));
    }

    if (product.isService) {
        return next(new AppError('Le stock ne peut pas être ajusté pour un service.', 400));
    }

    if (newStockQuantity !== undefined) {
        if (typeof newStockQuantity !== 'number' || newStockQuantity < 0) {
            return next(new AppError('La nouvelle quantité en stock doit être un nombre positif ou nul.', 400));
        }
        product.stockQuantity = newStockQuantity;
    } else if (adjustment !== undefined) {
        if (typeof adjustment !== 'number') {
            return next(new AppError('L\'ajustement de stock doit être un nombre.', 400));
        }
        const calculatedNewStock = product.stockQuantity + adjustment;
        if (calculatedNewStock < 0) {
            return next(new AppError('L\'ajustement entraînerait un stock négatif.', 400));
        }
        product.stockQuantity = calculatedNewStock;
    } else {
        return next(new AppError('Veuillez fournir un "adjustment" ou une "newStockQuantity".', 400));
    }

    // Idéalement, logger cette opération d'ajustement manuel
    // Ex: await StockMovement.create({ product: productId, type: 'MANUAL_ADJUSTMENT', quantityChange: adjustment || (newStockQuantity - (product.stockQuantity - adjustment)), reason, user: req.user.id })
    // Pour l'instant, nous sauvegardons juste le produit.
    // Vous pourriez aussi vouloir enregistrer `reason` dans un champ du produit ou un log séparé.

    await product.save(); // Sauvegarder les modifications du stock

    // Vérifier si une alerte de stock doit être émise (si vous avez NotificationService)
    // if (product.stockQuantity <= product.criticalStockThreshold) {
    //   const NotificationService = require('../services/notification.service'); // Charger dynamiquement ou injecter
    //   NotificationService.notifyStockAlert(product);
    // }

    res.status(200).json({
        success: true,
        message: `Stock pour '${product.name}' ajusté à ${product.stockQuantity}. ${reason ? 'Raison: ' + reason : ''}`,
        data: product,
    });
});