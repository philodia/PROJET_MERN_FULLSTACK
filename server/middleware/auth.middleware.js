// gestion-commerciale-app/backend/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler.middleware'); // Pour gérer les erreurs asynchrones
const User = require('../models/User.model');
const config = require('../config');
const { AppError } = require('./error.middleware');

/**
 * Middleware pour protéger les routes nécessitant une authentification.
 * Vérifie la présence et la validité d'un token JWT dans les cookies ou l'en-tête Authorization.
 * Si le token est valide, attache l'utilisateur décodé à l'objet `req` (`req.user`).
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1) Essayer de récupérer le token depuis les cookies HTTP Only
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // 2) Sinon, essayer de récupérer le token depuis l'en-tête Authorization (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Non autorisé, pas de token fourni. Veuillez vous connecter.', 401));
  }

  try {
    // 3) Vérifier le token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 4) Vérifier si l'utilisateur existe toujours et est actif
    //    Ne pas sélectionner le mot de passe
    const currentUser = await User.findById(decoded.id).select('-password');

    if (!currentUser) {
      return next(new AppError('L\'utilisateur associé à ce token n\'existe plus.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('Votre compte a été désactivé. Veuillez contacter l\'administrateur.', 403));
    }

    // 5) Vérifier si l'utilisateur a changé son mot de passe après l'émission du token
    //    (Nécessite un champ 'passwordChangedAt' dans le modèle User)
    // if (currentUser.passwordChangedAt && currentUser.passwordChangedAt.getTime() > decoded.iat * 1000) {
    //   return next(new AppError('Le mot de passe a été récemment modifié. Veuillez vous reconnecter.', 401));
    // }

    // Accès accordé : attacher l'utilisateur à l'objet de requête
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token invalide. Authentification échouée.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Votre session a expiré. Veuillez vous reconnecter.', 401));
    }
    // Pour d'autres erreurs potentielles lors de la vérification du token ou de la recherche utilisateur
    return next(new AppError('Non autorisé. Erreur lors de la vérification de l\'authentification.', 401));
  }
});

/**
 * Middleware pour autoriser l'accès basé sur les rôles utilisateurs.
 * Doit être utilisé APRÈS le middleware `protect`.
 * @param  {...string} roles - Liste des rôles autorisés pour accéder à la route.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
        // Cela ne devrait pas arriver si 'protect' est utilisé correctement
        return next(new AppError('Accès non autorisé. Rôle utilisateur manquant.', 403));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Votre rôle (${req.user.role}) n'est pas autorisé à accéder à cette ressource.`,
          403 // Forbidden
        )
      );
    }
    next();
  };
};


/**
 * Middleware optionnel pour vérifier un token Socket.IO.
 * Utilisé par le middleware Socket.IO dans config/socket.js.
 * @param {string} token - Le token JWT à vérifier.
 * @returns {Promise<object|null>} L'utilisateur décodé ou null si invalide.
 */
const verifySocketToken = async (token) => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select('-password -__v'); // Exclure des champs

    if (!currentUser || !currentUser.isActive) {
      return null;
    }
    // Optionnel: vérifier passwordChangedAt ici aussi si pertinent pour les sockets
    return currentUser.toObject(); // Retourner un objet simple
  } catch (error) {
    console.error('Socket token verification error:'.yellow, error.message);
    return null;
  }
};


module.exports = {
  protect,
  authorize,
  verifySocketToken, // Exporter pour l'utiliser dans la config socket
};