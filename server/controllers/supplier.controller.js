// gestion-commerciale-app/backend/controllers/supplier.controller.js

const Supplier = require('../models/Supplier.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
const { generateDocumentNumber } = require('../utils/generateNumber'); // Pour générer supplierNumber

// @desc    Récupérer tous les fournisseurs
// @route   GET /api/suppliers
// @access  Private (Manager, Accountant, Admin)
exports.getAllSuppliers = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Supplier.find().populate('createdBy', 'username email'), req.query)
    .filter()
    .search(['companyName', 'supplierNumber', 'email', 'contactLastName', 'contactFirstName', 'siren', 'vatNumber'])
    .sort()
    .limitFields()
    .paginate();

  const suppliers = await features.mongooseQuery;

  const totalSuppliers = await new APIFeatures(Supplier.find(features.mongooseQuery.getFilter()), req.query)
                                .filter()
                                .search(['companyName', 'supplierNumber', 'email', 'contactLastName', 'contactFirstName', 'siren', 'vatNumber'])
                                .count();

  res.status(200).json({
    success: true,
    count: suppliers.length,
    total: totalSuppliers,
    pagination: {
        currentPage: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 25,
        totalPages: Math.ceil(totalSuppliers / (parseInt(req.query.limit, 10) || 25)) || 1
    },
    data: suppliers,
  });
});

// @desc    Récupérer un fournisseur par son ID
// @route   GET /api/suppliers/:id
// @access  Private (Manager, Accountant, Admin)
exports.getSupplierById = asyncHandler(async (req, res, next) => {
  const supplier = await Supplier.findById(req.params.id)
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email')
    .populate('interactions.recordedBy', 'username');

  if (!supplier) {
    return next(new AppError(`Fournisseur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: supplier,
  });
});

// @desc    Créer un nouveau fournisseur
// @route   POST /api/suppliers
// @access  Private (Manager, Admin)
exports.createSupplier = asyncHandler(async (req, res, next) => {
  const supplierData = { ...req.body };
  supplierData.createdBy = req.user.id;

  if (!supplierData.supplierNumber) {
    try {
        supplierData.supplierNumber = await generateDocumentNumber('SUPPLIER', 'FOUR', 5);
    } catch (error) {
        console.error("Erreur lors de la génération du numéro de fournisseur:", error);
        // Optionnel: return next(new AppError('Impossible de générer le numéro de fournisseur.', 500));
    }
  } else {
    const existingSupplierByNumber = await Supplier.findOne({ supplierNumber: supplierData.supplierNumber });
    if (existingSupplierByNumber) {
        return next(new AppError(`Un fournisseur avec le numéro '${supplierData.supplierNumber}' existe déjà.`, 400));
    }
  }

  const supplier = await Supplier.create(supplierData);

  res.status(201).json({
    success: true,
    message: 'Fournisseur créé avec succès.',
    data: supplier,
  });
});

// @desc    Mettre à jour un fournisseur
// @route   PUT /api/suppliers/:id
// @access  Private (Manager, Admin)
exports.updateSupplier = asyncHandler(async (req, res, next) => {
  const supplierId = req.params.id;
  const updateData = { ...req.body };
  updateData.updatedBy = req.user.id;

  let supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    return next(new AppError(`Fournisseur non trouvé avec l'ID ${supplierId}`, 404));
  }

  if (updateData.supplierNumber && updateData.supplierNumber !== supplier.supplierNumber) {
    const existingSupplierByNumber = await Supplier.findOne({ supplierNumber: updateData.supplierNumber, _id: { $ne: supplierId } });
    if (existingSupplierByNumber) {
        return next(new AppError(`Un autre fournisseur avec le numéro '${updateData.supplierNumber}' existe déjà.`, 400));
    }
  }

  const updatedSupplier = await Supplier.findByIdAndUpdate(supplierId, updateData, {
    new: true,
    runValidators: true,
  });

   if (!updatedSupplier) {
      return next(new AppError(`Fournisseur non trouvé avec l'ID ${supplierId} lors de la tentative de mise à jour.`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'Fournisseur mis à jour avec succès.',
    data: updatedSupplier,
  });
});

// @desc    Supprimer un fournisseur
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
exports.deleteSupplier = asyncHandler(async (req, res, next) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return next(new AppError(`Fournisseur non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Avant de supprimer, vérifier les dépendances (ex: produits liés, bons de commande ouverts)
  // Exemple: si vous avez un champ 'supplier' dans le modèle Product
  // const linkedProducts = await Product.countDocuments({ supplier: supplier._id });
  // if (linkedProducts > 0) {
  //   return next(new AppError('Ce fournisseur est lié à des produits et ne peut pas être supprimé directement.', 400));
  // }

  await supplier.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Fournisseur supprimé avec succès.',
    data: {},
  });
});


// --- Gestion des Interactions Fournisseur ---

// @desc    Ajouter une interaction à un fournisseur
// @route   POST /api/suppliers/:id/interactions
// @access  Private (Manager, Admin)
exports.addSupplierInteraction = asyncHandler(async (req, res, next) => {
    const supplierId = req.params.id;
    const { type, summary, relatedDocumentId } = req.body; // `relatedDocumentId` pourrait être un ID de bon de commande par exemple

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
        return next(new AppError(`Fournisseur non trouvé avec l'ID ${supplierId}`, 404));
    }

    if (!type || !summary) {
        return next(new AppError('Le type et le résumé de l\'interaction sont requis.', 400));
    }

    const newInteraction = {
        type,
        summary,
        relatedDocumentId: relatedDocumentId || null,
        recordedBy: req.user.id,
    };

    supplier.interactions.push(newInteraction);
    await supplier.save();

    const updatedSupplier = await Supplier.findById(supplierId).populate('interactions.recordedBy', 'username');
    const addedInteraction = updatedSupplier.interactions[updatedSupplier.interactions.length - 1];

    res.status(201).json({
        success: true,
        message: 'Interaction avec le fournisseur ajoutée avec succès.',
        data: addedInteraction,
    });
});

// @desc    Supprimer une interaction d'un fournisseur
// @route   DELETE /api/suppliers/:id/interactions/:interactionId
// @access  Private (Manager, Admin)
exports.deleteSupplierInteraction = asyncHandler(async (req, res, next) => {
    const { id: supplierId, interactionId } = req.params;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
        return next(new AppError(`Fournisseur non trouvé avec l'ID ${supplierId}`, 404));
    }

    const interactionIndex = supplier.interactions.findIndex(
        (inter) => inter._id.toString() === interactionId
    );

    if (interactionIndex === -1) {
        return next(new AppError(`Interaction non trouvée avec l'ID ${interactionId} pour ce fournisseur.`, 404));
    }

    supplier.interactions.splice(interactionIndex, 1);
    await supplier.save();

    res.status(200).json({
        success: true,
        message: 'Interaction avec le fournisseur supprimée avec succès.',
        data: {},
    });
});