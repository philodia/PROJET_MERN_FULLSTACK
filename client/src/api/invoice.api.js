import apiClient from './index';
import { handleError } from './utils.api';

const INVOICE_API_BASE_URL = '/invoices';

/**
 * Récupère une liste paginée de factures avec filtres et tri.
 * @param {object} params - { page, limit, sort, status, clientId, dateFrom, dateTo, search }
 * @returns {Promise<object>} { data: Invoice[], currentPage, totalPages, totalItems, limit }
 */
export const fetchInvoices = async (params = {}) => {
  try {
    const response = await apiClient.get(INVOICE_API_BASE_URL, { params });
    
    if (response.data?.success) {
      return {
        data: response.data.data,
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems,
        limit: response.data.limit,
      };
    }
    
    throw new Error(response.data?.message || "Réponse invalide du serveur pour la liste des factures");
  } catch (error) {
    handleError(error, "Erreur lors du chargement des factures", "InvoiceAPI:fetchInvoices");
    throw error;
  }
};

/**
 * Récupère une facture par son ID avec des options de population.
 * @param {string} invoiceId 
 * @param {object} options - { populate: 'client,items.product' }
 * @returns {Promise<Invoice>} L'objet facture
 */
export const fetchInvoiceById = async (invoiceId, options = {}) => {
  try {
    const response = await apiClient.get(`${INVOICE_API_BASE_URL}/${invoiceId}`, {
      params: options
    });
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide du serveur pour la facture");
  } catch (error) {
    handleError(error, `Erreur lors du chargement de la facture ${invoiceId}`, "InvoiceAPI:fetchInvoiceById");
    throw error;
  }
};

/**
 * Crée une nouvelle facture avec validation avancée.
 * @param {object} invoiceData - Données de la facture
 * @returns {Promise<Invoice>} La nouvelle facture créée
 */
export const createInvoice = async (invoiceData) => {
  try {
    const response = await apiClient.post(INVOICE_API_BASE_URL, invoiceData);
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide du serveur lors de la création");
  } catch (error) {
    handleError(
      error, 
      "Erreur lors de la création de la facture", 
      "InvoiceAPI:createInvoice",
      { data: invoiceData }
    );
    throw error;
  }
};

/**
 * Met à jour une facture existante avec gestion des versions.
 * @param {string} invoiceId 
 * @param {object} invoiceData - Données à mettre à jour
 * @param {number} [version] - Numéro de version pour l'optimistic locking
 * @returns {Promise<Invoice>} La facture mise à jour
 */
export const updateInvoice = async (invoiceId, invoiceData, version) => {
  try {
    const headers = version ? { 'If-Match': version } : {};
    const response = await apiClient.put(
      `${INVOICE_API_BASE_URL}/${invoiceId}`, 
      invoiceData,
      { headers }
    );
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide du serveur lors de la mise à jour");
  } catch (error) {
    handleError(
      error, 
      `Erreur lors de la mise à jour de la facture ${invoiceId}`, 
      "InvoiceAPI:updateInvoice",
      { invoiceId, data: invoiceData }
    );
    throw error;
  }
};

/**
 * Supprime une facture avec vérification des dépendances.
 * @param {string} invoiceId 
 * @returns {Promise<object>} { success: true, message: "Facture supprimée" }
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    const response = await apiClient.delete(`${INVOICE_API_BASE_URL}/${invoiceId}`);
    
    if (response.data?.success) {
      return response.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide du serveur lors de la suppression");
  } catch (error) {
    handleError(error, `Erreur lors de la suppression de la facture ${invoiceId}`, "InvoiceAPI:deleteInvoice");
    throw error;
  }
};

/**
 * Enregistre un paiement pour une facture avec validation du montant.
 * @param {string} invoiceId 
 * @param {object} paymentData - { amount, date, paymentMethod, reference }
 * @returns {Promise<Invoice>} La facture mise à jour
 */
export const recordInvoicePayment = async (invoiceId, paymentData) => {
  try {
    const response = await apiClient.post(
      `${INVOICE_API_BASE_URL}/${invoiceId}/payments`, 
      paymentData
    );
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide lors de l'enregistrement du paiement");
  } catch (error) {
    handleError(
      error, 
      `Erreur lors de l'enregistrement du paiement pour ${invoiceId}`, 
      "InvoiceAPI:recordInvoicePayment",
      { invoiceId, paymentData }
    );
    throw error;
  }
};

/**
 * Marque une facture comme envoyée avec historique d'audit.
 * @param {string} invoiceId 
 * @returns {Promise<Invoice>} La facture mise à jour
 */
export const markInvoiceAsSent = async (invoiceId) => {
  try {
    const response = await apiClient.post(`${INVOICE_API_BASE_URL}/${invoiceId}/send`);
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide lors du marquage comme envoyée");
  } catch (error) {
    handleError(error, `Erreur lors de l'envoi de la facture ${invoiceId}`, "InvoiceAPI:markInvoiceAsSent");
    throw error;
  }
};

/**
 * Annule une facture avec vérification des paiements existants.
 * @param {string} invoiceId 
 * @returns {Promise<Invoice>} La facture annulée
 */
export const cancelInvoice = async (invoiceId) => {
  try {
    const response = await apiClient.post(`${INVOICE_API_BASE_URL}/${invoiceId}/cancel`);
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide lors de l'annulation");
  } catch (error) {
    handleError(error, `Erreur lors de l'annulation de la facture ${invoiceId}`, "InvoiceAPI:cancelInvoice");
    throw error;
  }
};

/**
 * Duplique une facture existante avec personnalisation.
 * @param {string} invoiceId 
 * @param {object} options - { newInvoiceNumber, updateDates }
 * @returns {Promise<Invoice>} La nouvelle facture dupliquée
 */
export const duplicateInvoice = async (invoiceId, options = {}) => {
  try {
    const response = await apiClient.post(
      `${INVOICE_API_BASE_URL}/${invoiceId}/duplicate`,
      options
    );
    
    if (response.data?.success) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || "Réponse invalide lors de la duplication");
  } catch (error) {
    handleError(error, `Erreur lors de la duplication de la facture ${invoiceId}`, "InvoiceAPI:duplicateInvoice");
    throw error;
  }
};

/**
 * Génère le PDF d'une facture avec options de personnalisation.
 * @param {string} invoiceId 
 * @param {object} options - { format: 'A4', includeLogo }
 * @returns {Promise<Blob>} Le blob du PDF
 */
export const generateInvoicePdf = async (invoiceId, options = {}) => {
  try {
    const response = await apiClient.get(
      `${INVOICE_API_BASE_URL}/${invoiceId}/pdf`, 
      {
        params: options,
        responseType: 'blob'
      }
    );
    
    // Vérifier le type de contenu pour s'assurer que c'est un PDF
    if (response.headers['content-type'] === 'application/pdf') {
      return response.data;
    }
    
    throw new Error("Le serveur n'a pas retourné un PDF valide");
  } catch (error) {
    handleError(error, `Erreur lors de la génération du PDF pour ${invoiceId}`, "InvoiceAPI:generateInvoicePdf");
    throw error;
  }
};

/**
 * Exporte les factures au format CSV ou Excel.
 * @param {object} params - Filtres d'export
 * @returns {Promise<Blob>} Le fichier d'export
 */
export const exportInvoices = async (params = {}) => {
  try {
    const response = await apiClient.get(
      `${INVOICE_API_BASE_URL}/export`, 
      {
        params,
        responseType: 'blob'
      }
    );
    
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de l'export des factures", "InvoiceAPI:exportInvoices");
    throw error;
  }
};