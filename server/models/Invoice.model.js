// gestion-commerciale-app/backend/models/Invoice.model.js
const mongoose = require('mongoose');
const { generateDocumentNumber } = require('../utils/generateNumber');

// --- InvoiceItemSchema ---
const InvoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true, trim: true }, // Snapshot du nom
  description: { type: String, trim: true }, // Snapshot de la description
  quantity: { type: Number, required: [true, 'La quantité est requise.'], min: [0.01, 'La quantité doit être supérieure à 0.'] },
  unitPriceHT: { type: Number, required: [true, 'Le prix unitaire HT est requis.'], min: [0, 'Le prix unitaire ne peut pas être négatif.'] },
  vatRate: { type: Number, required: [true, 'Le taux de TVA est requis.'], min: [0, 'Le taux de TVA ne peut pas être négatif.'] }, // en % ex: 20 pour 20%
  discountRate: { type: Number, default: 0, min: [0, 'Le taux de remise ne peut pas être négatif.'], max: [100, 'Le taux de remise ne peut pas dépasser 100.'] }, // en %
  // Champs calculés (seront remplis par le hook pre-validate)
  totalHTBeforeDiscount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalHT: { type: Number, default: 0 },
  totalVatAmount: { type: Number, default: 0 },
  totalTTC: { type: Number, default: 0 },
}, { _id: false });

InvoiceItemSchema.pre('validate', function(next) {
  // S'assurer que les valeurs numériques sont bien des nombres avant calcul
  const qty = Number(this.quantity) || 0;
  const price = Number(this.unitPriceHT) || 0;
  const discRate = Number(this.discountRate) || 0;
  const vatR = Number(this.vatRate) || 0;

  this.totalHTBeforeDiscount = parseFloat((qty * price).toFixed(2));
  this.discountAmount = parseFloat((this.totalHTBeforeDiscount * (discRate / 100)).toFixed(2));
  this.totalHT = parseFloat((this.totalHTBeforeDiscount - this.discountAmount).toFixed(2));
  this.totalVatAmount = parseFloat((this.totalHT * (vatR / 100)).toFixed(2));
  this.totalTTC = parseFloat((this.totalHT + this.totalVatAmount).toFixed(2));
  next();
});

// --- PaymentHistorySchema ---
const PaymentHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  amount: { type: Number, required: true, min: [0.01, 'Le montant du paiement doit être positif.'] },
  paymentMethod: {
    type: String,
    required: true,
    trim: true,
    enum: ['BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'CASH', 'PAYPAL', 'STRIPE', 'SEPA_DIRECT_DEBIT', 'OTHER'],
  },
  reference: { type: String, trim: true },
  notes: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: 'recordedAt', updatedAt: false } }); // updatedAt: false est pertinent

// --- InvoiceSchema ---
const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, trim: true, uppercase: true, index: true }, // Sera généré si non fourni
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'Un client est requis pour la facture.'], index: true },
    clientSnapshot: { // Sauvegarde des informations client au moment de la création/finalisation
      companyName: { type: String, required: true },
      contactFullName: String,
      email: String,
      billingAddress: {
        street: String, additionalLine: String, city: String, zipCode: String, stateOrProvince: String, country: String
      },
      siren: String,
      vatNumber: String,
    },
    issueDate: { type: Date, default: Date.now, required: true, index: true },
    dueDate: { type: Date, required: [true, 'La date d\'échéance est requise.'], index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'VIEWED_BY_CLIENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'VOIDED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    items: [InvoiceItemSchema],
    subTotalHTBeforeDiscount: { type: Number, default: 0 },
    totalDiscountAmount: { type: Number, default: 0 },
    subTotalHT: { type: Number, default: 0 }, // Somme des totalHT des items
    totalVatAmount: { type: Number, default: 0 }, // Somme des totalVatAmount des items
    totalTTC: { type: Number, default: 0 },      // Somme des totalTTC des items
    amountPaid: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'EUR', uppercase: true, trim: true, required: true },
    paymentHistory: [PaymentHistorySchema],
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', default: null, index: true, sparse: true },
    deliveryNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryNote' }],
    termsAndConditions: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    customerNotes: { type: String, trim: true }, // Notes visibles par le client sur la facture
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: null }, // Date d'envoi de la facture
    viewedAt: { type: Date, default: null }, // Date de première visualisation par le client
    // relatedAccountingEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' } // Lien vers l'écriture comptable
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true, getters: true }, // getters: true pour appliquer les transformations définies dans le schéma
    toObject: { virtuals: true, getters: true },
  }
);

// --- VIRTUALS ---
InvoiceSchema.virtual('amountDue').get(function() {
  if (this.status === 'VOIDED' || this.status === 'CANCELLED') return 0;
  return parseFloat(Math.max(0, (this.totalTTC - this.amountPaid)).toFixed(2));
});

InvoiceSchema.virtual('isPaid').get(function() {
  return this.status === 'PAID';
});

