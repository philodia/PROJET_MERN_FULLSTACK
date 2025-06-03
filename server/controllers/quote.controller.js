// gestion-commerciale-app/backend/controllers/quote.controller.js

const Quote = require('../models/Quote.model');
const Client = require('../models/Client.model'); // Pour récupérer/snapshoter les infos client
const Product = require('../models/Product.model'); // Pour valider les produits et récupérer les prix/infos
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
const NotificationService = require('../services/notification.service'); // Optionnel

// @desc    Récupérer tous les devis
// @route   GET /api/quotes
// @access  Private (Manager, Accountant, Admin)
exports.getAllQuotes = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(
    Quote.find().populate('client', 'companyName clientNumber').populate('createdBy', 'username'),
    req.query
  )
    .filter()
    .search(['quoteNumber', 'clientSnapshot.companyName']) // Rechercher sur le numéro de devis ou nom client snapshoté
    .sort()
    .limitFields()
    .paginate();

  const quotes = await features.mongooseQuery;

  const totalQuotes = await new APIFeatures(Quote.find(features.mongooseQuery.getFilter()), req.query)
    .filter()
    .search(['quoteNumber', 'clientSnapshot.companyName'])
    .count();

  res.status(200).json({
    success: true,
    count: quotes.length,
    total: totalQuotes,
    pagination: {
      currentPage: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 25,
      totalPages: Math.ceil(totalQuotes / (parseInt(req.query.limit, 10) || 25)) || 1
    },
    data: quotes,
  });
});

