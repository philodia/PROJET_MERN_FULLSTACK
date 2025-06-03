// gestion-commerciale-app/backend/middleware/error.middleware.js

const config = require('../config'); // Pour accéder à NODE_ENV

/**
 * Classe d'erreur personnalisée pour gérer les erreurs HTTP avec un statut et un message.
 * @extends Error
 */
class AppError extends Error {
  /**
   * Crée une instance de AppError.
   * @param {string} message - Le message d'erreur.
   * @param {number} statusCode - Le code de statut HTTP.
   */
  constructor(message, statusCode) {
    super(message); // Appelle le constructeur de la classe Error parente
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // 'fail' pour les erreurs client, 'error' pour les erreurs serveur
    this.isOperational = true; // Pour distinguer les erreurs opérationnelles des erreurs de programmation

    Error.captureStackTrace(this, this.constructor); // Capture la pile d'appels correcte
  }
}

/**
 * Middleware pour gérer les routes non trouvées (404).
 * Ce middleware est appelé si aucune autre route ne correspond à la requête.
 */
const notFound = (req, res, next) => {
  // const error = new Error(`Not Found - ${req.originalUrl}`);
  // res.status(404);
  // next(error); // Passe l'erreur au gestionnaire d'erreurs global
  // OU utiliser AppError directement :
  next(new AppError(`La route ${req.originalUrl} n'a pas été trouvée sur ce serveur.`, 404));
};

/**
 * Gestionnaire d'erreurs global.
 * Ce middleware est appelé chaque fois que `next(error)` est appelé dans l'application.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err }; // Cloner l'erreur pour éviter de modifier l'original directement

  error.message = err.message; // S'assurer que le message est bien copié
  error.statusCode = err.statusCode || 500; // Code de statut par défaut à 500 (Internal Server Error)
  error.status = err.status || 'error';

  // Logguer l'erreur pour le débogage (surtout en développement)
  if (config.NODE_ENV === 'development') {
    console.error('💥 ERROR MIDDLEWARE 💥'.red);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    // console.error('Error Status Code:', error.statusCode);
    // console.error('Error Status:', error.status);
    console.error('Error Stack:'.yellow, err.stack);
  }

  // Gérer des erreurs Mongoose spécifiques pour des messages plus conviviaux
  if (err.name === 'CastError') { // Erreur de cast Mongoose (ex: ID invalide)
    const message = `Ressource non trouvée. Format d'ID invalide pour le champ '${err.path}' avec la valeur '${err.value}'.`;
    error = new AppError(message, 400); // Bad Request
  }

  if (err.code === 11000) { // Erreur de duplicata Mongoose (champ unique)
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; // Extrait la valeur dupliquée
    const field = Object.keys(err.keyValue)[0];
    const message = `La valeur ${value} pour le champ '${field}' existe déjà. Veuillez utiliser une autre valeur.`;
    error = new AppError(message, 400); // Bad Request
  }

  if (err.name === 'ValidationError') { // Erreur de validation Mongoose
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Données d'entrée invalides. ${errors.join('. ')}`;
    error = new AppError(message, 400); // Bad Request
  }

  if (err.name === 'JsonWebTokenError') { // Erreur JWT invalide
    const message = 'Token invalide. Veuillez vous reconnecter.';
    error = new AppError(message, 401); // Unauthorized
  }

  if (err.name === 'TokenExpiredError') { // Erreur JWT expiré
    const message = 'Votre session a expiré. Veuillez vous reconnecter.';
    error = new AppError(message, 401); // Unauthorized
  }

  // Envoyer la réponse d'erreur au client
  if (config.NODE_ENV === 'production' && !error.isOperational) {
    // Si c'est une erreur de programmation ou inconnue en production, ne pas fuiter les détails
    console.error('💥 UNEXPECTED ERROR IN PRODUCTION 💥'.red.inverse, error);
    return res.status(500).json({
      status: 'error',
      message: 'Quelque chose s\'est très mal passé ! Veuillez réessayer plus tard.',
    });
  }

  // Pour les erreurs opérationnelles ou en développement, envoyer plus de détails
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    // Afficher la pile d'appels uniquement en développement
    stack: config.NODE_ENV === 'development' ? error.stack || err.stack : undefined,
    // error: config.NODE_ENV === 'development' ? error : undefined, // Pour voir l'objet erreur complet en dev
  });
};

module.exports = {
  AppError, // Exporter la classe AppError pour pouvoir la lancer manuellement
  notFound,
  errorHandler,
};