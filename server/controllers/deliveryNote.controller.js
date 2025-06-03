// gestion-commerciale-app/backend/controllers/deliveryNote.controller.js

const DeliveryNote = require('../models/DeliveryNote.model');
const Quote = require('../models/Quote.model'); // Pour créer un BL depuis un devis
const Product = require('../models/Product.model'); // Pour mettre à jour le stock
const Client = require('../models/Client.model'); // Pour le snapshot client
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
const NotificationService = require('../services/notification.service'); // Optionnel
// const StockService = require('../services/stock.service.js'); // Si vous centralisez la logique de stock

// @desc    Récupérer tous les bons de livraison
// @route   GET /api/delivery-notes
// @access  Private (Manager, Accountant, Admin)
exports.getAllDeliveryNotes = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(
    DeliveryNote.find().populate('client', 'companyName clientNumber').populate('createdBy', 'username'),
    req.query
  )
    .filter()
    .search(['deliveryNoteNumber', 'clientSnapshot.companyName', 'trackingNumber'])
    .sort()
    .limitFields()
    .paginate();

  const deliveryNotes = await features.mongooseQuery;

  const totalDeliveryNotes = await new APIFeatures(DeliveryNote.find(features.mongooseQuery.getFilter()), req.query)
    .filter()
    .search(['deliveryNoteNumber', 'clientSnapshot.companyName', 'trackingNumber'])
    .count();

  res.status(200).json({
    success: true,
    count: deliveryNotes.length,
    total: totalDeliveryNotes,
    pagination: {
      currentPage: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 25,
      totalPages: Math.ceil(totalDeliveryNotes / (parseInt(req.query.limit, 10) || 25)) || 1
    },
    data: deliveryNotes,
  });
});

