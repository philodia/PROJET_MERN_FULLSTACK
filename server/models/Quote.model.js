// gestion-commerciale-app/backend/models/Quote.model.js
const mongoose = require('mongoose');
const { generateDocumentNumber } = require('../utils/generateNumber'); // Assurez-vous que ce chemin est correct

// Sous-schéma pour les lignes d'articles dans le devis
const QuoteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise pour chaque article.'],
    min: [0.01, 'La quantité doit être supérieure à 0.'],
  },
  unitPriceHT: {
    type: Number,
    required: [true, 'Le prix unitaire HT est requis.'],
    min: [0, 'Le prix unitaire ne peut pas être négatif.'],
  },
  vatRate: {
    type: Number,
    required: [true, 'Le taux de TVA est requis.'],
    min: [0, 'Le taux de TVA ne peut pas être négatif.'],
  },
  discountRate: {
    type: Number,
    default: 0,
    min: [0, 'Le taux de remise ne peut pas être négatif.'],
    max: [100, 'Le taux de remise ne peut pas dépasser 100.'],
  },
  totalHTBeforeDiscount: { type: Number, required: true, default: 0 }, // Marquer comme requis et default 0
  discountAmount: { type: Number, required: true, default: 0 },        // Marquer comme requis et default 0
  totalHT: { type: Number, required: true, default: 0 },               // Marquer comme requis et default 0
  totalVAT: { type: Number, required: true, default: 0 },              // Marquer comme requis et default 0
  totalTTC: { type: Number, required: true, default: 0 },              // Marquer comme requis et default 0
}, { _id: false });

const QuoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      required: [true, 'Le numéro de devis est requis.'],
      unique: true, // Crée automatiquement un index unique
      trim: true,
      uppercase: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Un client est requis pour le devis.'],
      index: true, // Index simple sur client pour des recherches plus rapides par client
    },
    clientSnapshot: {
        companyName: String,
        contactFullName: String,
        email: String,
        billingAddress: { // Considérez de réutiliser votre AddressSchema ici si elle est exportée
            street: String,
            additionalLine: String,
            city: String,
            zipCode: String,
            stateOrProvince: String,
            country: String,
        }
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true, // Indexer la date d'émission
    },
    validityDate: {
      type: Date,
      required: [true, 'La date de validité est requise.'],
      index: true, // Indexer la date de validité
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_INVOICE', 'CONVERTED_TO_DELIVERY'],
      default: 'DRAFT',
      required: true,
      index: true, // L'index est défini ici, pas besoin de le redéfinir plus bas
    },
    items: [QuoteItemSchema],
    subTotalHTBeforeDiscount: { type: Number, required: true, default: 0 },
    totalDiscountAmount: { type: Number, required: true, default: 0 },
    subTotalHT: { type: Number, required: true, default: 0 },
    totalVATAmount: { type: Number, required: true, default: 0 },
    totalTTC: { type: Number, required: true, default: 0 },
    currency: {
        type: String,
        default: 'EUR',
        uppercase: true,
        trim: true,
    },
    convertedToInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        default: null,
        index: true, // Indexer si vous recherchez souvent les devis convertis
    },
    convertedToDeliveryNoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryNote',
        default: null,
        index: true, // Indexer si vous recherchez souvent les devis convertis
    },
    termsAndConditions: {
      type: String,
      trim: true,
    },
    internalNotes: {
      type: String,
      trim: true,
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Maintenir requis
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sentAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- HOOKS / MIDDLEWARE MONGOOSE ---

// Calculer les totaux pour chaque ligne avant la validation de la ligne elle-même
QuoteItemSchema.pre('validate', function(next) {
    this.totalHTBeforeDiscount = parseFloat((this.quantity * this.unitPriceHT).toFixed(2));
    this.discountAmount = parseFloat((this.totalHTBeforeDiscount * (this.discountRate / 100)).toFixed(2));
    this.totalHT = parseFloat((this.totalHTBeforeDiscount - this.discountAmount).toFixed(2));
    this.totalVAT = parseFloat((this.totalHT * (this.vatRate / 100)).toFixed(2));
    this.totalTTC = parseFloat((this.totalHT + this.totalVAT).toFixed(2));
    next();
});

QuoteSchema.pre('validate', async function (next) {
  // Générer le numéro de devis si c'est un nouveau document et qu'il n'est pas déjà fourni
  if (this.isNew && !this.quoteNumber) {
    try {
      this.quoteNumber = await generateDocumentNumber('QUOTE', 'DEV', 6); // Ex: DEV24000001
    } catch (error) {
      console.error("Erreur de génération auto du quoteNumber:", error.message);
      // Transmettre l'erreur pour qu'elle soit gérée par le gestionnaire d'erreurs global
      return next(new Error('Impossible de générer le numéro de devis. Raison: ' + error.message));
    }
  }

  // Recalculer les totaux globaux si les items sont modifiés ou si c'est un nouveau document
  if (this.isModified('items') || this.isNew) {
    let subTotalHTBeforeDiscount = 0;
    let totalDiscountAmount = 0;
    let subTotalHT = 0;
    let totalVATAmount = 0;
    let totalTTC = 0;

    this.items.forEach(item => {
      // S'assurer que les valeurs de l'item existent avant de les additionner
      subTotalHTBeforeDiscount += item.totalHTBeforeDiscount || 0;
      totalDiscountAmount += item.discountAmount || 0;
      subTotalHT += item.totalHT || 0;
      totalVATAmount += item.totalVAT || 0;
      totalTTC += item.totalTTC || 0;
    });

    this.subTotalHTBeforeDiscount = parseFloat(subTotalHTBeforeDiscount.toFixed(2));
    this.totalDiscountAmount = parseFloat(totalDiscountAmount.toFixed(2));
    this.subTotalHT = parseFloat(subTotalHT.toFixed(2));
    this.totalVATAmount = parseFloat(totalVATAmount.toFixed(2));
    this.totalTTC = parseFloat(totalTTC.toFixed(2));
  }
  next();
});


// --- INDEXES (Confirmation et nettoyage) ---
// Les index suivants sont déjà implicitement créés par les options dans la définition des champs:
// - `quoteNumber` via `unique: true`
// - `status` via `index: true`
// - `client` via `index: true` (ajouté ci-dessus)
// - `issueDate` via `index: true` (ajouté ci-dessus)
// - `validityDate` via `index: true` (ajouté ci-dessus)
// - `convertedToInvoiceId` via `index: true` (ajouté ci-dessus)
// - `convertedToDeliveryNoteId` via `index: true` (ajouté ci-dessus)

// Vous pourriez ajouter des indexes composés si vous avez des requêtes très spécifiques, par exemple:
// QuoteSchema.index({ client: 1, status: 1 }); // Pour rechercher les devis d'un client par statut
// QuoteSchema.index({ status: 1, issueDate: -1 }); // Pour les devis par statut, triés par date

module.exports = mongoose.model('Quote', QuoteSchema);