InvoiceSchema.virtual('isOverdue').get(function() {
  if (!['PAID', 'CANCELLED', 'VOIDED'].includes(this.status) && this.dueDate) {
    return new Date() > new Date(this.dueDate);
  }
  return false;
});

// --- HOOKS ---

// 1. Générer le numéro de facture si nouveau et non fourni
InvoiceSchema.pre('validate', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      // Le type 'FAC' ou 'INV' pourrait être stocké dans une config ou dérivé
      this.invoiceNumber = await generateDocumentNumber('INV', 'FAC', 7);
    } catch (error) {
      console.error("Erreur de génération auto du invoiceNumber:", error);
      // Passer l'erreur à Mongoose pour qu'elle soit gérée comme une erreur de validation
      return next(new Error(`Impossible de générer le numéro de facture: ${error.message}`));
    }
  }
  next();
});

// 2. Calculer les totaux de la facture à partir des items
InvoiceSchema.pre('validate', function(next) {
  if (this.isModified('items') || this.isNew) {
    let subTotalHTBeforeDiscount = 0;
    let totalDiscountAmount = 0;
    let subTotalHT = 0;
    let totalVatAmountItemLevel = 0; // Somme des TVA calculées au niveau de l'item
    let totalTTCItemLevel = 0;       // Somme des TTC calculés au niveau de l'item

    this.items.forEach(item => {
      subTotalHTBeforeDiscount += item.totalHTBeforeDiscount || 0;
      totalDiscountAmount += item.discountAmount || 0;
      subTotalHT += item.totalHT || 0;
      totalVatAmountItemLevel += item.totalVatAmount || 0;
      totalTTCItemLevel += item.totalTTC || 0;
    });

    this.subTotalHTBeforeDiscount = parseFloat(subTotalHTBeforeDiscount.toFixed(2));
    this.totalDiscountAmount = parseFloat(totalDiscountAmount.toFixed(2));
    this.subTotalHT = parseFloat(subTotalHT.toFixed(2));
    // Pour la TVA et le TTC globaux, il est parfois plus précis de les recalculer sur le subTotalHT global
    // plutôt que de sommer les arrondis des items, selon les règles fiscales.
    // Ici, on somme les valeurs des items pour la simplicité, mais attention aux arrondis cumulés.
    this.totalVatAmount = parseFloat(totalVatAmountItemLevel.toFixed(2));
    this.totalTTC = parseFloat(totalTTCItemLevel.toFixed(2));
  }
  next();
});

// 3. Mettre à jour amountPaid à partir de paymentHistory
InvoiceSchema.pre('validate', function(next) {
  if (this.isModified('paymentHistory') || (this.isNew && this.paymentHistory.length > 0)) {
    this.amountPaid = this.paymentHistory.reduce((acc, payment) => acc + (Number(payment.amount) || 0), 0);
    this.amountPaid = parseFloat(this.amountPaid.toFixed(2));
  }
  next();
});

// 4. Mettre à jour le statut de la facture (après que amountPaid et les totaux soient à jour)
InvoiceSchema.pre('validate', function(next) {
  // Ce hook doit s'exécuter après que `amountPaid` et `totalTTC` soient correctement calculés
  if (this.isModified('amountPaid') || this.isModified('totalTTC') || this.isNew || this.isModified('status') || this.isModified('dueDate') || this.isModified('sentAt')) {
    if (this.status === 'VOIDED' || this.status === 'CANCELLED') {
      // Ne rien faire si déjà annulée/voidée
      return next();
    }

    const isEffectivelyPaid = this.totalTTC > 0 && this.amountPaid >= this.totalTTC; // Gère les petites différences de float
    const isPartiallyPaid = this.amountPaid > 0 && this.amountPaid < this.totalTTC;
    // this.isOverdue est un virtuel, utilisons sa logique ici :
    const overdueCondition = this.dueDate && new Date(this.dueDate) < new Date() && !isEffectivelyPaid;

    if (isEffectivelyPaid) {
      this.status = 'PAID';
    } else if (isPartiallyPaid) {
      this.status = 'PARTIALLY_PAID';
    } else if (this.status !== 'DRAFT' && this.sentAt && overdueCondition) { // Une facture DRAFT ne devient pas OVERDUE
      this.status = 'OVERDUE';
    } else if (this.status === 'PAID' && this.amountPaid < this.totalTTC) { // Cas où un paiement est enlevé d'une facture payée
      this.status = overdueCondition ? 'OVERDUE' : (this.sentAt ? 'SENT' : 'DRAFT');
    }
    // Si elle est DRAFT et que les conditions ci-dessus ne sont pas remplies, elle reste DRAFT.
    // Si elle est SENT et non payée et non en retard, elle reste SENT.
  }
  next();
});


// --- METHODS ---
// InvoiceSchema.methods.sendInvoice = async function() { ... }
// InvoiceSchema.methods.recordPayment = function(paymentData, userId) { ... }


// Le modèle
module.exports = mongoose.model('Invoice', InvoiceSchema);