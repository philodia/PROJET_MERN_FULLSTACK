// gestion-commerciale-app/backend/server.js

const express = require('express');
const http = require('http'); // Nécessaire pour Socket.IO
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // Pour le logging HTTP
require('colors'); // Pour la coloration des logs console
const mongoose = require('mongoose'); // <<<<------ AJOUTÉ L'IMPORT DE MONGOOSE

// Charger la configuration centralisée (qui charge aussi dotenv)
const config = require('./config');

// Se connecter à la base de données MongoDB
const connectDB = require('./config/db');
connectDB();

// Initialiser Socket.IO (sera fait après la création du serveur HTTP)
const { initSocket, getIO } = require('./config/socket');

// Importer les middlewares (à créer)
const { notFound, errorHandler } = require('./middleware/error.middleware');
const requestLogger = require('./middleware/requestLogger.middleware'); // Importer le logger configuré
//const notFound = require('./middleware/notFound.middleware'); // Importer depuis son nouveau fichier
// const { protect, authorize } = require('./middleware/auth.middleware'); // À décommenter quand prêt

// Importer le routeur principal
const mainApiRouter = require('./routes'); // ./routes pointera vers ./routes/index.js

const app = express();

// --- Middlewares Généraux ---
// IMPORTANT: Ces middlewares doivent être définis AVANT les routes

// CORS (Cross-Origin Resource Sharing)
// Utiliser la variable FRONTEND_URL depuis la configuration pour plus de flexibilité
app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true, // Important pour les cookies JWT HTTP Only si le frontend est sur un domaine/port différent
}));

// Parser les requêtes JSON
app.use(express.json());

// Parser les requêtes URL-encoded
app.use(express.urlencoded({ extended: true }));

// Parser les cookies
app.use(cookieParser());

// Logger les requêtes HTTP en mode développement
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else if (config.NODE_ENV === 'production') {
    // app.use(morgan('combined', { stream: accessLogStream })); // Pour logger dans un fichier
    app.use(morgan('short')); // Ou un format plus concis pour la console en prod
}

app.set('trust proxy', 1); // Ou le nombre de proxies, ou une fonction de confiance
// Maintenant req.ip devrait donner l'IP réelle du client.

// --- Routes de l'API ---
// Route de test simple
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', message: 'Backend API is running healthy!' });
});

// --- Routes de l'API ---
// Monter le routeur principal de l'API sous le préfixe '/api'
app.use('/api', mainApiRouter);

// Route de test pour Socket.IO (à des fins de développement)
app.post('/api/test-socket-broadcast', (req, res) => {
    const { message, eventName = 'test_broadcast' } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        const ioInstance = getIO();
        ioInstance.emit(eventName, { content: message, timestamp: new Date() });
        res.json({ success: true, message: `Event '${eventName}' broadcasted with message: ${message}` });
    } catch (error) {
        console.error('Socket broadcast test error:'.red, error.message);
        res.status(500).json({ success: false, error: 'Failed to broadcast socket event. Is Socket.IO initialized?' });
    }
});


// --- Gestion des Erreurs ---
// IMPORTANT: Ces middlewares doivent être définis APRÈS toutes vos routes
// Middleware pour les routes non trouvées (404)
app.use(notFound);
// Middleware de gestion des erreurs global
app.use(errorHandler);

app.use(requestLogger); // Utiliser le logger configuré

// --- Démarrage du Serveur ---
const PORT = config.PORT;

// Créer le serveur HTTP à partir de l'application Express pour Socket.IO
const httpServer = http.createServer(app);

// Initialiser Socket.IO avec le serveur HTTP
initSocket(httpServer);

const serverInstance = httpServer.listen(PORT, () => {
    console.log(`----------------------------------------------------------------------`.grey);
    console.log(`🚀 Server running in ${config.NODE_ENV.cyan} mode on port ${PORT.yellow}`.bold);
    // Vérifier si mongoose.connection existe avant d'essayer d'accéder à host
    const mongoHost = mongoose.connection && mongoose.connection.host ? mongoose.connection.host.cyan : 'N/A'.red;
    console.log(`   MongoDB: ${'Connected'.green} (Host: ${mongoHost})`);
    console.log(`   Socket.IO: ${'Listening'.green} on port ${PORT.yellow}`);
    console.log(`   Frontend expected at: ${config.FRONTEND_URL.blue}`);
    console.log(`----------------------------------------------------------------------`.grey);
    console.log(`API Health Check: ${`http://localhost:${PORT}/api/health`.blue.underline}`);

});

// Gérer les rejets de promesse non capturés (erreurs asynchrones non gérées)
process.on('unhandledRejection', (err, promise) => {
    console.error(`✖️ UNHANDLED REJECTION! Shutting down...`.red.inverse);
    console.error(`Error: ${err.message}`.red);
    console.error(err.stack); // Afficher la pile d'appel pour le débogage
    // Fermer le serveur et quitter le processus de manière propre
    if (serverInstance) { // S'assurer que serverInstance est défini
        serverInstance.close(() => {
            process.exit(1); // 1 indique une sortie avec erreur
        });
    } else {
        process.exit(1);
    }
});

// Gérer les exceptions non capturées (erreurs synchrones non gérées)
process.on('uncaughtException', (err) => {
    console.error(`✖️ UNCAUGHT EXCEPTION! Shutting down...`.red.inverse);
    console.error(`Error: ${err.message}`.red);
    console.error(err.stack);
    // Il est généralement recommandé de redémarrer le processus après une uncaughtException
    // car l'état de l'application peut être corrompu.
    // Si serverInstance existe, essayez de fermer proprement. Sinon, quittez directement.
    if (serverInstance) {
      serverInstance.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
});