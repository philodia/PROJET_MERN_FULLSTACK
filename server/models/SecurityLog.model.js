// gestion-commerciale-app/backend/models/SecurityLog.model.js
const mongoose = require('mongoose');

/**
 * Schéma pour les journaux de sécurité.
 * Enregistre les événements importants liés à la sécurité et aux actions sensibles des utilisateurs.
 */
const SecurityLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true, // Indexer pour des recherches rapides par date
    },
    level: { // Niveau de criticité du log
      type: String,
      enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL', 'AUDIT'], // Niveaux possibles
      default: 'INFO',
      required: true,
    },
    action: { // Type d'action effectuée
      type: String,
      required: [true, 'L\'action est requise pour un journal de sécurité.'],
      trim: true,
      // Exemples d'actions:
      // AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAILURE, AUTH_LOGOUT, AUTH_REGISTER,
      // USER_CREATED, USER_UPDATED, USER_DELETED, USER_PASSWORD_RESET_REQUEST, USER_PASSWORD_RESET_SUCCESS,
      // CLIENT_CREATED, CLIENT_UPDATED, CLIENT_DELETED,
      // INVOICE_CREATED, INVOICE_SENT, INVOICE_PAID, INVOICE_DELETED,
      // QUOTE_STATUS_CHANGED, STOCK_ADJUSTED,
      // ADMIN_SETTINGS_CHANGED, SECURITY_ALERT, API_KEY_GENERATED, etc.
    },
    message: { // Description détaillée de l'événement
        type: String,
        required: [true, 'Un message est requis pour le journal de sécurité.'],
        trim: true,
    },
    userId: { // L'ID de l'utilisateur qui a effectué l'action (si applicable)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Peut être null pour des actions système ou des tentatives anonymes
      index: true,
    },
    usernameAttempt: { // Nom d'utilisateur tenté lors d'un échec de connexion (pour analyse)
      type: String,
      trim: true,
      default: null,
    },
    ipAddress: { // Adresse IP source de la requête
      type: String,
      trim: true,
      default: null,
    },
    userAgent: { // User-Agent du client
        type: String,
        trim: true,
        default: null,
    },
    targetResource: { // Type de ressource affectée (ex: 'User', 'Invoice', 'Client')
      type: String,
      trim: true,
      default: null,
    },
    targetResourceId: { // ID de la ressource affectée
      type: mongoose.Schema.Types.ObjectId,
      // Pas de 'ref' direct car targetResource peut varier.
      // Vous pourriez ajouter un refPath si vous voulez dynamiquement lier.
      default: null,
    },
    details: { // Objet JSON pour stocker des détails supplémentaires spécifiques à l'événement
      type: mongoose.Schema.Types.Mixed, // Permet de stocker n'importe quelle structure JSON
      default: null,
      // Exemple: { oldValues: {...}, newValues: {...} } pour une mise à jour,
      //          { reason: 'Invalid credentials' } pour un échec de login.
    },
    // sessionId: { // Optionnel: ID de session si vous en utilisez
    //   type: String,
    //   trim: true,
    //   default: null,
    // }
  },
  {
    // Timestamps: `timestamp` est le champ principal, mais `createdAt` peut aussi être utile
    // pour savoir quand l'entrée de log a été insérée dans la DB, si différent de `timestamp` de l'événement.
    // Pour ce modèle, `timestamp` est plus pertinent que `createdAt` par défaut.
    // Si vous voulez les deux, vous pouvez les renommer ou utiliser les timestamps Mongoose.
    // Pour l'instant, on utilise `timestamp` comme principal.
    timestamps: { createdAt: 'loggedAt', updatedAt: false }, // 'loggedAt' pour quand l'entrée est créée en DB

    // Définir une collection plafonnée (Capped Collection) si vous voulez limiter la taille
    // des journaux et que les anciennes entrées soient automatiquement supprimées.
    // ATTENTION: Les collections plafonnées ne peuvent pas être shardées et les documents
    // ne peuvent pas être mis à jour s'ils grossissent. Pour des logs, c'est souvent acceptable.
    // capped: { size: 1024 * 1024 * 100, max: 100000 } // Exemple: 100MB ou 100,000 documents
  }
);

// --- INDEXES ---
// Index pour les recherches et tris courants
SecurityLogSchema.index({ level: 1, timestamp: -1 });
SecurityLogSchema.index({ action: 1, timestamp: -1 });
SecurityLogSchema.index({ targetResource: 1, targetResourceId: 1, timestamp: -1 });


// --- MÉTHODE STATIQUE POUR CRÉER UN LOG FACILEMENT ---
/**
 * Crée et sauvegarde une nouvelle entrée de journal de sécurité.
 * @param {object} logData - Les données du log.
 * @param {string} logData.level - Niveau de criticité (INFO, WARN, ERROR, AUDIT, CRITICAL).
 * @param {string} logData.action - L'action effectuée (ex: AUTH_LOGIN_SUCCESS).
 * @param {string} logData.message - Description de l'événement.
 * @param {string} [logData.userId] - ID de l'utilisateur.
 * @param {string} [logData.usernameAttempt] - Username tenté (pour échec login).
 * @param {string} [logData.ipAddress] - Adresse IP.
 * @param {string} [logData.userAgent] - User agent.
 * @param {string} [logData.targetResource] - Type de ressource affectée.
 * @param {string} [logData.targetResourceId] - ID de la ressource affectée.
 * @param {object} [logData.details] - Détails supplémentaires.
 * @returns {Promise<mongoose.Document>} Le document de log sauvegardé.
 */
SecurityLogSchema.statics.createLog = async function(logData) {
  try {
    const logEntry = await this.create({
      timestamp: new Date(), // Assurer un timestamp frais au moment de la création du log
      ...logData,
    });
    // console.log(`[Security Log - ${logData.level}] Action: ${logData.action}, User: ${logData.userId || 'System'}, IP: ${logData.ipAddress || 'N/A'}`);
    return logEntry;
  } catch (error) {
    // Que faire si le logging lui-même échoue ? C'est un problème.
    // Au minimum, logger l'erreur de logging dans la console.
    console.error('CRITICAL: Failed to create security log entry!'.red.inverse, error);
    console.error('Log Data that failed:'.yellow, logData);
    // En production, vous pourriez vouloir une alerte pour ce type d'échec.
    // Ne pas relancer l'erreur pour ne pas impacter le flux principal de l'application à cause d'un échec de logging.
  }
};


module.exports = mongoose.model('SecurityLog', SecurityLogSchema);