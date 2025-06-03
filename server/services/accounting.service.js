// gestion-commerciale-app/backend/services/accounting.service.js

const JournalEntry = require('../models/JournalEntry.model');
const ChartOfAccounts = require('../models/ChartOfAccounts.model'); // Pour récupérer les numéros de compte
// const config = require('../config'); // Si vous avez des comptes par défaut dans la config

/**
 * Service pour gérer la logique comptable, notamment la création d'écritures de journal.
 */
class AccountingService {
  /**
   * Crée les écritures de journal pour une facture de vente validée.
   * @param {object} invoice - L'objet facture (document Mongoose).
   * @param {string} userId - L'ID de l'utilisateur effectuant l'action.
   * @returns {Promise<object>} L'écriture de journal créée.
   * @throws {Error} Si des comptes requis ne sont pas trouvés ou si la création échoue.
   */
  static async recordSaleInvoice(invoice, userId) {
    if (!invoice || invoice.status !== 'PAID') { // Ou 'SENT' si vous enregistrez avant paiement
      // console.warn(`Tentative d'enregistrement d'une facture non valide ou non payée: ${invoice?._id}, statut: ${invoice?.status}`);
      // return null; // Ou lancer une erreur si c'est un flux critique
      // Pour cet exemple, on suppose que la facture est valide pour l'enregistrement comptable.
      // La logique de quand enregistrer (SENT, PAID) dépend de vos règles comptables (TVA sur débit/encaissement).
    }

    // --- Récupérer les comptes nécessaires du plan comptable ---
    // Les numéros de compte sont des exemples, adaptez-les à votre plan comptable.
    const accounts = await this._getRequiredAccounts({
      clients: '411000',         // Compte clients
      salesRevenue: '707000',    // Compte de produits des ventes (marchandises) ou 706xxx pour services
      vatCollected: '445710',    // Compte TVA collectée
      // bank: '512000'          // Compte banque (pour l'écriture de paiement si gérée ici)
    });

    const journalEntryLines = [
      // Débit: Compte Client (411xxx) pour le montant TTC
      {
        account: accounts.clients._id,
        debit: invoice.totalTTC,
        credit: 0,
        description: `Facture ${invoice.invoiceNumber} - Client ${invoice.client?.companyName || invoice.client?.contactName || invoice.client}`,
      },
      // Crédit: Compte de Ventes (70xxxx) pour le montant HT
      {
        account: accounts.salesRevenue._id,
        debit: 0,
        credit: invoice.totalHT,
        description: `Vente sur facture ${invoice.invoiceNumber}`,
      },
      // Crédit: Compte TVA Collectée (44571x) pour le montant de la TVA
      {
        account: accounts.vatCollected._id,
        debit: 0,
        credit: invoice.totalVAT,
        description: `TVA collectée sur facture ${invoice.invoiceNumber}`,
      },
    ];

    const journalEntryData = {
      date: invoice.issueDate, // Ou date de validation/paiement selon vos règles
      description: `Enregistrement vente facture ${invoice.invoiceNumber}`,
      lines: journalEntryLines,
      transactionType: 'SALE',
      relatedDocumentType: 'Invoice',
      relatedDocumentId: invoice._id,
      createdBy: userId,
    };

    try {
      const newEntry = await JournalEntry.create(journalEntryData);
      console.log(`Écriture de journal pour la vente (facture ${invoice.invoiceNumber}) créée: ${newEntry._id}`.blue);
      return newEntry;
    } catch (error) {
      console.error(`Erreur lors de la création de l'écriture de journal pour la facture ${invoice.invoiceNumber}:`.red, error);
      // Il est crucial de gérer cette erreur, peut-être en invalidant la facture ou en notifiant un admin.
      throw new Error(`Impossible de créer l'écriture de journal: ${error.message}`);
    }
  }

