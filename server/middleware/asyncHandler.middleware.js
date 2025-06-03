// gestion-commerciale-app/backend/middleware/asyncHandler.middleware.js

/**
 * Un wrapper pour les fonctions de route asynchrones (contrôleurs)
 * qui gère automatiquement les erreurs de promesses en les passant à `next()`.
 * Cela évite d'avoir à écrire des blocs try...catch dans chaque contrôleur asynchrone.
 *
 * @param {function} fn - La fonction de contrôleur asynchrone à envelopper.
 *                        Elle doit être de la forme (req, res, next) => Promise.
 * @returns {function} Une nouvelle fonction middleware qui exécute `fn` et attrape les erreurs.
 */
const asyncHandler = (fn) => (req, res, next) => {
  // S'assure que fn(req, res, next) est traité comme une promesse.
  // Si fn est une fonction asynchrone, elle retourne déjà une promesse.
  // Si fn est une fonction synchrone, Promise.resolve() l'enveloppe dans une promesse résolue.
  Promise.resolve(fn(req, res, next))
    // Si la promesse est rejetée (une erreur s'est produite),
    // .catch(next) passera l'erreur au prochain middleware de gestion des erreurs (notre errorHandler).
    .catch(next);
};

module.exports = asyncHandler;