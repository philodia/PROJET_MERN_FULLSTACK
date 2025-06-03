// gestion-commerciale-app/backend/models/Supplier.model.js
const mongoose = require('mongoose');
const validator = require('validator');

// Réutiliser les sous-schémas d'Adresse et d'Interaction si la structure est similaire
// Sinon, les redéfinir ou les adapter spécifiquement pour les fournisseurs.
// Pour cet exemple, nous supposons qu'ils peuvent être réutilisés ou légèrement adaptés.

const InteractionSchema = new mongoose.Schema({ // Même structure que pour Client, ou adaptée
  date: { type: Date, default: Date.now },
  type: { type: String, required: true, trim: true }, // Ex: 'COMMANDE', 'EMAIL_SUIVI', 'PROBLEME_LIVRAISON'
  summary: { type: String, required: true, trim: true },
  relatedDocumentId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Ex: ID bon de commande fournisseur
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false, timestamps: { createdAt: 'recordedAt', updatedAt: false } });

const AddressSchema = new mongoose.Schema({ // Même structure que pour Client
  street: { type: String, trim: true },
  additionalLine: { type: String, trim: true },
  city: { type: String, trim: true, required: true },
  zipCode: { type: String, trim: true, required: true },
  stateOrProvince: { type: String, trim: true },
  country: { type: String, trim: true, required: true, default: 'France' },
}, { _id: false });


const SupplierSchema = new mongoose.Schema(
  {
    // --- Informations Générales ---
    supplierNumber: { // Numéro de fournisseur interne
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Le nom de l\'entreprise du fournisseur est requis.'],
      trim: true,
      maxlength: [150, 'Le nom de l\'entreprise ne peut pas dépasser 150 caractères.'],
    },

    // --- Contact Principal ---
    contactTitle: { type: String, enum: ['M.', 'Mme.', 'Mlle.', ''], trim: true },
    contactFirstName: { type: String, trim: true },
    contactLastName: { type: String, trim: true },
    contactPosition: { type: String, trim: true },

    // --- Coordonnées ---
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return v == null || v.trim() === '' || validator.isEmail(v);
        },
        message: 'Veuillez fournir une adresse email valide.',
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return v == null || v.trim() === '' || validator.isURL(v);
        },
        message: 'Veuillez fournir une URL de site web valide.',
      },
    },

    // --- Adresse ---
    address: {
      type: AddressSchema,
      // required: true, // L'adresse est souvent requise pour un fournisseur
    },

    // --- Informations Légales et Financières ---
    siren: {
      type: String,
      trim: true,
    },
    vatNumber: {
      type: String,
      trim: true,
    },
    bankDetails: { // Pour les paiements aux fournisseurs
      iban: { type: String, trim: true },
      bic: { type: String, trim: true },
      bankName: { type: String, trim: true },
    },
    paymentTerms: { // Conditions de paiement accordées par ce fournisseur
      type: String,
      trim: true,
      default: 'À réception', // Exemple
    },
    currency: { // Devise préférée pour les transactions avec ce fournisseur
        type: String,
        default: 'EUR',
        uppercase: true,
        trim: true,
    },

    // --- Suivi et Classification ---
    status: { // Statut du fournisseur (ex: Actif, Inactif, En évaluation)
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'EVALUATION', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    category: { // Type de produits/services fournis
      type: String,
      trim: true,
    },
    tags: [String],
    // minOrderAmount: Number, // Montant minimum de commande
    // leadTimeDays: Number, // Délai de livraison moyen en jours

    // --- Historique et Notes ---
    // L'historique pourrait inclure les commandes passées, les livraisons, etc.
    // Ceci serait mieux géré par des références dans des modèles 'PurchaseOrder', 'SupplierDeliveryNote'.
    // Pour les interactions générales, on peut utiliser le InteractionSchema.
    interactions: [InteractionSchema],
    internalNotes: {
      type: String,
      trim: true,
    },

    // --- Gestionnaire de la création ---
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- VIRTUALS ---
SupplierSchema.virtual('contactFullName').get(function() {
  let name = '';
  if (this.contactTitle) name += this.contactTitle + ' ';
  if (this.contactFirstName) name += this.contactFirstName + ' ';
  if (this.contactLastName) name += this.contactLastName;
  return name.trim() || null;
});

// Virtual pour lier aux produits (si un fournisseur est le principal pour certains produits)
// SupplierSchema.virtual('products', {
//   ref: 'Product',
//   localField: '_id',
//   foreignField: 'supplier' // Supposant un champ 'supplier' dans le modèle Product
// });


// --- INDEXES ---
// L'index unique pour `supplierNumber` est créé par `unique: true` dans la définition du champ.
SupplierSchema.index({
  companyName: 'text',
  email: 'text',
  contactLastName: 'text',
  siren: 'text',
  vatNumber: 'text'
  // Ne pas inclure 'supplierNumber: text' ici si supplierNumber a unique:true
});

SupplierSchema.index({ status: 1 });
SupplierSchema.index({ category: 1 });
SupplierSchema.index({ createdAt: -1 });


// --- MIDDLEWARE / HOOKS ---
// Générer un supplierNumber si non fourni (similaire au Client)
// SupplierSchema.pre('save', async function(next) {
//   if (this.isNew && !this.supplierNumber) {
//     // Utiliser utils/generateNumber.js avec le modèle Sequence
//     // try {
//     //   const { generateDocumentNumber } = require('../utils/generateNumber'); // Nécessiterait un import en haut du fichier
//     //   this.supplierNumber = await generateDocumentNumber('SUPPLIER', 'FOUR', 5);
//     // } catch (error) {
//     //   console.error("Erreur de génération auto du supplierNumber:", error);
//     // }
//   }
//   next();
// });

module.exports = mongoose.model('Supplier', SupplierSchema);