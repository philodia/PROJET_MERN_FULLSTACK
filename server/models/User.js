// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Pour le hachage du mot de passe

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Le nom d\'utilisateur est requis.'],
      unique: true,
      trim: true, // Supprime les espaces au début et à la fin
      minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères.'],
    },
    email: {
      type: String,
      required: [true, 'L\'email est requis.'],
      unique: true,
      trim: true,
      lowercase: true, // Convertit l'email en minuscules
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Veuillez entrer une adresse email valide.',
      ],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis.'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères.'],
      select: false, // N'inclut pas le mot de passe par défaut lors des requêtes find()
    },
    firstName: {
      type: String,
      trim: true,
      // required: [true, 'Le prénom est requis.'], // Décommentez si obligatoire
    },
    lastName: {
      type: String,
      trim: true,
      // required: [true, 'Le nom de famille est requis.'], // Décommentez si obligatoire
    },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES', 'USER'], // USER comme rôle par défaut/de base
      required: [true, 'Le rôle est requis.'],
      default: 'USER', // Rôle par défaut pour les nouveaux utilisateurs
    },
    isActive: {
      // Pour suspendre/activer des comptes
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    // Si vous avez un concept d'espace de travail (multi-tenant)
    // workspace: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Workspace', // Référence à un modèle Workspace (à créer si besoin)
    // },
    // Pour la réinitialisation de mot de passe (optionnel)
    // passwordResetToken: String,
    // passwordResetExpires: Date,
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  }
);

// Middleware Mongoose : Hacher le mot de passe avant de sauvegarder l'utilisateur
userSchema.pre('save', async function (next) {
  // Ne hacher le mot de passe que s'il a été modifié (ou s'il est nouveau)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10); // Génère un "sel" pour le hachage
    this.password = await bcrypt.hash(this.password, salt); // Hache le mot de passe
    next();
  } catch (error) {
    next(error); // Transmet l'erreur au prochain middleware/gestionnaire d'erreur
  }
});

// Méthode pour comparer le mot de passe entré avec le mot de passe haché dans la BDD
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Si le mot de passe n'a pas été sélectionné
  return await bcrypt.compare(enteredPassword, this.password);
};

// Méthode statique pour trouver un utilisateur par ses identifiants (email ou username)
// Utile pour la connexion
userSchema.statics.findByCredentials = async function (identifier, password) {
  const user = await this.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
  }).select('+password'); // Sélectionne explicitement le mot de passe pour la comparaison

  if (!user) {
    return null; // Ou lancez une erreur spécifique
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return null; // Ou lancez une erreur spécifique
  }

  return user;
};


const User = mongoose.model('User', userSchema);

export default User;