  /**
   * Crée les écritures de journal pour un paiement reçu sur une facture.
   * @param {object} invoice - L'objet facture (document Mongoose).
   * @param {number} paymentAmount - Le montant du paiement.
   * @param {Date} paymentDate - La date du paiement.
   * @param {string} bankAccountNumber - Le numéro du compte bancaire à créditer (ex: '512000').
   * @param {string} userId - L'ID de l'utilisateur effectuant l'action.
   * @returns {Promise<object>} L'écriture de journal créée.
   */
  static async recordPaymentReceived(invoice, paymentAmount, paymentDate, bankAccountNumber = '512000', userId) {
    const accounts = await this._getRequiredAccounts({
      clients: '411000',
      bank: bankAccountNumber,
    });

    const journalEntryLines = [
      // Débit: Compte Banque (512xxx) pour le montant du paiement
      {
        account: accounts.bank._id,
        debit: paymentAmount,
        credit: 0,
        description: `Encaissement facture ${invoice.invoiceNumber}`,
      },
      // Crédit: Compte Client (411xxx) pour solder (partiellement ou totalement) la créance
      {
        account: accounts.clients._id,
        debit: 0,
        credit: paymentAmount,
        description: `Paiement facture ${invoice.invoiceNumber} - Client ${invoice.client?.companyName || invoice.client?.contactName || invoice.client}`,
      },
    ];

    const journalEntryData = {
      date: paymentDate,
      description: `Encaissement paiement facture ${invoice.invoiceNumber}`,
      lines: journalEntryLines,
      transactionType: 'PAYMENT_RECEIVED',
      relatedDocumentType: 'Invoice', // Ou un modèle 'Payment' si vous en avez un
      relatedDocumentId: invoice._id,
      createdBy: userId,
    };

    try {
      const newEntry = await JournalEntry.create(journalEntryData);
      console.log(`Écriture de journal pour paiement reçu (facture ${invoice.invoiceNumber}) créée: ${newEntry._id}`.blue);
      return newEntry;
    } catch (error) {
      console.error(`Erreur lors de la création de l'écriture de journal pour le paiement de la facture ${invoice.invoiceNumber}:`.red, error);
      throw new Error(`Impossible de créer l'écriture de journal pour le paiement: ${error.message}`);
    }
  }


  /**
   * Crée les écritures de journal pour une facture d'achat (facture fournisseur).
   * @param {object} supplierInvoiceData - Les données de la facture fournisseur.
   *        Doit contenir: supplierInvoiceNumber, issueDate, totalHT, totalVAT, totalTTC, supplier (ID ou objet), items (pour détail des comptes de charge).
   * @param {string} userId - L'ID de l'utilisateur.
   * @returns {Promise<object>} L'écriture de journal créée.
   */
  static async recordPurchaseInvoice(supplierInvoiceData, userId) {
    // Les numéros de compte sont des exemples
    const accounts = await this._getRequiredAccounts({
      suppliers: '401000',         // Compte Fournisseurs
      // Le compte de charge peut varier, ici un exemple générique
      // Dans une vraie app, il faudrait mapper les items de la facture à des comptes de charge spécifiques.
      // Pour simplifier, on utilise un compte de charge par défaut.
      // ou déterminer le compte de charge en fonction du type de produit/service acheté.
      purchaseCharge: supplierInvoiceData.chargeAccountNumber || '607000', // Achats de marchandises, ou 606xxx pour non stockés
      vatDeductible: '445660',      // Compte TVA déductible sur autres biens et services
    });

    const journalEntryLines = [
      // Débit: Compte de Charges (6xxxxx) pour le montant HT
      {
        account: accounts.purchaseCharge._id,
        debit: supplierInvoiceData.totalHT,
        credit: 0,
        description: `Achat sur facture fournisseur ${supplierInvoiceData.supplierInvoiceNumber}`,
      },
      // Débit: Compte TVA Déductible (44566x) pour le montant de la TVA
      {
        account: accounts.vatDeductible._id,
        debit: supplierInvoiceData.totalVAT,
        credit: 0,
        description: `TVA déductible sur facture fournisseur ${supplierInvoiceData.supplierInvoiceNumber}`,
      },
      // Crédit: Compte Fournisseur (401xxx) pour le montant TTC
      {
        account: accounts.suppliers._id,
        debit: 0,
        credit: supplierInvoiceData.totalTTC,
        description: `Facture ${supplierInvoiceData.supplierInvoiceNumber} - Fournisseur ${supplierInvoiceData.supplier?.name || supplierInvoiceData.supplier}`,
      },
    ];

    const journalEntryData = {
      date: supplierInvoiceData.issueDate,
      description: `Enregistrement achat facture fournisseur ${supplierInvoiceData.supplierInvoiceNumber}`,
      lines: journalEntryLines,
      transactionType: 'PURCHASE',
      // relatedDocumentType: 'SupplierInvoice', // Si vous avez un modèle SupplierInvoice
      // relatedDocumentId: supplierInvoiceData._id,
      createdBy: userId,
    };

     try {
      const newEntry = await JournalEntry.create(journalEntryData);
      console.log(`Écriture de journal pour l'achat (facture fournisseur ${supplierInvoiceData.supplierInvoiceNumber}) créée: ${newEntry._id}`.blue);
      return newEntry;
    } catch (error) {
      console.error(`Erreur lors de la création de l'écriture de journal pour la facture fournisseur ${supplierInvoiceData.supplierInvoiceNumber}:`.red, error);
      throw new Error(`Impossible de créer l'écriture de journal pour l'achat: ${error.message}`);
    }
  }


