// gestion-commerciale-app/backend/middleware/error.middleware.js

// const config = require('../config'); // Remplacé par process.env
// Si vous utilisez 'colors' : require('colors');

/**
 * Classe d'erreur personnalisée pour gérer les erreurs HTTP avec un statut et un message.
 * @extends Error
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Indique que c'est une erreur attendue/gérée

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware pour gérer les routes non trouvées (404).
 */
const notFound = (req, res, next) => {
  // Crée une nouvelle erreur AppError et la passe au prochain middleware (errorHandler)
  next(new AppError(`La route ${req.originalUrl} n'a pas été trouvée sur ce serveur.`, 404));
};

/**
 * Gestionnaire d'erreurs global.
 */
const errorHandler = (err, req, res, next) => {
  // Définir le statusCode et le status par défaut si non présents sur l'erreur
  // err.statusCode est défini si c'est une AppError ou une erreur d'une autre lib qui le définit
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error'; // 'error' pour les erreurs serveur par défaut

  let message = err.message; // Utiliser le message de l'erreur originale par défaut

  // Log de l'erreur originale complète en développement pour un meilleur débogage
  if (process.env.NODE_ENV === 'development') {
    console.error("💥 ERROR MIDDLEWARE 💥");
    console.error("Error Name:", err.name);
    console.error("Original Error Message:", err.message);
    if (err.statusCode) console.error("Original Status Code:", err.statusCode);
    if (err.status) console.error("Original Status:", err.status);
    console.error("Error Stack:", err.stack);
    if (err.keyValue) console.error("MongoDB keyValue (for duplicate error):", err.keyValue);
    if (err.errors) console.error("Mongoose Validation Errors:", err.errors);

  }

  // Gestion des erreurs Mongoose spécifiques pour des messages plus conviviaux
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = `Ressource non trouvée. L'identifiant fourni n'est pas au bon format.`;
    // statusCode est déjà 500 par défaut, mais CastError est souvent une erreur client 400 ou 404
    // On peut choisir de le mettre à 400 (Bad Request) car l'ID fourni est mal formé.
    // Ou 404 si on considère que la ressource avec cet ID mal formé ne peut pas exister.
    // Pour être cohérent avec AppError, si on recrée l'erreur, on doit aussi passer le statusCode.
    // Il est plus simple de juste modifier le message et de laisser le statusCode par défaut (500)
    // ou de le forcer à 400/404.
    // Pour l'instant, on va juste changer le message et laisser le status code par défaut ou celui de l'erreur.
    // Si on veut forcer, on ferait : return next(new AppError(message, 400));
    // MAIS, pour éviter un appel récursif à errorHandler, on modifie directement les props de la réponse.
    // On va donc plutôt créer une nouvelle AppError si on veut changer le code.
    // Le plus simple est de modifier message et de laisser statusCode tel quel ou 500.
    // Si on veut être plus précis :
    return res.status(400).json({
        status: 'fail',
        message: `Format d'ID invalide pour le champ '${err.path}' avec la valeur '${err.value}'.`
    });
  }

  if (err.code === 11000) { // Erreur de duplicata Mongoose
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `La valeur '${value}' pour le champ '${field}' existe déjà. Veuillez en utiliser une autre.`;
    return res.status(400).json({ status: 'fail', message }); // Bad Request
  }

  if (err.name === 'ValidationError') { // Erreur de validation Mongoose
    const errors = Object.values(err.errors).map(el => el.message);
    message = `Données d'entrée invalides : ${errors.join('. ')}`;
    return res.status(400).json({ status: 'fail', message }); // Bad Request
  }

  // Gestion des erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    message = 'Token d\'authentification invalide. Veuillez vous reconnecter.';
    return res.status(401).json({ status: 'fail', message }); // Unauthorized
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Votre session a expiré. Veuillez vous reconnecter.';
    return res.status(401).json({ status: 'fail', message }); // Unauthorized
  }


  // Pour les erreurs non opérationnelles en production, envoyer un message générique
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    console.error('💥 UNEXPECTED ERROR IN PRODUCTION 💥', err); // Logguer l'erreur réelle pour les devs
    return res.status(500).json({
      status: 'error',
      message: 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
    });
  }

  // Pour les erreurs opérationnelles (instances de AppError) ou en développement,
  // envoyer le message d'erreur spécifique.
  res.status(statusCode).json({
    status: status,
    message: message,
    // Afficher la pile d'appels uniquement en développement
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
};