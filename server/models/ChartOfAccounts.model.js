// gestion-commerciale-app/backend/models/ChartOfAccounts.model.js
const mongoose = require('mongoose');

/**
 * Schéma pour le Plan Comptable Général (PCG).
 * Chaque document représente un compte individuel du plan comptable.
 */
const ChartOfAccountsSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: [true, 'Le numéro de compte est requis.'],
      unique: true, // Chaque numéro de compte doit être unique
      trim: true,
      // Exemple de validation de format (à adapter selon la structure de votre PCG)
      // match: [/^\d{3,}$/, 'Le numéro de compte doit contenir au moins 3 chiffres.'],
    },
    accountName: {
      type: String,
      required: [true, 'Le nom du compte est requis.'],
      trim: true,
      maxlength: [200, 'Le nom du compte ne peut pas dépasser 200 caractères.'],
    },
    type: {
      // Type de compte principal pour la classification dans les états financiers
      type: String,
      required: [true, 'Le type de compte est requis.'],
      enum: {
        values: [
          'ASSET',      // Actif (Classes 1 à 5, ex: Immobilisations, Stocks, Créances, Trésorerie)
          'LIABILITY',  // Passif (Classes 1, 4, 5, ex: Capitaux propres, Dettes financières, Dettes fournisseurs)
          'EQUITY',     // Capitaux Propres (Classe 1, ex: Capital social, Réserves, Résultat de l'exercice)
          'REVENUE',    // Produits (Classe 7, ex: Ventes de marchandises, Prestations de services, Produits financiers)
          'EXPENSE',    // Charges (Classe 6, ex: Achats, Services extérieurs, Charges de personnel, Charges financières)
          'OTHER'       // Autre (pour des cas spécifiques ou des comptes hors bilan temporaires)
        ],
        message: 'Le type de compte "{VALUE}" n\'est pas supporté.',
      },
    },
    subType: {
      // Sous-type plus granulaire (optionnel, dépend de vos besoins de reporting)
      type: String,
      trim: true,
      // Exemples: 'CURRENT_ASSET', 'NON_CURRENT_ASSET', 'CURRENT_LIABILITY', 'OPERATING_EXPENSE', 'FINANCIAL_REVENUE'
    },
    description: {
      // Description détaillée de l'utilisation ou de la nature du compte
      type: String,
      trim: true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères.'],
    },
    isControlAccount: {
      // Indique si c'est un compte de contrôle (généralement non utilisé directement dans les écritures)
      // ou un compte de détail utilisable.
      type: Boolean,
      default: false, // Par défaut, un compte est utilisable
    },
    isTaxRelated: {
      // Indique si le compte est lié à la TVA ou à d'autres taxes
      type: Boolean,
      default: false,
    },
    // Pour les comptes de bilan (Actif, Passif, Capitaux Propres)
    normalBalance: {
      // Solde normal du compte (Débit ou Crédit)
      type: String,
      enum: ['DEBIT', 'CREDIT', null], // null si non applicable (ex: comptes de résultat)
      default: null,
      // Ce champ est informatif ou peut être utilisé pour des validations avancées.
      // Pour les comptes d'Actif et de Charges, le solde normal est Débit.
      // Pour les comptes de Passif, Capitaux Propres et Produits, le solde normal est Crédit.
    },
    // Optionnel: Pour lier à un compte parent dans une structure hiérarchique
    // parentAccount: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'ChartOfAccounts',
    //   default: null,
    // },
    isActive: {
      // Si le compte est actuellement utilisable
      type: Boolean,
      default: true,
    },
    // Optionnel: Informations pour le reporting ou l'intégration
    // reportMapping: {
    //   balanceSheetLine: String, // Ligne du bilan
    //   incomeStatementLine: String, // Ligne du compte de résultat
    // }
  },
  {
    timestamps: true, // Pour savoir quand un compte a été ajouté ou modifié
  }
);

// --- INDEXES ---
// L'index unique sur accountNumber est créé par `unique: true`.
ChartOfAccountsSchema.index({ accountName: 'text', description: 'text' }); // Pour la recherche textuelle
ChartOfAccountsSchema.index({ type: 1 });
ChartOfAccountsSchema.index({ isActive: 1 });

// --- HOOKS / MIDDLEWARE (Optionnel) ---
// Par exemple, pour s'assurer que le accountNumber est formaté d'une certaine manière
// ChartOfAccountsSchema.pre('save', function(next) {
//   if (this.isModified('accountNumber')) {
//     // Logique de formatage ou de validation avancée
//   }
//   next();
// });

module.exports = mongoose.model('ChartOfAccounts', ChartOfAccountsSchema);