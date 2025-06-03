// gestion-commerciale-app/backend/controllers/invoice.controller.js

const Invoice = require('../models/Invoice.model');
const Client = require('../models/Client.model');
const Product = require('../models/Product.model');
const Quote = require('../models/Quote.model'); // Pour créer depuis un devis
const DeliveryNote = require('../models/DeliveryNote.model'); // Pour créer depuis un/des BL(s)
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
const NotificationService = require('../services/notification.service');
const AccountingService = require('../services/accounting.service'); // Pour enregistrer les écritures
const PDFService = require('../services/pdf.service'); // Pour générer les PDF
const config = require('../config'); // Pour les infos de l'entreprise pour le PDF

// @desc    Récupérer toutes les factures
// @route   GET /api/invoices
// @access  Private (Manager, Accountant, Admin)
exports.getAllInvoices = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(
    Invoice.find().populate('client', 'companyName clientNumber').populate('createdBy', 'username'),
    req.query
  )
    .filter()
    .search(['invoiceNumber', 'clientSnapshot.companyName'])
    .sort()
    .limitFields()
    .paginate();

  const invoices = await features.mongooseQuery;

  const totalInvoices = await new APIFeatures(Invoice.find(features.mongooseQuery.getFilter()), req.query)
    .filter()
    .search(['invoiceNumber', 'clientSnapshot.companyName'])
    .count();

  res.status(200).json({
    success: true,
    count: invoices.length,
    total: totalInvoices,
    pagination: {
      currentPage: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 25,
      totalPages: Math.ceil(totalInvoices / (parseInt(req.query.limit, 10) || 25)) || 1
    },
    data: invoices,
  });
});

