// gestion-commerciale-app/backend/server.js

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('colors');

// Charger la configuration centralisée
const config = require('./config');

// Se connecter à la base de données MongoDB
const connectDB = require('./config/db');
connectDB();

// Initialiser Socket.IO
const { initSocket, getIO } = require('./config/socket');

// Middlewares
const { notFound, errorHandler } = require('./middleware/error.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');

// Routeur principal
const mainApiRouter = require('./routes');

const app = express();

// --- Middlewares Généraux ---
// Configuration proxy (doit être en premier)
app.set('trust proxy', 1);

// Middlewares de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", config.FRONTEND_URL]
    }
  }
}));

// Configuration CORS dynamique
const corsOptions = {
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Logging
app.use(requestLogger);
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else if (config.NODE_ENV === 'production') {
    app.use(morgan('combined'));
}

// --- Routes ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        env: config.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Route principale
app.use('/api', mainApiRouter);

// Test Socket.IO
app.post('/api/test-socket-broadcast', (req, res) => {
    const { message, eventName = 'test_broadcast' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    
    try {
        getIO().emit(eventName, { 
            content: message, 
            timestamp: new Date() 
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Socket broadcast error:'.red, error);
        res.status(500).json({ error: 'Socket broadcast failed' });
    }
});

// --- Gestion des Erreurs ---
app.use(notFound);
app.use(errorHandler);

// --- Démarrage du Serveur ---
const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = config.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`----------------------------------------------------------------------`.grey);
    console.log(`🚀 Server running in ${config.NODE_ENV.cyan} mode on port ${PORT.yellow}`.bold);
    console.log(`   Frontend: ${config.FRONTEND_URL.blue}`);
    console.log(`   MongoDB: ${config.MONGO_URI.split('@')[1]?.split('/')[0] || 'Connected'.green}`);
    console.log(`----------------------------------------------------------------------`.grey);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
    console.error(`UNHANDLED REJECTION: ${err.message}`.red.bold);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error(`UNCAUGHT EXCEPTION: ${err.message}`.red.bold);
    process.exit(1);
});