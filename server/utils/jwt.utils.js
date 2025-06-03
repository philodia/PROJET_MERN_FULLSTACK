// gestion-commerciale-app/backend/utils/jwt.utils.js

const jwt = require('jsonwebtoken');
const config = require('../config'); // Notre configuration centralisée (JWT_SECRET, JWT_EXPIRES_IN)

/**
 * Génère un token JWT signé.
 * @param {string|object|Buffer} payload - Le payload à inclure dans le token. Typiquement, l'ID de l'utilisateur.
 *                                        Peut être un objet si vous souhaitez inclure plus d'informations (ex: rôle),
 *                                        mais gardez le payload petit.
 * @param {string} [expiresIn] - Optionnel. Durée de validité du token (ex: '1h', '7d').
 *                               Utilise JWT_EXPIRES_IN de la config par défaut.
 * @returns {string} Le token JWT signé.
 * @throws {Error} Si JWT_SECRET n'est pas défini.
 */
const generateToken = (payload, expiresIn) => {
  if (!config.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Cannot sign token.');
    throw new Error('Configuration du serveur incomplète pour la génération de token.');
  }

  const tokenExpiresIn = expiresIn || config.JWT_EXPIRES_IN;

  return jwt.sign(
    // Si le payload est un simple ID, on le met dans un objet { id: payload }
    // pour correspondre à la façon dont on le décode souvent.
    typeof payload === 'string' ? { id: payload } : payload,
    config.JWT_SECRET,
    {
      expiresIn: tokenExpiresIn,
    }
  );
};

/**
 * Vérifie et décode un token JWT.
 * C'est une fonction utilitaire, le middleware `protect` gère déjà cela pour les routes.
 * Peut être utile pour des cas spécifiques où vous avez un token et devez le vérifier en dehors du flux de requête standard.
 * @param {string} token - Le token JWT à vérifier.
 * @returns {object|null} Le payload décodé si le token est valide, sinon null.
 *                        En cas d'erreur (token invalide, expiré), loggue l'erreur et retourne null.
 */
const verifyToken = (token) => {
  if (!token) {
    // console.warn('Tentative de vérification d\'un token vide.');
    return null;
  }
  if (!config.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Cannot verify token.');
    // Ne pas lancer d'erreur ici pour ne pas crasher si utilisé dans un contexte où null est attendu
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.warn('Erreur de vérification JWT (token invalide):'.yellow, error.message);
    } else if (error.name === 'TokenExpiredError') {
      console.warn('Erreur de vérification JWT (token expiré):'.yellow, error.message);
    } else {
      console.error('Erreur inattendue lors de la vérification du JWT:'.red, error);
    }
    return null;
  }
};

/**
 * Fonction utilitaire pour configurer et envoyer la réponse avec le token (cookie + JSON).
 * @param {object} user - L'objet utilisateur (doit avoir un _id).
 * @param {number} statusCode - Le code de statut HTTP pour la réponse.
 * @param {import('express').Response} res - L'objet réponse Express.
 * @param {string} [message] - Message optionnel à inclure dans la réponse JSON.
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  if (!user || !user._id) {
    console.error('Erreur sendTokenResponse: Objet utilisateur invalide ou ID manquant.'.red);
    // Ne pas envoyer de token si l'utilisateur est invalide.
    // Cela pourrait être géré par un AppError en amont.
    // Pour l'instant, on pourrait renvoyer une erreur 500 générique si cela se produit.
    return res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }

  const token = generateToken({ id: user._id.toString(), role: user.role }); // Inclure le rôle dans le payload du token

  const cookieOptions = {
    expires: new Date(Date.now() + config.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // Convertir jours en ms
    httpOnly: true, // Le cookie n'est pas accessible via JavaScript côté client (sécurité XSS)
    secure: config.NODE_ENV === 'production', // Envoyer uniquement sur HTTPS en production
    sameSite: 'lax', // Protection CSRF. 'strict' est plus sûr mais peut avoir des contraintes. 'lax' est un bon compromis.
    // path: '/', // Optionnel, par défaut le cookie est valide pour toutes les routes du domaine
  };

  // Enlever le mot de passe de l'objet utilisateur avant de l'envoyer dans la réponse
  const userResponseData = { ...user.toObject() }; // Convertir le document Mongoose en objet simple
  delete userResponseData.password;
  delete userResponseData.__v;
  // Supprimez d'autres champs sensibles si nécessaire

  res
    .status(statusCode)
    .cookie('jwt', token, cookieOptions) // Définir le cookie HTTP Only
    .json({
      success: true,
      ...(message && { message }), // Inclure le message s'il est fourni
      token, // Optionnel: envoyer le token aussi dans le corps de la réponse (pour les clients qui ne gèrent pas bien les cookies)
      data: userResponseData,
    });
};


module.exports = {
  generateToken,
  verifyToken,
  sendTokenResponse,
};