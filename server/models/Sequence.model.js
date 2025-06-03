// gestion-commerciale-app/backend/models/Sequence.model.js
const mongoose = require('mongoose');

/**
 * Schéma pour stocker les séquences de numérotation des documents.
 * Chaque document dans cette collection représente un compteur pour un type de document spécifique
 * (par exemple, factures, devis, bons de livraison).
 */
const SequenceSchema = new mongoose.Schema({
  /**
   * L'identifiant unique du type de document pour lequel cette séquence est utilisée.
   * Exemples: 'invoice', 'quote', 'deliverynote', 'product_sku', etc.
   * Ce champ est utilisé comme clé primaire (_id) pour faciliter les recherches atomiques.
   */
  _id: {
    type: String,
    required: [true, 'L\'identifiant du type de séquence est requis.'],
    trim: true,
    // unique: true, // Est implicitement unique car c'est _id
  },

  /**
   * Le dernier numéro de séquence utilisé pour ce type de document.
   * Lors de la génération d'un nouveau numéro, cette valeur est incrémentée.
   * La valeur initiale est 0, donc la première séquence générée sera 1.
   */
  seq: {
    type: Number,
    default: 0,
    min: [0, 'La valeur de la séquence ne peut pas être négative.'],
  },

  /**
   * Une description optionnelle de ce que représente cette séquence.
   * Utile pour la documentation et la compréhension.
   */
  description: {
    type: String,
    trim: true,
  },

  /**
   * Optionnel: Préfixe à utiliser lors de la génération de numéros pour cette séquence.
   * Stocker ici peut être une alternative à le passer en argument de la fonction de génération
   * si le préfixe est toujours le même pour un type de document.
   */
  // prefix: {
  //   type: String,
  //   trim: true,
  // },

  /**
   * Optionnel: Padding (nombre de zéros à gauche) à utiliser pour cette séquence.
   */
  // padding: {
  //   type: Number,
  //   default: 4,
  //   min: 1
  // }

}, {
  // Désactiver les timestamps pour ce modèle car ils ne sont généralement pas pertinents pour les séquences.
  // Si vous souhaitez savoir quand une séquence a été créée ou modifiée pour la dernière fois, vous pouvez les activer.
  timestamps: false, // Ou true si vous en avez besoin

  // Collection name (optionnel, Mongoose le déduit du nom du modèle en le mettant au pluriel et en minuscules: 'sequences')
  // collection: 'sequences'
});

// Optionnel: Ajouter un index sur seq si vous faites des requêtes basées sur la valeur de la séquence,
// bien que la recherche principale se fasse sur _id.
// SequenceSchema.index({ seq: 1 });

module.exports = mongoose.model('Sequence', SequenceSchema);