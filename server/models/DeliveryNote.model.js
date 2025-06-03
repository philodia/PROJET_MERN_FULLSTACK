// gestion-commerciale-app/backend/models/DeliveryNote.model.js
const mongoose = require('mongoose');
const { generateDocumentNumber } = require('../utils/generateNumber'); // Pour la numérotation

// Sous-schéma pour les lignes d'articles du bon de livraison
const DeliveryNoteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, "Une référence produit est requise pour chaque article."],
  },
  productName: { // Nom du produit au moment de la création du BL (snapshot)
    type: String,
    required: [true, "Le nom du produit est requis pour chaque article."],
    trim: true,
  },
  description: { // Description spécifique (peut différer du produit ou du devis)
    type: String,
    trim: true,
  },
  quantityOrdered: { // Quantité commandée initialement (peut venir du devis/commande)
    type: Number,
    min: [0, 'La quantité commandée ne peut pas être négative.'], // Rendre optionnel ou requis selon le flux
  },
  quantityDelivered: { // Quantité effectivement livrée
    type: Number,
    required: [true, 'La quantité livrée est requise pour chaque article.'],
    min: [0, 'La quantité livrée ne peut pas être négative.'],
    validate: [
      {
        validator: function(value) {
            // La quantité livrée ne doit pas dépasser la quantité commandée si celle-ci est définie et non nulle
            return this.quantityOrdered === undefined || this.quantityOrdered === null || value <= this.quantityOrdered;
        },
        message: props => `La quantité livrée (${props.value}) ne peut pas dépasser la quantité commandée (${this.quantityOrdered || 'N/A'}).`
      },
      {
        validator: Number.isFinite, // S'assurer que c'est un nombre fini
        message: 'La quantité livrée doit être un nombre valide.'
      }
    ]
  },
  unitOfMeasure: { // Unité de mesure stockée pour information
    type: String,
    trim: true,
  },
  // serialNumbers: [String], // Si vous gérez des numéros de série
  // batchNumbers: [String], // Si vous gérez des numéros de lot
}, { _id: false });

const DeliveryNoteSchema = new mongoose.Schema(
  {
    deliveryNoteNumber: {
      type: String,
      required: [true, 'Le numéro du bon de livraison est requis.'],
      unique: true, // Crée automatiquement un index unique
      trim: true,
      uppercase: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Un client est requis pour le bon de livraison.'],
      index: true, // Indexer pour des recherches par client
    },
    clientSnapshot: {
        companyName: String,
        contactFullName: String,
        shippingAddress: { // Adresse de livraison spécifique pour ce BL
            street: String,
            additionalLine: String,
            city: String,
            zipCode: String,
            stateOrProvince: String,
            country: String,
        }
    },
    deliveryDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true, // Indexer pour tri/recherche par date de livraison
    },
    status: {
      type: String,
      enum: ['PENDING_PREPARATION', 'READY_TO_SHIP', 'SHIPPED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED', 'RETURNED'],
      default: 'PENDING_PREPARATION',
      required: true,
      index: true, // Indexer pour des recherches par statut
    },
    items: [DeliveryNoteItemSchema],
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null,
      index: true, // Indexer si vous filtrez souvent par devis source (sparse sera implicite si default est null)
    },
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: 'SalesOrder',
      default: null,
      // index: true, // Si vous l'utilisez et filtrez dessus
    },
    shippingMethod: { type: String, trim: true },
    trackingNumber: { type: String, trim: true, index: true }, // Indexer si vous recherchez par numéro de suivi
    carrier: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    customerNotes: { type: String, trim: true },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        default: null,
        index: true, // Indexer si vous liez/recherchez par facture
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- HOOKS / MIDDLEWARE MONGOOSE ---
DeliveryNoteSchema.pre('validate', async function (next) {
  if (this.isNew && !this.deliveryNoteNumber) {
    try {
      this.deliveryNoteNumber = await generateDocumentNumber('DLN', 'BL', 6);
    } catch (error) {
      console.error("Erreur de génération auto du deliveryNoteNumber:", error);
      return next(new Error('Impossible de générer le numéro du bon de livraison.'));
    }
  }

  // S'assurer que les items ont une quantité livrée > 0 si le statut n'est pas PENDING_PREPARATION ou CANCELLED
  if (!['PENDING_PREPARATION', 'CANCELLED'].includes(this.status)) {
      for (const item of this.items) {
          if (item.quantityDelivered <= 0) {
              return next(new Error(`Pour le statut '${this.status}', la quantité livrée de '${item.productName}' doit être supérieure à 0.`));
          }
      }
  }
  next();
});


// --- INDEXES ---
// Les indexes sur deliveryNoteNumber (unique), client, deliveryDate, status, quote, invoiceId, trackingNumber
// sont définis directement dans les champs via `unique: true` ou `index: true`.
// Aucun besoin de redéfinir `DeliveryNoteSchema.index({ status: 1 });` ici.

module.exports = mongoose.model('DeliveryNote', DeliveryNoteSchema);