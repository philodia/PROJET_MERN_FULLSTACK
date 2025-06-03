// gestion-commerciale-app/backend/config/db.js

const mongoose = require('mongoose');
const config = require('./index'); // Importe la configuration centralisée (config/index.js)
require('colors'); // Assurez-vous que 'colors' est installé (npm install colors)

const connectDB = async () => {
  try {
    // mongoose.set('strictQuery', true); // Optionnel pour Mongoose 7+.
                                        // Par défaut, Mongoose 7+ utilise strictQuery: false.
                                        // Mettez à true si les champs non définis dans le schéma doivent être supprimés des résultats.

    if (!config.MONGO_URI) {
      console.error('FATAL ERROR: MONGO_URI is not defined in your environment variables.'.red.bold);
      console.error('Please ensure your .env file is correctly set up with MONGO_URI.'.red);
      process.exit(1);
    }

    // Connexion à MongoDB sans les options dépréciées
    const conn = await mongoose.connect(config.MONGO_URI, {
      // Aucune option ici n'est nécessaire pour une connexion de base avec Mongoose 6+ / Driver 4+
      // Vous pouvez ajouter des options spécifiques si nécessaire, comme :
      // serverSelectionTimeoutMS: 5000,
      // socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red.bold);
    console.error('Details:', error);
    process.exit(1); // Arrêter l'application en cas d'échec de la connexion initiale
  }

  // Gérer les événements de connexion de Mongoose
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db'.green);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`Mongoose connection error: ${err.message}`.red);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected from db'.yellow);
  });

  // Gérer la fermeture propre de la connexion Mongoose lors de l'arrêt de l'application
  const gracefulShutdown = async (signal) => {
    await mongoose.connection.close();
    console.log(`Mongoose connection disconnected due to app termination (${signal})`.magenta);
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

module.exports = connectDB;