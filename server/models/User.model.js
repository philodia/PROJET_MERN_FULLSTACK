// gestion-commerciale-app/backend/models/User.model.js
const mongoose = require('mongoose');
const validator = require('validator'); // Pour une validation d'email plus robuste
// const bcrypt = require('bcryptjs'); // Plus besoin ici si on utilise password.utils.js
const { hashPassword, comparePassword } = require('../utils/password.utils'); // Utiliser nos utilitaires

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Le nom d\'utilisateur est requis.'],
      unique: true,
      trim: true,
      minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères.'],
      maxlength: [30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères.'],
      // Vous pouvez ajouter une regex pour des formats de username spécifiques si besoin
      // match: [/^[a-zA-Z0-9_]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores.'],
    },
    email: {
      type: String,
      required: [true, 'L\'adresse email est requise.'],
      unique: true,
      trim: true,
      lowercase: true, // Toujours stocker les emails en minuscules pour la cohérence
      validate: [validator.isEmail, 'Veuillez fournir une adresse email valide.'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis.'],
      minlength: [
        8,
        'Le mot de passe doit contenir au moins 8 caractères.',
      ],
      // Il est important de ne pas retourner le mot de passe par défaut lors des requêtes.
      // Nous le sélectionnons explicitement lorsque nécessaire (ex: login).
      select: false,
      // Optionnel: Ajouter une validation de complexité de mot de passe côté serveur
      // validate: {
      //   validator: function(v) {
      //     // Au moins une majuscule, une minuscule, un chiffre, un caractère spécial
      //     return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
      //   },
      //   message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
      // }
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'], // Définir les rôles possibles
        message: 'Le rôle "{VALUE}" n\'est pas supporté.', // Message d'erreur personnalisé pour enum
      },
      default: 'USER', // Rôle par défaut pour les nouveaux utilisateurs
      required: [true, 'Le rôle de l\'utilisateur est requis.'],
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères.'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Le nom de famille ne peut pas dépasser 50 caractères.'],
    },
    isActive: {
      // Pour la suspension/activation des utilisateurs
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    // Champ optionnel pour la réinitialisation de mot de passe
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Champ optionnel pour invalider les tokens après un changement de mot de passe
    passwordChangedAt: Date,

    // Vous pouvez ajouter d'autres champs comme :
    // avatar: String, // URL de l'avatar
    // phone: String,
    // settings: {
    //   theme: String,
    //   notifications: Boolean,
    // }
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    toJSON: { virtuals: true }, // S'assurer que les champs virtuels sont inclus lors de la conversion en JSON
    toObject: { virtuals: true }, // S'assurer que les champs virtuels sont inclus lors de la conversion en objet
  }
);

// --- VIRTUALS ---
// Exemple de champ virtuel pour le nom complet
UserSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  if (this.firstName) {
    return this.firstName;
  }
  if (this.lastName) {
    return this.lastName;
  }
  return null; // Ou this.username si vous préférez
});


// --- MIDDLEWARE MONGOOSE (HOOKS) ---

// Hacher le mot de passe avant de sauvegarder (uniquement si le mot de passe a été modifié)
UserSchema.pre('save', async function (next) {
  // Ne re-hacher le mot de passe que s'il a été modifié (ou s'il est nouveau)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await hashPassword(this.password); // Utilise notre utilitaire
    // Si le mot de passe est modifié (et que ce n'est pas un nouveau document),
    // mettre à jour passwordChangedAt pour invalider les anciens tokens JWT.
    // Soustraire 1 seconde pour éviter les problèmes de race condition où le token est généré
    // exactement au même moment que le mot de passe est changé.
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }
    next();
  } catch (error) {
    next(error); // Transmettre l'erreur au gestionnaire d'erreurs Mongoose/Express
  }
});

// --- MÉTHODES D'INSTANCE ---

// Méthode pour comparer le mot de passe entré avec le mot de passe haché en base de données
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // `this.password` n'est pas accessible ici par défaut à cause de `select: false`.
  // On devra le sélectionner explicitement dans la requête si on veut l'utiliser.
  // Cependant, si cette méthode est appelée sur un document où le mot de passe a été sélectionné,
  // elle fonctionnera. Pour la fonction `login`, on sélectionne le mot de passe.
  return await comparePassword(enteredPassword, this.password); // Utilise notre utilitaire
};

// Méthode pour générer un token de réinitialisation de mot de passe (exemple)
// Vous devrez aussi installer 'crypto' qui est un module natif de Node.js
// const crypto = require('crypto');
// UserSchema.methods.createPasswordResetToken = function () {
//   const resetToken = crypto.randomBytes(32).toString('hex');
//   this.passwordResetToken = crypto
//     .createHash('sha256')
//     .update(resetToken)
//     .digest('hex');

//   // Token expire dans 10 minutes (par exemple)
//   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

//   return resetToken; // Retourner le token non haché à envoyer à l'utilisateur
// };

// --- INDEXES ---
// Index pour améliorer les performances des requêtes sur les champs fréquemment interrogés.
// `unique: true` crée déjà un index.
// UserSchema.index({ role: 1 }); // Si vous filtrez souvent par rôle
// UserSchema.index({ isActive: 1 }); // Si vous filtrez souvent par statut actif

module.exports = mongoose.model('User', UserSchema);