// @desc    Récupérer une facture par son ID
// @route   GET /api/invoices/:id
// @access  Private (Manager, Accountant, Admin)
exports.getInvoiceById = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('client')
    .populate('items.product', 'name sku isService')
    .populate('quote', 'quoteNumber')
    .populate('deliveryNotes', 'deliveryNoteNumber deliveryDate')
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email')
    .populate('paymentHistory.recordedBy', 'username');

  if (!invoice) {
    return next(new AppError(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

// @desc    Créer une nouvelle facture (manuellement ou depuis un devis/BL)
// @route   POST /api/invoices
// @access  Private (Manager, Admin)
// @body    { client: ID, items: [...], dueDate, quoteId?: ID, deliveryNoteIds?: [ID], ... }
exports.createInvoice = asyncHandler(async (req, res, next) => {
  const {
    client: clientId,
    items: rawItems, // Items fournis directement
    dueDate,
    quoteId,         // Optionnel: ID du devis source
    deliveryNoteIds, // Optionnel: Tableau d'IDs de BL sources
    issueDate,       // Optionnel, par défaut Date.now()
    termsAndConditions,
    internalNotes,
    customerNotes,
    status,          // Statut initial (ex: DRAFT)
    currency
  } = req.body;

  if (!clientId || !dueDate) {
    return next(new AppError('Client et date d\'échéance sont requis pour créer une facture.', 400));
  }

  // 1. Récupérer les informations du client pour le snapshot
  const client = await Client.findById(clientId);
  if (!client) {
    return next(new AppError(`Client non trouvé avec l'ID ${clientId}`, 404));
  }
  const clientSnapshot = {
    companyName: client.companyName,
    contactFullName: client.contactFullName,
    email: client.email,
    billingAddress: client.billingAddress ? { ...client.billingAddress.toObject() } : undefined,
    siren: client.siren,
    vatNumber: client.vatNumber,
  };

  let processedItems = [];
  let sourceQuote = null;
  let sourceDeliveryNotes = [];

  // 2. Traiter les items: soit depuis un devis, soit depuis des BLs, soit fournis directement
  if (quoteId) {
    sourceQuote = await Quote.findById(quoteId).populate('items.product');
    if (!sourceQuote) return next(new AppError(`Devis source avec ID ${quoteId} non trouvé.`, 404));
    if (sourceQuote.status !== 'ACCEPTED') { // Ou autre statut permettant la conversion
        return next(new AppError(`Le devis N°${sourceQuote.quoteNumber} doit être accepté pour être facturé.`, 400));
    }
    if (sourceQuote.convertedToInvoiceId) {
        return next(new AppError(`Le devis N°${sourceQuote.quoteNumber} a déjà été facturé (Facture ID: ${sourceQuote.convertedToInvoiceId}).`, 400));
    }
    // Transformer les items du devis en items de facture
    sourceQuote.items.forEach(qItem => {
      processedItems.push({
        product: qItem.product._id,
        productName: qItem.productName,
        description: qItem.description,
        quantity: qItem.quantity,
        unitPriceHT: qItem.unitPriceHT,
        vatRate: qItem.vatRate,
        discountRate: qItem.discountRate,
      });
    });
  } else if (deliveryNoteIds && deliveryNoteIds.length > 0) {
    for (const dnId of deliveryNoteIds) {
      const dn = await DeliveryNote.findById(dnId).populate('items.product');
      if (!dn) return next(new AppError(`Bon de livraison avec ID ${dnId} non trouvé.`, 404));
      if (dn.invoiceId) return next(new AppError(`Le BL N°${dn.deliveryNoteNumber} est déjà lié à la facture ID ${dn.invoiceId}.`, 400));
      if (dn.client.toString() !== clientId) return next(new AppError(`Le BL N°${dn.deliveryNoteNumber} n'appartient pas au client sélectionné.`, 400));
      sourceDeliveryNotes.push(dn._id);
      dn.items.forEach(dnItem => {
        // Logique pour agréger les items de plusieurs BL ou les ajouter tels quels
        // Pour l'instant, ajout simple. Une logique d'agrégation serait plus complexe.
        processedItems.push({
          product: dnItem.product._id,
          productName: dnItem.productName,
          description: dnItem.description,
          quantity: dnItem.quantityDelivered, // Facturer la quantité livrée
          unitPriceHT: dnItem.product.unitPriceHT, // Prendre le prix actuel du produit, ou celui du devis si disponible
          vatRate: dnItem.product.vatRate,
          discountRate: 0, // Gérer les remises si elles viennent d'un devis lié aux BL
        });
      });
    }
  } else if (rawItems && rawItems.length > 0) {
    // Items fournis manuellement
    for (const item of rawItems) {
      if (!item.product || !item.quantity) {
        return next(new AppError('Chaque article doit avoir un produit et une quantité.', 400));
      }
      const productDoc = await Product.findById(item.product);
      if (!productDoc) return next(new AppError(`Produit avec ID ${item.product} non trouvé.`, 404));
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
  } else {
    return next(new AppError('Veuillez fournir des articles, un devis source, ou des bons de livraison sources.', 400));
  }

  if (processedItems.length === 0) {
    return next(new AppError('Aucun article à facturer.', 400));
  }


  const invoiceData = {
    client: clientId,
    clientSnapshot,
    items: processedItems,
    issueDate: issueDate || Date.now(),
    dueDate,
    status: status || 'DRAFT',
    quote: sourceQuote ? sourceQuote._id : null,
    deliveryNotes: sourceDeliveryNotes,
    termsAndConditions,
    internalNotes,
    customerNotes,
    currency: currency || client.currency || 'EUR',
    createdBy: req.user.id,
    // invoiceNumber, subTotalHT, totalVATAmount, totalTTC, amountPaid sont gérés par les hooks du modèle
  };

  const newInvoice = await Invoice.create(invoiceData);

  // Mettre à jour les documents sources
  if (sourceQuote) {
    sourceQuote.status = 'CONVERTED_TO_INVOICE';
    sourceQuote.convertedToInvoiceId = newInvoice._id;
    sourceQuote.updatedBy = req.user.id;
    await sourceQuote.save();
  }
  if (sourceDeliveryNotes.length > 0) {
    for (const dnId of sourceDeliveryNotes) {
      await DeliveryNote.findByIdAndUpdate(dnId, { invoiceId: newInvoice._id, updatedBy: req.user.id });
    }
  }

  // Enregistrement comptable si la facture est directement validée (non DRAFT)
  if (newInvoice.status === 'SENT' || newInvoice.status === 'PAID') { // Ou autre statut indiquant une facture finalisée
    try {
      await AccountingService.recordSaleInvoice(newInvoice, req.user.id);
    } catch (accountingError) {
      console.error(`Erreur comptable lors de la création de la facture ${newInvoice.invoiceNumber}:`, accountingError);
      // Ne pas bloquer la création de la facture, mais logger/notifier. Ou invalider la facture.
      // newInvoice.internalNotes = `${newInvoice.internalNotes || ''}\nErreur compta: ${accountingError.message}`;
      // await newInvoice.save();
    }
  }

  res.status(201).json({
    success: true,
    message: 'Facture créée avec succès.',
    data: newInvoice,
  });
});

// @desc    Mettre à jour une facture (principalement statut, notes, ou si DRAFT)
// @route   PUT /api/invoices/:id
// @access  Private (Manager, Admin)
exports.updateInvoice = asyncHandler(async (req, res, next) => {
  const invoiceId = req.params.id;
  const { items: rawItems, dueDate, termsAndConditions, internalNotes, customerNotes, status, currency } = req.body;

  let invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new AppError(`Facture non trouvée avec l'ID ${invoiceId}`, 404));
  }

  // Restrictions de modification
  const nonEditableStatusesByManager = ['PAID', 'CANCELLED', 'VOIDED', 'PARTIALLY_PAID']; // Statuts que le manager ne peut pas modifier (sauf peut-être pour ajouter un paiement)
  if (invoice.status !== 'DRAFT' && req.user.role !== 'ADMIN') {
      // Les managers ne peuvent modifier les items que si DRAFT. Pour les autres statuts, seul l'admin peut toucher aux items (avec prudence).
      if (rawItems) {
        return next(new AppError(`Les articles d'une facture non-brouillon ne peuvent être modifiés que par un Admin.`, 403));
      }
      if (nonEditableStatusesByManager.includes(invoice.status) && (dueDate || currency || termsAndConditions)) {
          return next(new AppError(`Seuls certains champs (notes, statut limité) de cette facture (statut: ${invoice.status}) peuvent être modifiés par un Manager.`, 403));
      }
  }


  // Mise à jour des items (si DRAFT ou par Admin)
  if (rawItems && (invoice.status === 'DRAFT' || req.user.role === 'ADMIN')) {
    const processedItems = [];
    for (const item of rawItems) {
      // ... (logique de validation et de traitement des items similaire à createInvoice) ...
      const productDoc = await Product.findById(item.product);
      if (!productDoc) return next(new AppError(`Produit ID ${item.product} non trouvé.`, 404));
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
    invoice.items = processedItems;
  }


  if (dueDate) invoice.dueDate = dueDate;
  if (termsAndConditions !== undefined) invoice.termsAndConditions = termsAndConditions;
  if (internalNotes !== undefined) invoice.internalNotes = internalNotes;
  if (customerNotes !== undefined) invoice.customerNotes = customerNotes;
  if (currency) invoice.currency = currency;

  const oldStatus = invoice.status;
  if (status && status !== oldStatus) {
    // Valider la transition de statut
    invoice.status = status;
    if (status === 'SENT' && !invoice.sentAt) invoice.sentAt = Date.now();
    // ... autres logiques de date pour les statuts

    // Enregistrement comptable si la facture passe à un statut finalisé
    if ((status === 'SENT' || status === 'PAID') && (oldStatus === 'DRAFT')) { // Ou autre statut non finalisé
        try {
            await AccountingService.recordSaleInvoice(invoice, req.user.id); // Passer l'instance 'invoice' avant .save() pour les calculs
        } catch (accountingError) {
            console.error(`Erreur comptable lors de la mise à jour de la facture ${invoice.invoiceNumber}:`, accountingError);
            // Gérer l'erreur
        }
    }
  }

  invoice.updatedBy = req.user.id;
  // La sauvegarde déclenchera les hooks pour recalculer les totaux et mettre à jour le statut en fonction de amountPaid.
  const updatedInvoice = await invoice.save();

  res.status(200).json({
    success: true,
    message: `Facture N°${updatedInvoice.invoiceNumber} mise à jour avec succès.`,
    data: updatedInvoice,
  });
});

// @desc    Enregistrer un paiement pour une facture
// @route   POST /api/invoices/:id/payments
// @access  Private (Accountant, Admin, Manager)
exports.recordPayment = asyncHandler(async (req, res, next) => {
    const invoiceId = req.params.id;
    const { amount, date, paymentMethod, reference } = req.body;

    if (typeof amount !== 'number' || amount <= 0 || !date || !paymentMethod) {
        return next(new AppError('Montant (>0), date et méthode de paiement sont requis.', 400));
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
        return next(new AppError(`Facture non trouvée avec l'ID ${invoiceId}`, 404));
    }

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED' || invoice.status === 'VOIDED') {
        return next(new AppError(`Impossible d'enregistrer un paiement sur une facture ${invoice.status}.`, 400));
    }

    const newPayment = {
        amount: parseFloat(amount),
        date: new Date(date),
        paymentMethod,
        reference,
        recordedBy: req.user.id,
    };

    invoice.paymentHistory.push(newPayment);
    invoice.amountPaid = parseFloat((invoice.amountPaid + newPayment.amount).toFixed(2));
    invoice.updatedBy = req.user.id;

    // Le hook pre('validate') du modèle Invoice mettra à jour le statut (PAID, PARTIALLY_PAID)
    const updatedInvoice = await invoice.save();

    // Enregistrement comptable du paiement
    try {
        await AccountingService.recordPaymentReceived(updatedInvoice, newPayment.amount, newPayment.date, undefined, req.user.id);
    } catch (accountingError) {
        console.error(`Erreur comptable lors de l'enregistrement du paiement pour la facture ${updatedInvoice.invoiceNumber}:`, accountingError);
        // Que faire ici? Annuler le paiement enregistré? Notifier?
    }

    NotificationService.notifyPaymentReceived(updatedInvoice, newPayment.amount);

    res.status(200).json({
        success: true,
        message: `Paiement de ${newPayment.amount} ${updatedInvoice.currency} enregistré pour la facture N°${updatedInvoice.invoiceNumber}.`,
        data: updatedInvoice,
    });
});


// @desc    Supprimer une facture (action très sensible)
// @route   DELETE /api/invoices/:id
// @access  Private (Admin)
exports.deleteInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return next(new AppError(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
  }

  // Règle stricte : ne pas supprimer une facture qui n'est pas DRAFT ou qui a des paiements.
  // La suppression de factures validées est généralement interdite. Préférer un statut CANCELLED/VOIDED.
  if (invoice.status !== 'DRAFT' || invoice.paymentHistory.length > 0) {
    return next(new AppError(`La facture N°${invoice.invoiceNumber} (statut: ${invoice.status}, paiements: ${invoice.paymentHistory.length}) ne peut pas être supprimée. Envisagez de l'annuler ou de l'invalider.`, 400));
  }

  // Annuler les liens sur les documents sources
  if (invoice.quote) {
      await Quote.findByIdAndUpdate(invoice.quote, { status: 'ACCEPTED', convertedToInvoiceId: null, updatedBy: req.user.id }); // Revenir à un statut approprié
  }
  if (invoice.deliveryNotes && invoice.deliveryNotes.length > 0) {
      for (const dnId of invoice.deliveryNotes) {
          await DeliveryNote.findByIdAndUpdate(dnId, { invoiceId: null, updatedBy: req.user.id });
      }
  }

  // Si des écritures comptables ont été générées pour cette facture DRAFT (peu probable), il faudrait les extourner.
  // Normalement, les écritures ne sont générées que pour les factures SENT/PAID.

  await invoice.deleteOne();

  res.status(200).json({
    success: true,
    message: `Facture N°${invoice.invoiceNumber} (brouillon) supprimée avec succès.`,
    data: {},
  });
});


// @desc    Télécharger une facture en PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private (Manager, Accountant, Admin)
exports.downloadInvoicePDF = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('client')
        .populate('items.product', 'name'); // Seulement les infos nécessaires pour le PDF

    if (!invoice) {
        return next(new AppError(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
    }

    // Informations de l'entreprise (à récupérer depuis la config ou une DB)
    const companyInfo = {
        name: config.COMPANY_NAME || 'Votre Entreprise SAS',
        address: {
            street: config.COMPANY_STREET || '123 Rue de la République',
            city: config.COMPANY_CITY || 'Paris',
            zipCode: config.COMPANY_ZIPCODE || '75001',
            country: config.COMPANY_COUNTRY || 'France'
        },
        phone: config.COMPANY_PHONE || '01 23 45 67 89',
        email: config.COMPANY_EMAIL || 'contact@votreentreprise.com',
        siren: config.COMPANY_SIREN || '123 456 789',
        vatNumber: config.COMPANY_VAT_NUMBER || 'FR00123456789',
        logoPath: config.COMPANY_LOGO_PATH // Assurez-vous que ce chemin est valide
    };

    try {
        const pdfBuffer = await PDFService.generateInvoicePDF(invoice.toObject(), companyInfo);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=facture-${invoice.invoiceNumber}.pdf`);
        // Pour afficher dans le navigateur:
        // res.setHeader('Content-Disposition', `inline; filename=facture-${invoice.invoiceNumber}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error(`Erreur lors de la génération du PDF pour la facture ${invoice.invoiceNumber}:`, error);
        return next(new AppError('Impossible de générer le PDF de la facture.', 500));
    }
});