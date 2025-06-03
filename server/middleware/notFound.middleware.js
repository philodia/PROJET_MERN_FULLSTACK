// gestion-commerciale-app/backend/middleware/notFound.middleware.js

const { AppError } = require('./error.middleware'); // Importer la classe AppError personnalisée

/**
 * Middleware pour gérer les routes non trouvées (404).
 * Ce middleware est appelé si aucune autre route n'a correspondu à la requête.
 * Il doit être placé après toutes les définitions de routes dans la pile des middlewares d'Express.
 *
 * @param {Object} req - L'objet requête Express.
 * @param {Object} res - L'objet réponse Express.
 * @param {Function} next - La fonction middleware suivante.
 */
const notFound = (req, res, next) => {
  // Crée une nouvelle instance de AppError avec un message et un code de statut 404.
  // L'erreur est ensuite passée au prochain middleware de gestion des erreurs (errorHandler).
  const error = new AppError(`La route que vous essayez d'atteindre (${req.method} ${req.originalUrl}) n'existe pas sur ce serveur.`, 404);
  next(error);
};

module.exports = notFound;