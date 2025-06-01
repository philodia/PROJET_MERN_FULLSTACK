// backend/config/db.js
import mongoose from 'mongoose';
import colors from 'colors'; // Optionnel, pour des logs colorés (npm install colors)

const connectDB = async () => {
  try {
    // La chaîne de connexion est récupérée depuis les variables d'environnement
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('Erreur: MONGO_URI n\'est pas défini dans les variables d\'environnement.'.red.bold);
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      // Options pour éviter les avertissements de dépréciation dans les versions plus anciennes de Mongoose.
      // Pour Mongoose 6+, useNewUrlParser, useUnifiedTopology, useCreateIndex, et useFindAndModify
      // ne sont plus des options valides car elles sont soit par défaut, soit supprimées.
      // Si vous utilisez Mongoose 6+, vous pouvez souvent omettre cet objet d'options ou
      // ne spécifier que celles qui sont encore pertinentes pour votre cas.
      // Pour une connexion Atlas standard, Mongoose 6+ gère bien cela sans options explicites.
      //
      // Exemple pour Mongoose 5.x:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
    });

    console.log(`MongoDB Connecté: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`.red.underline.bold);
    // Quitte le processus avec un code d'échec
    process.exit(1);
  }
};

export default connectDB;