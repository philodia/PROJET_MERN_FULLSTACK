// gestion-commerciale-app/backend/models/Client.model.js
const mongoose = require('mongoose');
const validator = require('validator'); // Pour la validation d'email, URL, etc.

const InteractionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  type: { // Ex: 'APPEL', 'EMAIL', 'REUNION', 'NOTE'
    type: String,
    required: [true, 'Le type d\'interaction est requis.'],
    trim: true,
  },
  summary: { // Résumé de l'interaction
    type: String,
    required: [true, 'Un résumé de l\'interaction est requis.'],
    trim: true,
  },
  documentType: { // Si l'interaction est liée à un document spécifique
    type: String,
    enum: ['Quote', 'Invoice', 'DeliveryNote', null], // Types de documents possibles
    default: null,
  },
  documentId: { // ID du document lié
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'history.documentType', // Référence dynamique basée sur documentType
    default: null,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true, // A décommenter une fois l'auth User bien en place
  },
}, { _id: false, timestamps: { createdAt: 'recordedAt', updatedAt: false } }); // Timestamps spécifiques pour l'interaction

const AddressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  additionalLine: { type: String, trim: true }, // Ex: Apt B2, Étage 3
  city: { type: String, trim: true, required: [true, 'La ville est requise pour une adresse.'] },
  zipCode: { type: String, trim: true, required: [true, 'Le code postal est requis pour une adresse.'] },
  stateOrProvince: { type: String, trim: true }, // État, province, région
  country: { type: String, trim: true, required: [true, 'Le pays est requis pour une adresse.'], default: 'France' },
}, { _id: false });


const ClientSchema = new mongoose.Schema(
  {
    // --- Informations Générales ---
    clientNumber: { // Numéro de client interne, peut être généré
        type: String,
        unique: true, // Définit un index unique sur ce champ
        sparse: true, // L'index unique ne s'applique que si le champ a une valeur (non-null)
        trim: true,
        // Vous pourriez vouloir une logique pour le générer automatiquement
    },
    companyName: {
      type: String,
      required: [true, 'Le nom de l\'entreprise ou du client est requis.'],
      trim: true,
      maxlength: [150, 'Le nom de l\'entreprise ne peut pas dépasser 150 caractères.'],
    },
    isCompany: { // Pour distinguer Particulier / Entreprise
      type: Boolean,
      default: true,
    },

    // --- Contact Principal ---
    contactTitle: { type: String, enum: ['M.', 'Mme.', 'Mlle.', ''], trim: true }, // Civilité
    contactFirstName: { type: String, trim: true },
    contactLastName: { type: String, trim: true },
    contactPosition: { type: String, trim: true }, // Poste du contact

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

    // --- Adresses ---
    billingAddress: {
      type: AddressSchema,
    },
    shippingAddress: {
      type: AddressSchema,
    },

    // --- Informations Légales et Financières ---
    siren: {
      type: String,
      trim: true,
    },
    siret: {
      type: String,
      trim: true,
    },
    vatNumber: {
      type: String,
      trim: true,
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: '30 jours net',
    },
    defaultVatRate: {
        type: Number,
        min: 0,
        max: 100,
    },
    currency: {
        type: String,
        default: 'EUR',
        uppercase: true,
        trim: true,
    },

    // --- Suivi et Classification ---
    status: {
      type: String,
      enum: ['PROSPECT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'LEAD'],
      default: 'ACTIVE',
    },
    category: {
      type: String,
      trim: true,
    },
    tags: [String],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // --- Historique et Notes ---
    history: [InteractionSchema],
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
ClientSchema.virtual('contactFullName').get(function() {
  let name = '';
  if (this.contactTitle) name += this.contactTitle + ' ';
  if (this.contactFirstName) name += this.contactFirstName + ' ';
  if (this.contactLastName) name += this.contactLastName;
  return name.trim() || null;
});

// --- INDEXES ---
// L'index unique pour `clientNumber` est déjà créé par `unique: true` dans la définition du champ.
// Pour la recherche textuelle, ne pas inclure `clientNumber` s'il a `unique:true`.
// Vous le rechercherez spécifiquement (exact ou regex) en plus de la recherche $text.
ClientSchema.index({
  companyName: 'text',
  email: 'text',
  contactFirstName: 'text',
  contactLastName: 'text',
  siren: 'text',
  vatNumber: 'text',
  // N'incluez PAS 'clientNumber: text' ici si clientNumber a unique:true ci-dessus.
});

// ClientSchema.index({ clientNumber: 1 }, { unique: true, sparse: true }); // SUPPRIMÉ car redondant avec `unique: true` sur le champ

ClientSchema.index({ status: 1 });
ClientSchema.index({ assignedTo: 1 });
ClientSchema.index({ createdAt: -1 }); // Utile pour trier par les plus récents par défaut


// --- MIDDLEWARE / HOOKS ---
// Le hook pre('save') pour générer clientNumber est commenté.
// Si vous l'activez, assurez-vous d'utiliser une méthode robuste
// comme celle de `utils/generateNumber.js` avec le modèle `Sequence`.
// ClientSchema.pre('save', async function(next) {
//   if (this.isNew && !this.clientNumber) {
//     try {
//       // Exemple d'utilisation de la fonction utilitaire si vous l'importez
//       // const { generateDocumentNumber } = require('../utils/generateNumber');
//       // this.clientNumber = await generateDocumentNumber('CLIENT', 'CLI', 5);
//     } catch (error) {
//       // Gérer l'erreur, peut-être en ne bloquant pas la sauvegarde
//       // ou en la passant à next(error) si c'est critique
//       console.error("Erreur de génération auto du clientNumber:", error);
//     }
//   }
//   next();
// });

module.exports = mongoose.model('Client', ClientSchema);