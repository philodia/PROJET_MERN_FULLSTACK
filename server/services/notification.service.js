// gestion-commerciale-app/backend/services/notification.service.js

const { getIO, emitToUser, broadcastEvent } = require('../config/socket'); // Fonctions utilitaires de socket.js
// const User = require('../models/User.model'); // Optionnel, si vous avez besoin de récupérer des infos utilisateur

/**
 * Service pour gérer l'envoi de notifications en temps réel via Socket.IO.
 */
class NotificationService {
  /**
   * Envoie une notification à un utilisateur spécifique.
   * @param {string} userId - L'ID de l'utilisateur destinataire.
   * @param {string} eventName - Le nom de l'événement Socket.IO (ex: 'new_notification').
   * @param {object} data - Les données de la notification (ex: { title: 'Nouvelle facture', message: 'Une nouvelle facture a été créée.'}).
   * @param {boolean} [isCritical=false] - Indique si la notification est critique (pourrait être logguée différemment).
   */
  static sendToUser(userId, eventName, data, isCritical = false) {
    if (!userId || !eventName || !data) {
      console.warn('[NotificationService] Tentative d\'envoi de notification à un utilisateur avec des données manquantes.'.yellow, { userId, eventName, data });
      return;
    }

    try {
      const ioInstance = getIO(); // S'assurer que l'instance IO est disponible
      if (ioInstance) {
        emitToUser(userId.toString(), eventName, data); // Utiliser la fonction utilitaire de socket.js
        if (isCritical) {
          console.log(`[NotificationService] Notification CRITIQUE envoyée à l'utilisateur ${userId} - Événement: ${eventName}`.magenta, data);
        } else {
          // console.log(`[NotificationService] Notification envoyée à l'utilisateur ${userId} - Événement: ${eventName}`, data);
        }
      } else {
        console.error('[NotificationService] Socket.IO n\'est pas initialisé. Notification non envoyée.'.red);
      }
    } catch (error) {
      console.error(`[NotificationService] Erreur lors de l'envoi de la notification à l'utilisateur ${userId}:`.red, error);
    }
  }

  /**
   * Envoie une notification à tous les utilisateurs connectés (broadcast).
   * @param {string} eventName - Le nom de l'événement Socket.IO.
   * @param {object} data - Les données de la notification.
   * @param {boolean} [isCritical=false] - Indique si la notification est critique.
   */
  static broadcast(eventName, data, isCritical = false) {
    if (!eventName || !data) {
      console.warn('[NotificationService] Tentative de broadcast avec des données manquantes.'.yellow, { eventName, data });
      return;
    }

    try {
      const ioInstance = getIO();
      if (ioInstance) {
        broadcastEvent(eventName, data); // Utiliser la fonction utilitaire de socket.js
        if (isCritical) {
          console.log(`[NotificationService] Notification CRITIQUE broadcastée - Événement: ${eventName}`.magenta, data);
        } else {
          // console.log(`[NotificationService] Notification broadcastée - Événement: ${eventName}`, data);
        }
      } else {
        console.error('[NotificationService] Socket.IO n\'est pas initialisé. Broadcast non envoyé.'.red);
      }
    } catch (error) {
      console.error(`[NotificationService] Erreur lors du broadcast de la notification (${eventName}):`.red, error);
    }
  }

  /**
   * Envoie une notification aux utilisateurs ayant un rôle spécifique.
   * Nécessite que les sockets des utilisateurs rejoignent des "rooms" basées sur leur rôle.
   * (ex: socket.join(`role_ADMIN`), socket.join(`role_MANAGER`))
   * @param {string} role - Le rôle destinataire (ex: 'ADMIN', 'MANAGER', 'ACCOUNTANT').
   * @param {string} eventName - Le nom de l'événement Socket.IO.
   * @param {object} data - Les données de la notification.
   */
  static sendToRole(role, eventName, data) {
    if (!role || !eventName || !data) {
      console.warn('[NotificationService] Tentative d\'envoi de notification à un rôle avec des données manquantes.'.yellow, { role, eventName, data });
      return;
    }
    const roomName = `role_${role.toUpperCase()}`; // Convention pour le nom de la room
    try {
      const ioInstance = getIO();
      if (ioInstance) {
        ioInstance.to(roomName).emit(eventName, data);
        // console.log(`[NotificationService] Notification envoyée au rôle ${role} (room: ${roomName}) - Événement: ${eventName}`, data);
      } else {
        console.error(`[NotificationService] Socket.IO n\'est pas initialisé. Notification au rôle ${role} non envoyée.`.red);
      }
    } catch (error) {
      console.error(`[NotificationService] Erreur lors de l'envoi de la notification au rôle ${role} (${eventName}):`.red, error);
    }
  }

  // --- Exemples de méthodes spécifiques de notification ---