  // --- Fonctions utilitaires privées ---

  /**
   * Récupère les documents de compte du plan comptable en fonction des numéros fournis.
   * @param {object} accountNumbersMap - Un objet où les clés sont des noms logiques et les valeurs sont les numéros de compte.
   *                                     Ex: { clients: '411000', salesRevenue: '700000' }
   * @returns {Promise<object>} Un objet où les clés sont les noms logiques et les valeurs sont les documents de compte Mongoose.
   * @throws {Error} Si un compte requis n'est pas trouvé dans le plan comptable.
   * @private
   */
  static async _getRequiredAccounts(accountNumbersMap) {
    const accountPromises = Object.entries(accountNumbersMap).map(async ([key, accountNumber]) => {
      const account = await ChartOfAccounts.findOne({ accountNumber });
      if (!account) {
        throw new Error(`Compte comptable requis non trouvé: ${accountNumber} (pour ${key}). Veuillez vérifier votre plan comptable.`);
      }
      return { key, account };
    });

    const resolvedAccounts = await Promise.all(accountPromises);
    const accounts = resolvedAccounts.reduce((acc, { key, account }) => {
      acc[key] = account;
      return acc;
    }, {});

    return accounts;
  }
}

module.exports = AccountingService;

// --- Exemple d'utilisation (à placer dans les contrôleurs ou hooks de modèles) ---
/*
// Dans invoice.controller.js, après la validation/paiement d'une facture:
// if (invoice.status === 'PAID') { // Ou autre condition
//   try {
//     await AccountingService.recordSaleInvoice(invoice, req.user._id);
//     // Si le paiement est enregistré en même temps que la facture est marquée comme payée
//     // (ex: paiement immédiat)
//     await AccountingService.recordPaymentReceived(
//        invoice,
//        invoice.totalTTC, // Supposant un paiement complet
//        new Date(), // Date du paiement
//        '512000', // Compte bancaire par défaut
//        req.user._id
//     );
//   } catch (accountingError) {
//     // Gérer l'erreur comptable (log, notification, etc.)
//     // Peut-être annuler la mise à jour du statut de la facture ou la marquer pour révision
//     console.error('Erreur comptable lors de l'enregistrement de la facture:', accountingError);
//     // return next(new AppError('Erreur lors de l'enregistrement comptable de la facture.', 500));
//   }
// }

// Pour une facture fournisseur (nécessite un modèle ou une gestion pour les factures fournisseurs)
// const sampleSupplierInvoice = {
//   supplierInvoiceNumber: 'FSUP2023-A05',
//   issueDate: new Date(),
//   totalHT: 800,
//   totalVAT: 160,
//   totalTTC: 960,
//   supplier: { name: 'Fournisseur Matériel SARL' }, // ou un ID si réf
//   chargeAccountNumber: '606300' // Compte de charge spécifique pour cette fourniture
// };
// try {
//   await AccountingService.recordPurchaseInvoice(sampleSupplierInvoice, 'adminUserId');
// } catch (e) { console.error(e); }
*/