// gestion-commerciale-app/backend/utils/password.utils.js

const bcrypt = require('bcryptjs');

/**
 * Hache un mot de passe en utilisant bcrypt.
 * @param {string} password - Le mot de passe en clair à hacher.
 * @returns {Promise<string>} Une promesse qui se résout avec le mot de passe haché.
 * @throws {Error} Si une erreur se produit pendant le hachage.
 */
const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Le mot de passe ne peut pas être vide pour le hachage.');
  }
  try {
    const salt = await bcrypt.genSalt(10); // Génère un "sel" avec un coût de 10 (valeur commune)
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Erreur lors du hachage du mot de passe:', error);
    throw new Error('Erreur interne du serveur lors du traitement du mot de passe.'); // Ne pas exposer les détails de bcrypt
  }
};

/**
 * Compare un mot de passe en clair avec un mot de passe haché.
 * @param {string} enteredPassword - Le mot de passe en clair fourni par l'utilisateur.
 * @param {string} hashedPassword - Le mot de passe haché stocké dans la base de données.
 * @returns {Promise<boolean>} Une promesse qui se résout avec `true` si les mots de passe correspondent, sinon `false`.
 * @throws {Error} Si une erreur se produit pendant la comparaison.
 */
const comparePassword = async (enteredPassword, hashedPassword) => {
  if (!enteredPassword || !hashedPassword) {
    // Retourner false directement si l'un des mots de passe est manquant pour éviter des erreurs bcrypt
    // ou une comparaison invalide.
    return false;
  }
  try {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  } catch (error) {
    console.error('Erreur lors de la comparaison du mot de passe:', error);
    // En cas d'erreur de bcrypt (rare), considérer que la comparaison a échoué pour la sécurité.
    return false;
    // Ou lancer une erreur plus générique si vous préférez gérer cela plus haut
    // throw new Error('Erreur interne du serveur lors de la vérification du mot de passe.');
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};