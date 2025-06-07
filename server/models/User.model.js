// backend/models/User.model.js

const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const { hashPassword, comparePassword } = require('../utils/password.utils');

mongoose.set('strictQuery', true); // recommandé pour Mongoose >=6
mongoose.set('strictPopulate', false); // Pour éviter l'erreur "StrictPopulateError"

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Le nom d'utilisateur est requis."],
      unique: true,
      trim: true,
      minlength: [3, "Le nom d'utilisateur doit contenir au moins 3 caractères."],
      maxlength: [30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères."],
      match: [/^[a-zA-Z0-9_.-]+$/, "Le nom d'utilisateur contient des caractères non valides."],
    },
    email: {
      type: String,
      required: [true, "L'adresse email est requise."],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Veuillez fournir une adresse email valide.'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis.'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères.'],
      select: false,
      validate: {
        validator: function (v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(v);
        },
        message:
          'Le mot de passe doit comprendre au moins une majuscule, une minuscule, un chiffre et un caractère spécial.',
      },
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'],
        message: 'Le rôle « {VALUE} » n\'est pas autorisé.',
      },
      default: 'USER',
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
    avatarUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return v ? validator.isURL(v, { protocols: ['http', 'https'], require_protocol: true }) : true;
        },
        message: "L'URL de l'avatar n'est pas valide.",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return v ? validator.isMobilePhone(v, 'any') : true;
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: fullName
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || null;
});

// Pre-save middleware: hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await hashPassword(this.password);
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
    next();
  } catch (err) {
    next(err);
  }
});

// Method: compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    throw new Error('Le mot de passe n\'a pas été sélectionné.');
  }
  return await comparePassword(enteredPassword, this.password);
};

// Method: generate password reset token
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ passwordResetToken: 1 }, { sparse: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;
