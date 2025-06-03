// gestion-commerciale-app/backend/models/JournalEntry.model.js
const mongoose = require('mongoose');

/**
 * Sous-schéma pour chaque ligne d'une écriture de journal.
 * Une écriture de journal doit toujours être équilibrée (Total Débits = Total Crédits).
 */
const JournalEntryLineSchema = new mongoose.Schema({
  account: { // Référence au compte du Plan Comptable
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccounts',
    required: [true, 'Un compte est requis pour chaque ligne d\'écriture.'],
  },
  accountNumber: { // Stocker le numéro de compte pour référence rapide (optionnel)
    type: String,
    // required: true, // Pourrait être rempli par un hook si besoin
    trim: true,
  },
  accountName: { // Stocker le nom du compte pour référence rapide (optionnel)
      type: String,
      // required: true,
      trim: true,
  },
  description: { // Description spécifique à cette ligne d'écriture
    type: String,
    trim: true,
    maxlength: [500, 'La description de la ligne ne peut pas dépasser 500 caractères.'],
  },
  debit: {
    type: Number,
    default: 0,
    min: [0, 'Le montant au débit ne peut pas être négatif.'],
    validate: {
        validator: function(value) {
            // Si débit > 0, alors crédit doit être 0 (ou null/undefined)
            return !(value > 0 && this.credit > 0);
        },
        message: 'Une ligne ne peut pas avoir à la fois un débit et un crédit positifs.'
    }
  },
  credit: {
    type: Number,
    default: 0,
    min: [0, 'Le montant au crédit ne peut pas être négatif.'],
    // La validation de l'exclusivité débit/crédit est gérée dans le validateur de 'debit'
  },
  // Optionnel: Pour lier à une entité spécifique si la ligne concerne un client/fournisseur/employé
  // entityType: { type: String, enum: ['Client', 'Supplier', 'Employee', null], default: null },
  // entityId: { type: mongoose.Schema.Types.ObjectId, refPath: 'lines.entityType', default: null },
}, { _id: false }); // _id: false pour ne pas créer d'ID pour chaque sous-document de ligne

const JournalEntrySchema = new mongoose.Schema(
  {
    entryNumber: { // Numéro d'écriture de journal (peut être généré séquentiellement)
      type: String,
      unique: true,
      sparse: true, // Permet null si non unique, mais si présent, doit être unique
      trim: true,
    },
    date: { // Date de la transaction/écriture
      type: Date,
      default: Date.now,
      required: [true, 'La date de l\'écriture est requise.'],
      index: true,
    },
    description: { // Description générale de l'écriture de journal
      type: String,
      required: [true, 'Une description générale pour l\'écriture est requise.'],
      trim: true,
      maxlength: [1000, 'La description générale ne peut pas dépasser 1000 caractères.'],
    },
    lines: {
      type: [JournalEntryLineSchema],
      required: true,
      validate: [
        {
          validator: function(linesArray) {
            return linesArray.length >= 2; // Au moins deux lignes (un débit, un crédit)
          },
          message: 'Une écriture de journal doit contenir au moins deux lignes.',
        },
        {
          validator: function(linesArray) {
            // Vérifier l'équilibre Débit = Crédit
            const totalDebit = linesArray.reduce((sum, line) => sum + (line.debit || 0), 0);
            const totalCredit = linesArray.reduce((sum, line) => sum + (line.credit || 0), 0);
            // Permettre une petite tolérance pour les erreurs de virgule flottante
            return Math.abs(totalDebit - totalCredit) < 0.001; // Tolérance de 0.001
          },
          message: props => `L'écriture de journal n'est pas équilibrée. Total Débits: ${props.value.reduce((s,l)=>s+(l.debit||0),0)}, Total Crédits: ${props.value.reduce((s,l)=>s+(l.credit||0),0)}`,
        }
      ],
    },
    transactionType: {
      // Type de transaction pour catégorisation (Vente, Achat, Paiement, Écriture Manuelle, etc.)
      type: String,
      required: [true, 'Le type de transaction est requis.'],
      enum: ['SALE', 'PURCHASE', 'PAYMENT_RECEIVED', 'PAYMENT_MADE', 'MANUAL_JOURNAL', 'STOCK_ADJUSTMENT', 'VAT_DECLARATION', 'SALARY', 'OTHER'],
      index: true,
    },
    // Pour lier l'écriture à un document source (Facture, Reçu de Paiement, etc.)
    relatedDocumentType: {
      type: String,
      enum: ['Invoice', 'SupplierInvoice', 'PaymentReceipt', 'DeliveryNote', 'Quote', 'PurchaseOrder', 'BankStatement', null],
      default: null,
    },
    relatedDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedDocumentType', // Référence dynamique basée sur relatedDocumentType
      default: null,
    },
    // Optionnel: Statut de l'écriture (ex: Brouillon, Validée, Annulée)
    // status: {
    //   type: String,
    //   enum: ['DRAFT', 'POSTED', 'CANCELLED'],
    //   default: 'POSTED',
    //   required: true
    // },
    currency: {
        type: String,
        default: 'EUR',
        uppercase: true,
        trim: true,
    },
    // Suivi
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // updatedBy: { // Les écritures comptables ne devraient idéalement pas être modifiées, mais plutôt contre-passées.
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
  },
  {
    timestamps: { createdAt: 'postedAt', updatedAt: false }, // `postedAt` pour la date de création de l'écriture en DB. Pas d'updatedAt par principe.
  }
);

// --- HOOKS / MIDDLEWARE MONGOOSE ---

// Générer entryNumber avant la sauvegarde si non fourni
JournalEntrySchema.pre('validate', async function (next) {
  if (this.isNew && !this.entryNumber) {
    try {
      const { generateDocumentNumber } = require('../utils/generateNumber'); // Assurer l'import
      this.entryNumber = await generateDocumentNumber('JRN', 'EJ', 7); // Ex: EJ230000001
    } catch (error) {
      console.error("Erreur de génération auto du entryNumber:", error);
      return next(new Error('Impossible de générer le numéro d\'écriture de journal.'));
    }
  }

  // Optionnel: Remplir accountNumber et accountName dans les lignes avant la sauvegarde
  // pour éviter des populate constants lors de la lecture.
  // Cela dénormalise les données mais peut améliorer les performances de lecture.
  // if (this.isModified('lines') || this.isNew) {
  //   const ChartOfAccounts = mongoose.model('ChartOfAccounts');
  //   for (const line of this.lines) {
  //     if (line.isModified('account') && !line.accountNumber && !line.accountName) {
  //       const accountDoc = await ChartOfAccounts.findById(line.account).select('accountNumber accountName');
  //       if (accountDoc) {
  //         line.accountNumber = accountDoc.accountNumber;
  //         line.accountName = accountDoc.accountName;
  //       }
  //     }
  //   }
  // }

  next();
});

// --- INDEXES ---
JournalEntrySchema.index({ relatedDocumentType: 1, relatedDocumentId: 1 }, { sparse: true });
JournalEntrySchema.index({ transactionType: 1, date: -1 });
// L'index unique sur entryNumber est créé par `unique: true` (avec `sparse: true`).

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);