// @desc    Récupérer un bon de livraison par son ID
// @route   GET /api/delivery-notes/:id
// @access  Private (Manager, Accountant, Admin)
exports.getDeliveryNoteById = asyncHandler(async (req, res, next) => {
  const deliveryNote = await DeliveryNote.findById(req.params.id)
    .populate('client')
    .populate('items.product', 'name sku isService stockQuantity') // Pour voir le stock actuel du produit
    .populate('quote', 'quoteNumber')
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');

  if (!deliveryNote) {
    return next(new AppError(`Bon de livraison non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: deliveryNote,
  });
});

// @desc    Créer un nouveau bon de livraison
// @route   POST /api/delivery-notes
// @access  Private (Manager, Admin)
// @body    { client: ID, items: [{ product: ID, quantityDelivered: Number, quantityOrdered?: Number, description?: String }], deliveryDate?: Date, quoteId?: ID, status?: String, ... }
exports.createDeliveryNote = asyncHandler(async (req, res, next) => {
  const {
    client: clientId,
    items,
    deliveryDate,
    quoteId, // ID du devis source, optionnel
    // salesOrderId, // ID de la commande source, optionnel
    status, // Statut initial
    shippingMethod,
    trackingNumber,
    carrier,
    internalNotes,
    customerNotes,
    clientSnapshot: providedClientSnapshot // Permettre de fournir un snapshot si différent du client actuel
  } = req.body;

  if (!clientId || !items || items.length === 0) {
    return next(new AppError('Client et au moins un article sont requis pour créer un bon de livraison.', 400));
  }

  // 1. Récupérer le client pour le snapshot (sauf si un snapshot est déjà fourni)
  let clientSnapshotData = providedClientSnapshot;
  if (!clientSnapshotData) {
      const client = await Client.findById(clientId);
      if (!client) {
        return next(new AppError(`Client non trouvé avec l'ID ${clientId}`, 404));
      }
      clientSnapshotData = {
        companyName: client.companyName,
        contactFullName: client.contactFullName,
        shippingAddress: client.shippingAddress ? { ...client.shippingAddress.toObject() } : (client.billingAddress ? { ...client.billingAddress.toObject() } : undefined),
      };
  }


  // 2. Traiter les items
  const processedItems = [];
  for (const item of items) {
    if (!item.product || typeof item.quantityDelivered !== 'number' || item.quantityDelivered <= 0) {
      return next(new AppError('Chaque article du BL doit avoir un produit et une quantité livrée valide (>0).', 400));
    }
    const productDoc = await Product.findById(item.product);
    if (!productDoc) {
      return next(new AppError(`Produit avec ID ${item.product} non trouvé.`, 404));
    }
    if (productDoc.isService && item.quantityDelivered > 0) {
        // Pour les services, la "livraison" peut être symbolique.
        // On peut permettre quantité > 0 pour les services, mais la logique de stock ne s'appliquera pas.
        // console.log(`Note: Article de service '${productDoc.name}' inclus dans le BL.`);
    }
    // Vérification de stock si ce n'est pas un service (peut être faite plus tard lors du changement de statut à "SHIPPED")
    // if (!productDoc.isService && productDoc.stockQuantity < item.quantityDelivered) {
    //   return next(new AppError(`Stock insuffisant pour le produit '${productDoc.name}'. Stock: ${productDoc.stockQuantity}, Demandé: ${item.quantityDelivered}.`, 400));
    // }

    processedItems.push({
      product: productDoc._id,
      productName: productDoc.name,
      description: item.description || productDoc.description,
      quantityOrdered: typeof item.quantityOrdered === 'number' ? parseFloat(item.quantityOrdered) : parseFloat(item.quantityDelivered), // Par défaut qté commandée = qté livrée
      quantityDelivered: parseFloat(item.quantityDelivered),
    });
  }

  const deliveryNoteData = {
    client: clientId,
    clientSnapshot: clientSnapshotData,
    items: processedItems,
    deliveryDate: deliveryDate || Date.now(),
    status: status || 'PENDING_PREPARATION',
    quote: quoteId || null,
    // salesOrder: salesOrderId || null,
    shippingMethod,
    trackingNumber,
    carrier,
    internalNotes,
    customerNotes,
    createdBy: req.user.id,
    // deliveryNoteNumber sera généré par le hook pre('validate')
  };

  const newDeliveryNote = await DeliveryNote.create(deliveryNoteData);

  // Si créé depuis un devis, mettre à jour le statut du devis
  if (quoteId) {
      await Quote.findByIdAndUpdate(quoteId, {
          status: 'CONVERTED_TO_DELIVERY', // Ou un statut plus granulaire
          convertedToDeliveryNoteId: newDeliveryNote._id,
          updatedBy: req.user.id
      });
  }

  res.status(201).json({
    success: true,
    message: 'Bon de livraison créé avec succès.',
    data: newDeliveryNote,
  });
});

// @desc    Mettre à jour un bon de livraison
// @route   PUT /api/delivery-notes/:id
// @access  Private (Manager, Admin)
exports.updateDeliveryNote = asyncHandler(async (req, res, next) => {
  const deliveryNoteId = req.params.id;
  const { items, deliveryDate, status, shippingMethod, trackingNumber, carrier, internalNotes, customerNotes, clientSnapshot } = req.body;

  let deliveryNote = await DeliveryNote.findById(deliveryNoteId);
  if (!deliveryNote) {
    return next(new AppError(`Bon de livraison non trouvé avec l'ID ${deliveryNoteId}`, 404));
  }

  // Restrictions de modification basées sur le statut actuel
  // Par exemple, un BL 'DELIVERED' ou 'SHIPPED' ne devrait pas être facilement modifiable pour ses items.
  const nonEditableStatuses = ['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
  if (nonEditableStatuses.includes(deliveryNote.status) && req.user.role !== 'ADMIN') {
      if (items || deliveryDate || (clientSnapshot && clientSnapshot.shippingAddress)) { // Si on tente de modifier des champs critiques
        return next(new AppError(`Le bon de livraison N°${deliveryNote.deliveryNoteNumber} ne peut plus être modifié (statut: ${deliveryNote.status}). Contactez un Admin.`, 400));
      }
  }


  // Mise à jour des items (si fournis) - une logique plus complexe serait nécessaire pour une mise à jour partielle
  if (items) {
    const processedItems = [];
    for (const item of items) {
      if (!item.product || typeof item.quantityDelivered !== 'number' || item.quantityDelivered < 0) {
        return next(new AppError('Chaque article du BL doit avoir un produit et une quantité livrée valide (>=0).', 400));
      }
      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return next(new AppError(`Produit avec ID ${item.product} non trouvé.`, 404));
      }
      processedItems.push({
        product: productDoc._id,
        productName: productDoc.name,
        description: item.description || productDoc.description,
        quantityOrdered: typeof item.quantityOrdered === 'number' ? parseFloat(item.quantityOrdered) : parseFloat(item.quantityDelivered),
        quantityDelivered: parseFloat(item.quantityDelivered),
      });
    }
    deliveryNote.items = processedItems;
  }

  if (deliveryDate) deliveryNote.deliveryDate = deliveryDate;
  if (shippingMethod !== undefined) deliveryNote.shippingMethod = shippingMethod;
  if (trackingNumber !== undefined) deliveryNote.trackingNumber = trackingNumber;
  if (carrier !== undefined) deliveryNote.carrier = carrier;
  if (internalNotes !== undefined) deliveryNote.internalNotes = internalNotes;
  if (customerNotes !== undefined) deliveryNote.customerNotes = customerNotes;
  if (clientSnapshot && clientSnapshot.shippingAddress) deliveryNote.clientSnapshot.shippingAddress = clientSnapshot.shippingAddress;

  // Gestion du statut (voir updateDeliveryNoteStatus pour une gestion plus dédiée)
  const oldStatus = deliveryNote.status;
  if (status && status !== oldStatus) {
    deliveryNote.status = status;
    if (status === 'SHIPPED' && !deliveryNote.shippedAt) deliveryNote.shippedAt = Date.now();
    if (status === 'DELIVERED' && !deliveryNote.deliveredAt) deliveryNote.deliveredAt = Date.now();

    // *** LOGIQUE DE MISE À JOUR DU STOCK ***
    // C'est un bon endroit pour déclencher la mise à jour du stock si le statut passe à SHIPPED ou DELIVERED
    if ((status === 'SHIPPED' || status === 'DELIVERED') && (oldStatus !== 'SHIPPED' && oldStatus !== 'DELIVERED')) {
        await updateStockForDeliveryNote(deliveryNote, 'DECREMENT'); // 'DECREMENT' ou 'ADJUST'
        NotificationService.broadcast('stock_updated', { message: `Stock mis à jour suite au BL ${deliveryNote.deliveryNoteNumber}` });
    }
    // Gérer le cas d'une annulation ou d'un retour qui pourrait ré-incrémenter le stock
    if ((status === 'CANCELLED' || status === 'RETURNED') && (oldStatus === 'SHIPPED' || oldStatus === 'DELIVERED')) {
        await updateStockForDeliveryNote(deliveryNote, 'INCREMENT'); // Ou 'REVERSE_ADJUSTMENT'
    }
  }

  deliveryNote.updatedBy = req.user.id;
  const updatedDeliveryNote = await deliveryNote.save();

  res.status(200).json({
    success: true,
    message: `Bon de livraison N°${updatedDeliveryNote.deliveryNoteNumber} mis à jour avec succès.`,
    data: updatedDeliveryNote,
  });
});


// @desc    Changer le statut d'un bon de livraison
// @route   PATCH /api/delivery-notes/:id/status
// @access  Private (Manager, Admin)
exports.updateDeliveryNoteStatus = asyncHandler(async (req, res, next) => {
    const deliveryNoteId = req.params.id;
    const { status, deliveryDate, shippedAt, deliveredAt } = req.body; // Permettre de mettre à jour les dates associées

    if (!status) {
        return next(new AppError('Un nouveau statut est requis.', 400));
    }

    const allowedStatuses = DeliveryNote.schema.path('status').enumValues;
    if (!allowedStatuses.includes(status)) {
        return next(new AppError(`Statut '${status}' invalide.`, 400));
    }

    const deliveryNote = await DeliveryNote.findById(deliveryNoteId).populate('items.product'); // Populer product pour la mise à jour du stock
    if (!deliveryNote) {
        return next(new AppError(`Bon de livraison non trouvé avec l'ID ${deliveryNoteId}`, 404));
    }

    const oldStatus = deliveryNote.status;
    if (oldStatus === status) {
        return res.status(200).json({ success: true, message: 'Le statut du bon de livraison est déjà à jour.', data: deliveryNote });
    }

    // Logique de transition de statut ici (si nécessaire)

    deliveryNote.status = status;
    if (deliveryDate) deliveryNote.deliveryDate = deliveryDate;
    if (shippedAt || (status === 'SHIPPED' && !deliveryNote.shippedAt)) deliveryNote.shippedAt = shippedAt || Date.now();
    if (deliveredAt || (status === 'DELIVERED' && !deliveryNote.deliveredAt)) deliveryNote.deliveredAt = deliveredAt || Date.now();
    deliveryNote.updatedBy = req.user.id;

    // *** LOGIQUE DE MISE À JOUR DU STOCK ***
    if ((status === 'SHIPPED' || status === 'DELIVERED') && (oldStatus !== 'SHIPPED' && oldStatus !== 'DELIVERED')) {
        await updateStockForDeliveryNote(deliveryNote, 'DECREMENT');
        NotificationService.broadcast('stock_updated', { message: `Stock mis à jour suite au BL ${deliveryNote.deliveryNoteNumber} (nouveau statut: ${status})` });
    }
    if ((status === 'CANCELLED' || status === 'RETURNED') && (oldStatus === 'SHIPPED' || oldStatus === 'DELIVERED')) {
        // S'assurer que les produits sont bien retournés en stock
        await updateStockForDeliveryNote(deliveryNote, 'INCREMENT');
         NotificationService.broadcast('stock_updated', { message: `Stock réajusté suite à annulation/retour du BL ${deliveryNote.deliveryNoteNumber}` });
    }


    const updatedDeliveryNote = await deliveryNote.save();

    // NotificationService.notifyDeliveryNoteStatusChanged(updatedDeliveryNote, oldStatus, req.user);

    res.status(200).json({
        success: true,
        message: `Statut du bon de livraison N°${updatedDeliveryNote.deliveryNoteNumber} mis à jour à '${status}'.`,
        data: updatedDeliveryNote,
    });
});


// @desc    Supprimer un bon de livraison
// @route   DELETE /api/delivery-notes/:id
// @access  Private (Admin)
exports.deleteDeliveryNote = asyncHandler(async (req, res, next) => {
  const deliveryNote = await DeliveryNote.findById(req.params.id);

  if (!deliveryNote) {
    return next(new AppError(`Bon de livraison non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Empêcher la suppression si le BL a un statut avancé (ex: DELIVERED) ou est facturé, sauf si Admin avec un flag de forçage
  if (['SHIPPED', 'DELIVERED'].includes(deliveryNote.status) && req.user.role !== 'ADMIN') {
    return next(new AppError(`Ce bon de livraison (statut: ${deliveryNote.status}) ne peut pas être supprimé. Contactez un Admin.`, 400));
  }
  if (deliveryNote.invoiceId && req.user.role !== 'ADMIN') {
    return next(new AppError(`Ce bon de livraison est lié à une facture et ne peut pas être supprimé. Contactez un Admin.`, 400));
  }

  // Si le BL a impacté le stock (SHIPPED ou DELIVERED), il faut annuler cet impact.
  // Cette logique est complexe et dépend de si les produits peuvent être "remis en stock".
  if (['SHIPPED', 'DELIVERED'].includes(deliveryNote.status)) {
      console.warn(`Suppression d'un BL (N°${deliveryNote.deliveryNoteNumber}) qui a potentiellement impacté le stock. Une opération de réajustement du stock pourrait être nécessaire.`);
      // await updateStockForDeliveryNote(deliveryNote, 'INCREMENT'); // Ré-incrémenter le stock
  }


  await deliveryNote.deleteOne();

  res.status(200).json({
    success: true,
    message: `Bon de livraison N°${deliveryNote.deliveryNoteNumber} supprimé avec succès.`,
    data: {},
  });
});


/**
 * Met à jour le stock des produits listés dans un bon de livraison.
 * @param {mongoose.Document<DeliveryNote>} deliveryNote - Le document du bon de livraison.
 * @param {'INCREMENT' | 'DECREMENT'} operation - 'INCREMENT' pour ajouter au stock (retour/annulation), 'DECREMENT' pour retirer du stock (livraison).
 * @private
 */
async function updateStockForDeliveryNote(deliveryNote, operation) {
    if (!deliveryNote || !deliveryNote.items || deliveryNote.items.length === 0) {
        console.warn('Aucun item trouvé sur le bon de livraison pour la mise à jour du stock.');
        return;
    }

    console.log(`Mise à jour du stock (${operation}) pour BL: ${deliveryNote.deliveryNoteNumber}`);

    for (const item of deliveryNote.items) {
        const product = await Product.findById(item.product); // Assurez-vous que les items ont bien l'ID produit, pas l'objet complet sans _id.
        if (product && !product.isService) {
            let stockChange = item.quantityDelivered;
            if (operation === 'INCREMENT') {
                product.stockQuantity += stockChange;
            } else if (operation === 'DECREMENT') {
                product.stockQuantity -= stockChange;
                if (product.stockQuantity < 0) {
                    console.warn(`Alerte: Stock négatif pour ${product.name} (${product.sku}) après décrémentation. Stock: ${product.stockQuantity}`);
                    // Vous pourriez vouloir empêcher le stock de devenir négatif ici ou le gérer d'une autre manière
                    // product.stockQuantity = 0; // Option: Ne pas laisser le stock devenir négatif
                }
            }
            await product.save();
            console.log(`Stock pour ${product.name} (${product.sku}): ${product.stockQuantity} (changement: ${operation === 'INCREMENT' ? '+' : '-'}${stockChange})`);

            // Notifier si stock bas après décrémentation
            if (operation === 'DECREMENT' && product.stockQuantity <= product.criticalStockThreshold) {
                NotificationService.notifyStockAlert(product);
            }
        }
    }
}