// backend/server.js
import dotenv from 'dotenv'; // Importation unique de dotenv
import express from 'express';
import colors from 'colors'; // Optionnel, pour les logs colorés (npm install colors)
import connectDB from './config/db.js'; // Importe la fonction de connexion à la BDD
// import path from 'path'; // Utile si vous servez des fichiers statiques du build React plus tard

// Importer les gestionnaires de routes (à créer plus tard)
// import productRoutes from './routes/productRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
// import authRoutes from './routes/authRoutes.js'; // Exemple

// Importer les middlewares (à créer plus tard)
// import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Charger les variables d'environnement du fichier .env
// Assurez-vous que cette ligne est exécutée AVANT toute utilisation de process.env
dotenv.config();

// LIGNE DE DÉBOGAGE TEMPORAIRE (si vous l'aviez ajoutée et que le problème MONGO_URI persiste) :
// console.log("MONGO_URI lue depuis .env:", process.env.MONGO_URI);

// Se connecter à la base de données MongoDB
connectDB();

// Initialiser l'application Express
const app = express();

// Middleware pour parser le JSON dans le corps des requêtes
// Permet d'accéder à req.body pour les requêtes POST/PUT avec un Content-Type 'application/json'
app.use(express.json());

// Middleware pour parser les données URL-encodées (form data)
// app.use(express.urlencoded({ extended: true }));

// Route de test simple
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de Gestion Commerciale & Comptable!' });
});

// Monter les routes (à décommenter et créer au fur et à mesure)
// app.use('/api/products', productRoutes);
// app.use('/api/users', userRoutes); // Pour le CRUD des utilisateurs (profil, etc.)
// app.use('/api/orders', orderRoutes);
// app.use('/api/auth', authRoutes); // Pour l'authentification (login, register)
// ... autres routes pour clients, fournisseurs, factures, etc.

// --- Configuration pour la production (si vous servez le build React depuis Node) ---
// const __dirname = path.resolve(); // Donne le chemin du répertoire courant
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '/frontend/build')));
//   app.get('*', (req, res) =>
//     res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
//   );
// } else {
//   app.get('/', (req, res) => {
//     res.send('API is running in development mode...');
//   });
// }
// --- Fin de la configuration pour la production ---


// Middleware pour la gestion des erreurs "Not Found" (404)
// Doit être après toutes les routes
// app.use(notFound);

// Middleware pour la gestion globale des erreurs
// Doit être le dernier middleware
// app.use(errorHandler);


// Définir le port d'écoute du serveur
const PORT = process.env.PORT || 5000; // Utilise le port de .env ou 5000 par défaut

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(
    `Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${PORT}`.yellow.bold
  );
});