// gestion-commerciale-app/backend/models/Product.model.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    // --- Informations de Base ---
    name: {
      type: String,
      required: [true, 'Le nom du produit ou service est requis.'],
      trim: true,
      unique: true, // S'assurer que les noms de produits sont uniques
      maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères.'],
    },
    sku: { // Stock Keeping Unit - Référence unique interne
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Permet null si non unique, mais si présent, doit être unique
      uppercase: true,
      // Vous pourriez vouloir une logique pour le générer automatiquement
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères.'],
    },
    category: { // Catégorie du produit/service
      type: String,
      trim: true,
      // Vous pourriez vouloir une référence à un modèle 'Category' si les catégories sont complexes
      // type: mongoose.Schema.Types.ObjectId,
      // ref: 'Category',
    },
    tags: [String], // Tags pour une classification flexible

    // --- Tarification ---
    unitPriceHT: { // Prix Unitaire Hors Taxe
      type: Number,
      required: [true, 'Le prix unitaire HT est requis.'],
      min: [0, 'Le prix unitaire ne peut pas être négatif.'],
    },
    vatRate: { // Taux de TVA applicable en pourcentage (ex: 20 pour 20%)
      type: Number,
      required: [true, 'Le taux de TVA est requis.'],
      default: 20, // Taux de TVA par défaut
      min: [0, 'Le taux de TVA ne peut pas être négatif.'],
      max: [100, 'Le taux de TVA ne peut pas dépasser 100.'],
    },
    // Le prix TTC peut être un virtual ou calculé à la volée
    currency: {
        type: String,
        default: 'EUR',
        uppercase: true,
        trim: true,
    },

    // --- Gestion des Stocks (si ce n'est pas un service) ---
    isService: { // Booléen pour distinguer un produit physique d'un service
      type: Boolean,
      default: false,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'La quantité en stock ne peut pas être négative.'],
      // Ce champ ne s'applique que si isService est false
      validate: {
        validator: function(value) {
          // La quantité en stock n'est pertinente que si ce n'est pas un service
          return this.isService ? true : value >= 0;
        },
        message: 'La quantité en stock doit être positive ou nulle pour un produit physique.'
      }
    },
    criticalStockThreshold: { // Seuil de stock critique pour les alertes
      type: Number,
      default: 10,
      min: [0, 'Le seuil de stock critique ne peut pas être négatif.'],
      validate: {
        validator: function(value) {
          return this.isService ? true : value >= 0;
        },
        message: 'Le seuil de stock critique est applicable uniquement aux produits physiques.'
      }
    },
    unitOfMeasure: { // Unité de mesure (ex: 'pièce', 'kg', 'litre', 'heure')
        type: String,
        trim: true,
        default: function() { return this.isService ? 'heure' : 'pièce'; }
    },

    // --- Fournisseur (optionnel, si un fournisseur principal est associé) ---
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    supplierProductCode: { // Référence produit chez le fournisseur
        type: String,
        trim: true,
    },
    purchasePriceHT: { // Prix d'achat HT (pour calcul de marge)
        type: Number,
        min: [0, 'Le prix d\'achat ne peut pas être négatif.'],
        default: null,
    },

    // --- Statut et Visibilité ---
    isActive: { // Si le produit/service est actuellement actif/disponible à la vente
      type: Boolean,
      default: true,
    },
    // isFeatured: Boolean, // Pour mettre en avant certains produits

    // --- Images (exemple simple, pour une gestion avancée, utiliser des services cloud) ---
    // images: [{
    //   url: String,
    //   altText: String,
    //   isPrimary: Boolean
    // }],
    imageUrl: { // URL d'une image principale
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
              return v == null || v.trim() === '' || validator.isURL(v);
            },
            message: 'Veuillez fournir une URL d\'image valide.',
        }
    },

    // --- Gestionnaire de la création ---
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true, // À décommenter une fois l'auth User bien en place
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
// Prix Unitaire TTC (calculé)
ProductSchema.virtual('unitPriceTTC').get(function() {
  if (typeof this.unitPriceHT === 'number' && typeof this.vatRate === 'number') {
    return this.unitPriceHT * (1 + this.vatRate / 100);
  }
  return null;
});

// Marge brute (si prix d'achat connu)
ProductSchema.virtual('grossMargin').get(function() {
  if (typeof this.unitPriceHT === 'number' && typeof this.purchasePriceHT === 'number' && this.purchasePriceHT > 0) {
    return ((this.unitPriceHT - this.purchasePriceHT) / this.purchasePriceHT) * 100;
  }
  return null; // Ou 0 si vous préférez
});

ProductSchema.virtual('isLowStock').get(function() {
    if (this.isService) return false; // Non applicable aux services
    return this.stockQuantity <= this.criticalStockThreshold;
});


// --- INDEXES ---
// L'index unique pour `name` et `sku` est créé par `unique: true` dans la définition du champ.
ProductSchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
  tags: 'text'
  // Ne pas inclure 'sku: text' ici si sku a unique:true
});
ProductSchema.index({ category: 1 });
ProductSchema.index({ supplier: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ createdAt: -1 });
// Index conditionnel pour la gestion des stocks uniquement sur les produits non-services
ProductSchema.index({ stockQuantity: 1 }, { partialFilterExpression: { isService: false } });
ProductSchema.index({ isLowStock: 1 }, { partialFilterExpression: { isService: false } }); // Si vous filtrez souvent sur ce virtuel et qu'il est simple


// --- MIDDLEWARE / HOOKS ---
// Générer un SKU si non fourni (exemple simple)
// ProductSchema.pre('save', async function(next) {
//   if (this.isNew && !this.sku && !this.isService) {
//     // Utiliser utils/generateNumber.js avec le modèle Sequence
//     // try {
//     //   const { generateDocumentNumber } = require('../utils/generateNumber');
//     //   this.sku = await generateDocumentNumber('PRODUCT_SKU', 'SKU', 6);
//     // } catch (error) {
//     //   console.error("Erreur de génération auto du SKU:", error);
//     // }
//   }
//   next();
// });

// S'assurer que les champs de stock sont nuls ou par défaut si c'est un service
ProductSchema.pre('save', function(next) {
  if (this.isService) {
    this.stockQuantity = 0; // Ou undefined/null selon votre préférence de gestion
    this.criticalStockThreshold = 0; // Ou undefined/null
    // this.unitOfMeasure = 'heure'; // Ou une autre unité par défaut pour les services
  }
  next();
});


module.exports = mongoose.model('Product', ProductSchema);