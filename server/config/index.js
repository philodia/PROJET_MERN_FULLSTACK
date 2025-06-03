// gestion-commerciale-app/backend/config/index.js

const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement du fichier .env à la racine du backend
// Cela garantit que dotenv est configuré une seule fois de manière centralisée.
// Si le fichier .env n'est pas à la racine du projet où node est lancé, spécifiez le chemin.
// Dans notre cas, server.js est à la racine de backend/, donc .env y est aussi.
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Assure que le .env du dossier backend est chargé

const config = {
  // --- Configuration du Serveur ---
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000', // Ajouter si besoin pour CORS, Socket.IO, etc.

  // --- Configuration de la Base de Données MongoDB ---
  MONGO_URI: process.env.MONGO_URI,

  // --- Configuration de l'Authentification (JWT) ---
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  JWT_COOKIE_EXPIRES_IN: parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 30, // Convertir en nombre

  // --- Configuration des Emails (si vous envoyez des emails) ---
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'Your App <noreply@example.com>',

  // --- Configuration pour l'export SFTP (Espace Comptable) ---
  SFTP_HOST: process.env.SFTP_HOST,
  SFTP_PORT: parseInt(process.env.SFTP_PORT, 10) || 22,
  SFTP_USER: process.env.SFTP_USER,
  SFTP_PASSWORD: process.env.SFTP_PASSWORD,
  SFTP_REMOTE_PATH: process.env.SFTP_REMOTE_PATH,

  // --- Clés API Externes ---
  // GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,

  // --- Options diverses ---
  // SENTRY_DSN: process.env.SENTRY_DSN,
};

// Vérification que les variables essentielles sont définies
// (surtout pour un environnement de production)
if (config.NODE_ENV === 'production') {
  if (!config.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined.');
    process.exit(1);
  }
  if (!config.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
  }
  // Ajoutez d'autres vérifications critiques pour la production ici
}

module.exports = config;