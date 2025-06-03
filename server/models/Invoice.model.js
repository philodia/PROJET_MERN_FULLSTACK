// gestion-commerciale-app/backend/models/Invoice.model.js
const mongoose = require('mongoose');
const { generateDocumentNumber } = require('../utils/generateNumber'); // Pour la numérotation

const InvoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  quantity: { type: Number, required: [true, 'La quantité est requise.'], min: [0.01, 'La quantité doit être supérieure à 0.'] },
  unitPriceHT: { type: Number, required: [true, 'Le prix unitaire HT est requis.'], min: [0, 'Le prix unitaire ne peut pas être négatif.'] },
  vatRate: { type: Number, required: [true, 'Le taux de TVA est requis.'], min: [0, 'Le taux de TVA ne peut pas être négatif.'] },
  discountRate: { type: Number, default: 0, min: [0, 'Le taux de remise ne peut pas être négatif.'], max: [100, 'Le taux de remise ne peut pas dépasser 100.'] },
  totalHTBeforeDiscount: { type: Number },
  discountAmount: { type: Number },
  totalHT: { type: Number, required: true },
  totalVatAmount: { type: Number, required: true }, // Nom cohérent
  totalTTC: { type: Number, required: true },
}, { _id: false });

const PaymentHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now, required: true },
    amount: { type: Number, required: true, min: [0.01, 'Le montant du paiement doit être positif.'] },
    paymentMethod: {
        type: String,
        required: true,
        trim: true,
        enum: ['BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'CASH', 'PAYPAL', 'STRIPE', 'OTHER'], // Options plus spécifiques
    },
    reference: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: 'recordedAt', updatedAt: false } });


const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: [true, 'Le numéro de facture est requis.'], unique: true, trim: true, uppercase: true, index: true }, // unique crée déjà un index
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'Un client est requis pour la facture.'] },
    clientSnapshot: {
        companyName: String,
        contactFullName: String,
        email: String,
        billingAddress: { street: String, additionalLine: String, city: String, zipCode: String, stateOrProvince: String, country: String },
        siren: String,
        vatNumber: String,
    },
    issueDate: { type: Date, default: Date.now, required: true },
    dueDate: { type: Date, required: [true, 'La date d\'échéance est requise.'] },
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
    subTotalHT: { type: Number, required: true, default: 0 },
    totalVatAmount: { type: Number, required: true, default: 0 }, // Nom cohérent
    totalTTC: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'EUR', uppercase: true, trim: true },
    paymentHistory: [PaymentHistorySchema],
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', default: null },
    deliveryNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryNote' }],
    termsAndConditions: {
      type: String,
      trim: true,
      default: "Paiement à réception de la facture, sauf accord contraire. Pénalités de retard : taux d'intérêt légal majoré de 10 points. Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40€."
    },
    internalNotes: { type: String, trim: true },
    customerNotes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InvoiceSchema.virtual('amountDue').get(function() {
  if (typeof this.totalTTC === 'number' && typeof this.amountPaid === 'number') {
    return parseFloat((this.totalTTC - this.amountPaid).toFixed(2));
  }
  return this.totalTTC;
});

InvoiceSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'PAID' && this.status !== 'CANCELLED' && this.status !== 'VOIDED' && this.dueDate) {
    return new Date() > new Date(this.dueDate);
  }
  return false;
});

InvoiceItemSchema.pre('validate', function(next) {
    this.totalHTBeforeDiscount = parseFloat((this.quantity * this.unitPriceHT).toFixed(2));
    this.discountAmount = parseFloat((this.totalHTBeforeDiscount * (this.discountRate / 100)).toFixed(2));
    this.totalHT = parseFloat((this.totalHTBeforeDiscount - this.discountAmount).toFixed(2));
    this.totalVatAmount = parseFloat((this.totalHT * (this.vatRate / 100)).toFixed(2)); // Nom cohérent
    this.totalTTC = parseFloat((this.totalHT + this.totalVatAmount).toFixed(2));
    next();
});

InvoiceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      this.invoiceNumber = await generateDocumentNumber('INV', 'FAC', 7);
    } catch (error) {
      console.error("Erreur de génération auto du invoiceNumber:", error);
      return next(new Error('Impossible de générer le numéro de facture.'));
    }
  }

  if (this.isModified('items') || this.isNew) {
    let subTotalHTBeforeDiscount = 0;
    let totalDiscountAmount = 0;
    let subTotalHT = 0;
    let totalVatAmount = 0;
    let totalTTC = 0;

    this.items.forEach(item => {
      subTotalHTBeforeDiscount += item.totalHTBeforeDiscount || 0;
      totalDiscountAmount += item.discountAmount || 0;
      subTotalHT += item.totalHT || 0;
      totalVatAmount += item.totalVatAmount || 0; // Nom cohérent
      totalTTC += item.totalTTC || 0;
    });

    this.subTotalHTBeforeDiscount = parseFloat(subTotalHTBeforeDiscount.toFixed(2));
    this.totalDiscountAmount = parseFloat(totalDiscountAmount.toFixed(2));
    this.subTotalHT = parseFloat(subTotalHT.toFixed(2));
    this.totalVatAmount = parseFloat(totalVatAmount.toFixed(2)); // Nom cohérent
    this.totalTTC = parseFloat(totalTTC.toFixed(2));
  }

  // Logique de mise à jour du statut (améliorée légèrement)
  if (this.isModified('amountPaid') || this.isModified('totalTTC') || this.isNew || this.isModified('status') || this.isModified('dueDate')) {
    if (this.status !== 'CANCELLED' && this.status !== 'VOIDED') {
        const isFullyPaid = this.amountPaid >= this.totalTTC && this.totalTTC > 0;
        const isPartiallyPaid = this.amountPaid > 0 && this.amountPaid < this.totalTTC;
        const isOverdue = this.dueDate && new Date() > new Date(this.dueDate) && !isFullyPaid;

        if (isFullyPaid) {
            this.status = 'PAID';
        } else if (isPartiallyPaid) {
            this.status = 'PARTIALLY_PAID';
        } else if (this.status !== 'DRAFT' && isOverdue) { // Ne pas mettre un brouillon en 'OVERDUE'
            this.status = 'OVERDUE';
        } else if (this.amountPaid === 0 && this.status === 'PAID') { // Cas d'un paiement annulé sur une facture payée
            this.status = isOverdue ? 'OVERDUE' : (this.sentAt ? 'SENT' : 'DRAFT'); // Revenir à SENT si déjà envoyée, sinon DRAFT
        }
        // Si le statut est 'SENT' et qu'elle devient 'OVERDUE' par la date, on la met à jour.
        // Si elle est 'DRAFT', elle reste 'DRAFT' jusqu'à ce qu'elle soit envoyée.
    }
  }
  next();
});

InvoiceSchema.index({ client: 1 });
// L'index sur status est déjà défini par `index: true` dans le champ
InvoiceSchema.index({ issueDate: -1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ quote: 1 }, { sparse: true });
// L'index unique sur invoiceNumber est déjà défini par `unique: true` dans le champ

module.exports = mongoose.model('Invoice', InvoiceSchema);