// @desc    Récupérer un devis par son ID
// @route   GET /api/quotes/:id
// @access  Private (Manager, Accountant, Admin)
exports.getQuoteById = asyncHandler(async (req, res, next) => {
  const quote = await Quote.findById(req.params.id)
    .populate('client') // Populer toutes les infos du client lié
    .populate('items.product', 'name sku isService') // Populer les infos de base des produits dans les items
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');

  if (!quote) {
    return next(new AppError(`Devis non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: quote,
  });
});

// @desc    Créer un nouveau devis
// @route   POST /api/quotes
// @access  Private (Manager, Admin)
exports.createQuote = asyncHandler(async (req, res, next) => {
  const { client: clientId, items, validityDate, termsAndConditions, internalNotes, customerNotes, status } = req.body;

  if (!clientId || !items || items.length === 0 || !validityDate) {
    return next(new AppError('Client, au moins un article, et date de validité sont requis pour créer un devis.', 400));
  }

  // 1. Récupérer les informations du client pour le snapshot
  const client = await Client.findById(clientId);
  if (!client) {
    return next(new AppError(`Client non trouvé avec l'ID ${clientId}`, 404));
  }
  const clientSnapshot = {
    companyName: client.companyName,
    contactFullName: client.contactFullName, // Utilise le virtual
    email: client.email,
    billingAddress: client.billingAddress ? { ...client.billingAddress.toObject() } : undefined,
  };

  // 2. Valider les items et récupérer les informations des produits
  const processedItems = [];
  for (const item of items) {
    if (!item.product || !item.quantity) {
      return next(new AppError('Chaque article du devis doit avoir un produit et une quantité.', 400));
    }
    const productDoc = await Product.findById(item.product);
    if (!productDoc) {
      return next(new AppError(`Produit avec ID ${item.product} non trouvé.`, 404));
    }

    processedItems.push({
      product: productDoc._id,
      productName: productDoc.name, // Snapshot du nom du produit
      description: item.description || productDoc.description, // Description surchargée ou celle du produit
      quantity: parseFloat(item.quantity),
      // Utiliser le prix du produit par défaut, mais permettre de le surcharger si fourni dans la requête
      unitPriceHT: typeof item.unitPriceHT === 'number' ? parseFloat(item.unitPriceHT) : parseFloat(productDoc.unitPriceHT),
      vatRate: typeof item.vatRate === 'number' ? parseFloat(item.vatRate) : parseFloat(productDoc.vatRate),
      discountRate: typeof item.discountRate === 'number' ? parseFloat(item.discountRate) : 0,
      // Les totaux par ligne (totalHT, totalVAT, totalTTC) seront calculés par le hook pre('validate') de QuoteItemSchema
    });
  }

  const quoteData = {
    client: clientId,
    clientSnapshot,
    items: processedItems,
    validityDate,
    termsAndConditions,
    internalNotes,
    customerNotes,
    status: status || 'DRAFT', // Statut par défaut si non fourni
    createdBy: req.user.id,
    // quoteNumber sera généré par le hook pre('validate') du modèle Quote
    // les totaux globaux (subTotalHT, totalVATAmount, totalTTC) seront aussi calculés par le hook de QuoteSchema
  };

  const newQuote = await Quote.create(quoteData);

  // Optionnel: Notifier si le devis est directement créé avec un statut "SENT"
  // if (newQuote.status === 'SENT') {
  //   NotificationService.notifyQuoteSent(newQuote, client);
  // }

  res.status(201).json({
    success: true,
    message: 'Devis créé avec succès.',
    data: newQuote,
  });
});

// @desc    Mettre à jour un devis
// @route   PUT /api/quotes/:id
// @access  Private (Manager, Admin)
exports.updateQuote = asyncHandler(async (req, res, next) => {
  const quoteId = req.params.id;
  const { client: clientId, items, validityDate, termsAndConditions, internalNotes, customerNotes, status } = req.body;

  let quote = await Quote.findById(quoteId);
  if (!quote) {
    return next(new AppError(`Devis non trouvé avec l'ID ${quoteId}`, 404));
  }

  // Empêcher la modification de devis qui ne sont plus à l'état de brouillon ou selon vos règles métier
  if (quote.status !== 'DRAFT' /* && quote.status !== 'SENT_NEEDS_REVISION' */) {
      // Autoriser la modification que si admin ou certaines conditions
      if(req.user.role !== 'ADMIN' && (quote.status === 'SENT' || quote.status === 'ACCEPTED' || quote.status === 'REJECTED' || quote.status === 'EXPIRED' || quote.status === 'CONVERTED_TO_INVOICE' || quote.status === 'CONVERTED_TO_DELIVERY')){
        return next(new AppError(`Le devis N°${quote.quoteNumber} ne peut plus être modifié car son statut est '${quote.status}'.`, 400));
      }
  }


  // Mise à jour du client et du snapshot si le client change
  if (clientId && clientId.toString() !== quote.client.toString()) {
    const client = await Client.findById(clientId);
    if (!client) {
      return next(new AppError(`Nouveau client non trouvé avec l'ID ${clientId}`, 404));
    }
    quote.client = clientId;
    quote.clientSnapshot = {
      companyName: client.companyName,
      contactFullName: client.contactFullName,
      email: client.email,
      billingAddress: client.billingAddress ? { ...client.billingAddress.toObject() } : undefined,
    };
  }

  // Mise à jour des items (logique similaire à la création)
  if (items) {
    const processedItems = [];
    for (const item of items) {
      if (!item.product || !item.quantity) {
        return next(new AppError('Chaque article du devis doit avoir un produit et une quantité.', 400));
      }
      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return next(new AppError(`Produit avec ID ${item.product} non trouvé.`, 404));
      }
      processedItems.push({
        product: productDoc._id,
        productName: productDoc.name,
        description: item.description || productDoc.description,
        quantity: parseFloat(item.quantity),
        unitPriceHT: typeof item.unitPriceHT === 'number' ? parseFloat(item.unitPriceHT) : parseFloat(productDoc.unitPriceHT),
        vatRate: typeof item.vatRate === 'number' ? parseFloat(item.vatRate) : parseFloat(productDoc.vatRate),
        discountRate: typeof item.discountRate === 'number' ? parseFloat(item.discountRate) : 0,
      });
    }
    quote.items = processedItems;
  }

  // Mettre à jour les autres champs
  if (validityDate) quote.validityDate = validityDate;
  if (termsAndConditions !== undefined) quote.termsAndConditions = termsAndConditions;
  if (internalNotes !== undefined) quote.internalNotes = internalNotes;
  if (customerNotes !== undefined) quote.customerNotes = customerNotes;

  // Gestion du statut (pourrait avoir une route dédiée /api/quotes/:id/status)
  const oldStatus = quote.status;
  if (status && status !== oldStatus) {
    // Ajouter ici la logique de validation des transitions de statut si nécessaire
    quote.status = status;
    if (status === 'SENT' && !quote.sentAt) quote.sentAt = Date.now();
    if (status === 'ACCEPTED' && !quote.acceptedAt) quote.acceptedAt = Date.now();
    if (status === 'REJECTED' && !quote.rejectedAt) quote.rejectedAt = Date.now();
    // ... autres logiques de date pour les statuts
  }

  quote.updatedBy = req.user.id;

  // La sauvegarde déclenchera les hooks pre('validate') pour recalculer les totaux et potentiellement quoteNumber si c'est une nouvelle création via upsert (pas le cas ici)
  const updatedQuote = await quote.save();

  // Optionnel: Notifier si le statut a changé
  // if (updatedQuote.status !== oldStatus) {
  //   NotificationService.notifyQuoteStatusChanged(updatedQuote, oldStatus);
  // }

  res.status(200).json({
    success: true,
    message: `Devis N°${updatedQuote.quoteNumber} mis à jour avec succès.`,
    data: updatedQuote,
  });
});

// @desc    Supprimer un devis
// @route   DELETE /api/quotes/:id
// @access  Private (Admin, ou Manager si le devis est DRAFT)
exports.deleteQuote = asyncHandler(async (req, res, next) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) {
    return next(new AppError(`Devis non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Logique de permission pour la suppression
  if (quote.status !== 'DRAFT' && req.user.role !== 'ADMIN') {
    return next(new AppError(`Seuls les devis à l'état "Brouillon" peuvent être supprimés par un Manager. Contactez un Admin.`, 403));
  }
  // Un admin peut supprimer n'importe quel devis (avec prudence)

  // Avant de supprimer, vérifier si des documents en dépendent (facture, BL)
  if (quote.convertedToInvoiceId || quote.convertedToDeliveryNoteId) {
      return next(new AppError(`Ce devis a été converti (Facture ID: ${quote.convertedToInvoiceId}, BL ID: ${quote.convertedToDeliveryNoteId}) et ne peut pas être supprimé.`, 400));
  }

  await quote.deleteOne();

  res.status(200).json({
    success: true,
    message: `Devis N°${quote.quoteNumber} supprimé avec succès.`,
    data: {},
  });
});


// --- Actions spécifiques sur les Devis ---

// @desc    Changer le statut d'un devis
// @route   PATCH /api/quotes/:id/status
// @access  Private (Manager, Admin)
exports.updateQuoteStatus = asyncHandler(async (req, res, next) => {
    const quoteId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return next(new AppError('Un nouveau statut est requis.', 400));
    }

    // Valider si le statut est autorisé (déjà fait par l'enum du modèle, mais une vérification ici peut être utile)
    const allowedStatuses = Quote.schema.path('status').enumValues;
    if (!allowedStatuses.includes(status)) {
        return next(new AppError(`Statut '${status}' invalide. Statuts autorisés: ${allowedStatuses.join(', ')}.`, 400));
    }

    const quote = await Quote.findById(quoteId);
    if (!quote) {
        return next(new AppError(`Devis non trouvé avec l'ID ${quoteId}`, 404));
    }

    const oldStatus = quote.status;

    // Ajouter ici une logique de validation des transitions de statut
    // Par exemple, on ne peut pas passer de 'ACCEPTED' à 'DRAFT' sans droits admin.
    // Ou un devis 'EXPIRED' ne peut pas devenir 'ACCEPTED' sans une nouvelle validation de date.
    if (oldStatus === status) {
        return res.status(200).json({ success: true, message: 'Le statut du devis est déjà à jour.', data: quote });
    }

    quote.status = status;
    quote.updatedBy = req.user.id;

    // Mettre à jour les timestamps de statut
    if (status === 'SENT' && !quote.sentAt) quote.sentAt = Date.now();
    else if (status === 'ACCEPTED' && !quote.acceptedAt) quote.acceptedAt = Date.now();
    else if (status === 'REJECTED' && !quote.rejectedAt) quote.rejectedAt = Date.now();
    // Si on revient à DRAFT, peut-être effacer sentAt, acceptedAt, rejectedAt ?
    // if (status === 'DRAFT') {
    //     quote.sentAt = undefined;
    //     quote.acceptedAt = undefined;
    //     quote.rejectedAt = undefined;
    // }

    const updatedQuote = await quote.save();

    // NotificationService.notifyQuoteStatusChanged(updatedQuote, oldStatus, req.user);

    res.status(200).json({
        success: true,
        message: `Statut du devis N°${updatedQuote.quoteNumber} mis à jour à '${status}'.`,
        data: updatedQuote,
    });
});


// D'autres actions pourraient inclure:
// - Dupliquer un devis
// - Envoyer un devis par email (nécessiterait un service d'email)
// - Convertir un devis en Facture ou Bon de Livraison (logique complexe à gérer ici ou dans un service dédié)