// gestion-commerciale-app/backend/utils/generateNumber.js

const Sequence = require('../models/Sequence.model'); // Modèle pour stocker les séquences

/**
 * Génère un numéro de document séquentiel et formaté pour un type de document donné.
 * S'appuie sur un modèle MongoDB `Sequence` pour suivre le dernier numéro utilisé.
 *
 * @param {string} documentType - Le type de document (ex: 'INV' pour facture, 'QUO' pour devis, 'DLN' pour bon de livraison).
 * @param {string} [prefix=''] - Un préfixe optionnel à ajouter avant le numéro (ex: 'F' pour Facture).
 * @param {number} [padding=4] - Le nombre de chiffres pour le numéro séquentiel (ex: 4 pour 0001, 0002).
 * @returns {Promise<string>} Une promesse qui se résout avec le numéro de document formaté.
 * @throws {Error} Si le type de document n'est pas fourni ou si une erreur se produit.
 */
async function generateDocumentNumber(documentType, prefix = '', padding = 4) {
  if (!documentType) {
    throw new Error('Le type de document est requis pour générer un numéro.');
  }

  try {
    // Utiliser findOneAndUpdate pour une opération atomique d'incrémentation.
    // 'upsert: true' crée le document de séquence s'il n'existe pas.
    // 'new: true' retourne le document modifié.
    // '$inc: { seq: 1 }' incrémente la séquence de 1.
    const sequenceDocument = await Sequence.findOneAndUpdate(
      { _id: documentType.toLowerCase() }, // Utiliser le type de document comme ID (en minuscules pour la cohérence)
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!sequenceDocument) {
      // Cela ne devrait pas arriver avec upsert: true, mais c'est une sécurité.
      throw new Error(`Impossible de créer ou de trouver la séquence pour le type: ${documentType}`);
    }

    const sequenceNumber = sequenceDocument.seq;
    const paddedNumber = String(sequenceNumber).padStart(padding, '0');

    // Optionnel: Ajouter l'année ou l'année/mois au numéro
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // YY
    // const month = String(now.getMonth() + 1).padStart(2, '0'); // MM

    // Format exemple: F-INV-23-0001 (Préfixe-Type-Année-Numéro)
    // Adaptez ce format à vos besoins.
    // return `${prefix}${prefix ? '-' : ''}${documentType.toUpperCase()}-${year}-${paddedNumber}`;
    // Format plus simple: INV230001 (TypeAnnéeNuméro)
    return `${documentType.toUpperCase()}${year}${paddedNumber}`;
    // Ou juste Préfixe + Numéro: F0001
    // return `${prefix}${paddedNumber}`;

  } catch (error) {
    console.error(`Erreur lors de la génération du numéro de document pour ${documentType}:`, error);
    // Renvoyer une erreur plus générique pour éviter de fuiter des détails d'implémentation.
    throw new Error('Erreur interne lors de la génération du numéro de document.');
  }
}

/**
 * Réinitialise une séquence à une valeur donnée (utile pour les tests ou des besoins spécifiques).
 * ATTENTION: À utiliser avec prudence en production.
 * @param {string} documentType - Le type de document dont la séquence doit être réinitialisée.
 * @param {number} [value=0] - La valeur à laquelle la séquence sera réinitialisée.
 * @returns {Promise<object>} Le document de séquence mis à jour.
 */
async function resetSequence(documentType, value = 0) {
  if (!documentType) {
    throw new Error('Le type de document est requis pour réinitialiser la séquence.');
  }
  try {
    const sequenceDocument = await Sequence.findOneAndUpdate(
      { _id: documentType.toLowerCase() },
      { $set: { seq: value } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`Séquence pour '${documentType}' réinitialisée à ${value}.`);
    return sequenceDocument;
  } catch (error) {
    console.error(`Erreur lors de la réinitialisation de la séquence pour ${documentType}:`, error);
    throw new Error('Erreur interne lors de la réinitialisation de la séquence.');
  }
}


module.exports = {
  generateDocumentNumber,
  resetSequence, // Exporter pour des cas d'usage spécifiques (tests, admin)
};