  /**
   * Notifie la création d'une nouvelle facture.
   * @param {object} invoice - L'objet facture.
   * @param {string} [creatorId] - Optionnel, ID de l'utilisateur qui a créé la facture (pour ne pas se notifier soi-même si besoin).
   */
  static notifyNewInvoice(invoice, creatorId) {
    const notificationData = {
      title: 'Nouvelle Facture Créée',
      message: `La facture N°${invoice.invoiceNumber} d'un montant de ${this._formatCurrency(invoice.totalTTC)} pour ${invoice.client?.companyName || 'un client'} a été créée.`,
      link: `/invoices/${invoice._id}`, // Lien vers la facture dans le frontend
      invoiceId: invoice._id,
      type: 'INVOICE_CREATED',
    };

    // Envoyer à tous les managers et comptables
    this.sendToRole('MANAGER', 'new_notification', notificationData);
    this.sendToRole('ACCOUNTANT', 'new_notification', notificationData);
    this.sendToRole('ADMIN', 'new_notification', notificationData); // Les admins aussi

    // Optionnel: Notifier l'utilisateur spécifique si ce n'est pas le créateur
    // (Exemple: si un manager crée une facture pour un client géré par un autre user)
  }

  /**
   * Notifie un paiement reçu.
   * @param {object} invoice - La facture concernée.
   * @param {number} paymentAmount - Le montant du paiement.
   */
  static notifyPaymentReceived(invoice, paymentAmount) {
    const notificationData = {
      title: 'Paiement Reçu',
      message: `Un paiement de ${this._formatCurrency(paymentAmount)} a été enregistré pour la facture N°${invoice.invoiceNumber}.`,
      link: `/invoices/${invoice._id}`,
      invoiceId: invoice._id,
      type: 'PAYMENT_RECEIVED',
    };
    this.sendToRole('ACCOUNTANT', 'new_notification', notificationData);
    this.sendToRole('MANAGER', 'new_notification', notificationData); // Le manager concerné pourrait être intéressé
    this.sendToRole('ADMIN', 'new_notification', notificationData);
  }

  /**
   * Notifie une alerte de stock critique.
   * @param {object} product - Le produit concerné.
   */
  static notifyStockAlert(product) {
    const notificationData = {
      title: 'Alerte Stock Critique',
      message: `Le stock pour le produit "${product.name}" (SKU: ${product.sku || 'N/A'}) est de ${product.stockQuantity}, ce qui est en dessous ou égal au seuil critique de ${product.criticalStockThreshold}.`,
      link: `/products/${product._id}/edit`, // Lien vers la page du produit
      productId: product._id,
      type: 'STOCK_ALERT',
    };
    // Envoyer aux managers et admins
    this.sendToRole('MANAGER', 'new_notification', notificationData, true); // Marquer comme critique
    this.sendToRole('ADMIN', 'new_notification', notificationData, true);
  }

  // --- Fonctions utilitaires (peuvent être dans un fichier utils séparé) ---
  static _formatCurrency(amount, currency = 'EUR') {
    if (typeof amount !== 'number') return 'N/A';
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(amount);
    } catch(e) {
      return `${amount} ${currency}`;
    }
  }
}

module.exports = NotificationService;

// --- Logique pour que les utilisateurs rejoignent les rooms par rôle ---
// Cette logique devrait être dans `backend/config/socket.js` lors de la connexion
// ou après l'identification de l'utilisateur.

/*
// Dans backend/config/socket.js, dans io.on('connection', (socket) => { ... })
// Après que l'utilisateur est identifié (par exemple, via le middleware d'authentification socket ou un événement 'identify_user')

// if (socket.user && socket.user.role) { // Si socket.user est défini par le middleware d'auth
//   const userRole = socket.user.role.toUpperCase();
//   socket.join(`role_${userRole}`); // L'utilisateur rejoint la room de son rôle
//   console.log(`Socket ${socket.id} (User: ${socket.user._id}) joined role room: role_${userRole}`);
//
//   // L'utilisateur rejoint aussi une room personnelle basée sur son ID (déjà dans votre config/socket.js)
//   socket.join(socket.user._id.toString());
// }

// OU si vous utilisez un événement 'identify_user' :
// socket.on('identify_user', (userData) => { // userData pourrait contenir { userId, role }
//   if (userData.userId) {
//     connectedUsers.set(userData.userId.toString(), socket.id);
//     socket.join(userData.userId.toString()); // Room personnelle
//     console.log(`User ${userData.userId} identified with socket ID ${socket.id}`);
//
//     if (userData.role) {
//       const userRole = userData.role.toUpperCase();
//       socket.join(`role_${userRole}`); // Room de rôle
//       console.log(`User ${userData.userId} joined role room: role_${userRole}`);
//     }
//     socket.emit('user_identified', { message: `Welcome user ${userData.userId}` });
//   }
// });
*/