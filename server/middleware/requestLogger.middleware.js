// gestion-commerciale-app/backend/middleware/requestLogger.middleware.js
const morgan = require('morgan');
const config = require('../config'); // Pour accéder à NODE_ENV

// Définir un format de log personnalisé (optionnel)
// Voir la documentation de Morgan pour tous les tokens disponibles : https://github.com/expressjs/morgan#tokens
// morgan.token('id', function getId(req) {
//   return req.id; // Nécessite un middleware qui ajoute un ID à la requête, ex: express-request-id
// });
// const customFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

let requestLogger;

if (config.NODE_ENV === 'development') {
  // En développement, utiliser un format concis et coloré
  requestLogger = morgan('dev');
} else if (config.NODE_ENV === 'production') {
  // En production, vous pourriez vouloir un format plus détaillé,
  // ou écrire dans un fichier de log ou un service de logging.
  // 'combined' est un format standard d'Apache.
  requestLogger = morgan('combined', {
    // Optionnel : sauter les logs pour les requêtes de health check ou statiques réussies
    // skip: function (req, res) { return res.statusCode < 400 && (req.originalUrl === '/api/health' || req.path.startsWith('/static')) }
  });
  // Pour écrire dans un fichier :
  // const fs = require('fs');
  // const path = require('path');
  // const accessLogStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' });
  // requestLogger = morgan('combined', { stream: accessLogStream });
} else {
  // Pour d'autres environnements (ex: test), vous pourriez ne pas vouloir de logs ou un format minimal
  requestLogger = (req, res, next) => next(); // No-op logger
}

module.exports = requestLogger;