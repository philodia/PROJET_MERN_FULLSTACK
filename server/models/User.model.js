// gestion-commerciale-app/backend/models/User.model.js
const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const { hashPassword, comparePassword } = require('../utils/password.utils');

// Configuration globale de Mongoose
mongoose.set('strictQuery', true); // Recommandé pour Mongoose >= 6 pour éviter les requêtes sur des champs non définis dans le schéma
// mongoose.set('strictPopulate', false); // Décommentez SEULEMENT si vous comprenez les implications
                                      // et que vous ne pouvez pas résoudre les StrictPopulateError autrement.
                                      // Il est préférable de garder la valeur par défaut (true) et de corriger les schémas/populate.

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Le nom d'utilisateur est requis."],
      unique: true, // Crée un index unique. Gérer l'erreur E11000 dans le contrôleur/errorHandler.
      trim: true,
      minlength: [3, "Le nom d'utilisateur doit contenir au moins 3 caractères."],
      maxlength: [30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères."],
      match: [/^[a-zA-Z0-9_.-]+$/, "Le nom d'utilisateur peut contenir des lettres, chiffres, underscores, points et tirets."],
    },
    email: {
      type: String,
      required: [true, "L'adresse email est requise."],
      unique: true, // Crée un index unique. Gérer l'erreur E11000.
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Veuillez fournir une adresse email valide.'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis.'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères.'],
      select: false, // Important: ne pas renvoyer le hash par défaut
      validate: { // Validation de complexité
        validator: function (v) {
          // Au moins une minuscule, une majuscule, un chiffre, et un caractère spécial parmi !@#$%^&*
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(v);
        },
        message: props => `Le mot de passe est trop faible. Il doit comprendre au moins une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*).`
      },
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'],
        message: 'Le rôle « {VALUE} » n\'est pas autorisé.',
      },
      default: 'USER',
      required: [true, "Le rôle de l'utilisateur est requis."], // Requis même avec default pour assurer qu'il est toujours défini
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
    avatarUrl: { // Correspond à ce que ProfilePage pourrait attendre
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Permettre une chaîne vide ou null, mais si une valeur est fournie, elle doit être une URL valide.
          return !v || validator.isURL(v, { protocols: ['http', 'https'], require_protocol: true });
        },
        message: "L'URL de l'avatar n'est pas valide.",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Permettre une chaîne vide ou null, mais si une valeur est fournie, elle doit être un numéro de téléphone valide.
          return !v || validator.isMobilePhone(v, 'any', { strictMode: false }); // strictMode: false est plus permissif
        },
        message: "Le numéro de téléphone est invalide.",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
    toJSON: { virtuals: true, getters: true }, // Assure que les virtuels et getters sont inclus
    toObject: { virtuals: true, getters: true },
  }
);

// --- VIRTUALS ---
UserSchema.virtual('fullName').get(function () {
  const first = this.firstName || '';
  const last = this.lastName || '';
  if (!first && !last) {
    return null; // Ou this.username si c'est le fallback désiré
  }
  return `${first} ${last}`.trim();
});

// --- HOOKS (MIDDLEWARE MONGOOSE) ---
UserSchema.pre('save', async function (next) {
  // Hacher le mot de passe seulement s'il a été modifié (ou est nouveau)
  if (!this.isModified('password')) return next();

  try {
    this.password = await hashPassword(this.password);

    // Si ce n'est pas un nouveau document et que le mdp est modifié,
    // mettre à jour passwordChangedAt et effacer les tokens de réinitialisation.
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Pour l'invalidation de token JWT
      this.passwordResetToken = undefined;
      this.passwordResetExpires = undefined;
    }
    next();
  } catch (err) {
    next(err); // Passer l'erreur à Mongoose
  }
});

// --- MÉTHODES D'INSTANCE ---
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    // Ce cas ne devrait pas arriver si le mot de passe est requis et toujours haché.
    // Sauf si le champ password n'a pas été sélectionné dans la requête.
    console.error('Tentative de comparaison de mot de passe alors que le hash du mot de passe n\'est pas chargé pour l\'utilisateur:', this.username);
    throw new Error('Impossible de vérifier le mot de passe. Le hash du mot de passe n\'est pas disponible.');
  }
  return await comparePassword(enteredPassword, this.password);
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hacher le token avant de le sauvegarder en DB pour la sécurité
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Définir l'expiration (ex: 10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; // Renvoyer le token original (non haché) à envoyer à l'utilisateur
};

// --- INDEXES ---
// Les champs `username` et `email` ont déjà des index uniques via `unique: true`.
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ passwordResetToken: 1 }, { sparse: true }); // Index épars car le champ est souvent null/undefined

const User = mongoose.model('User', UserSchema);

module.exports = User;