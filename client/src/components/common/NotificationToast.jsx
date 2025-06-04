// frontend/src/components/common/NotificationToast.js (notez l'extension .js, pas .jsx)
import { toast } from 'react-toastify';

/**
 * Options par défaut pour les notifications toast.
 * Voir la documentation de react-toastify pour toutes les options :
 * https://fkhadra.github.io/react-toastify/api/toast
 */
const defaultOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  // theme: "light", // Peut être défini globalement dans ToastContainer ou par type
};

/**
 * Affiche une notification de succès.
 * @param {string | React.ReactNode} message - Le message à afficher.
 * @param {object} [options] - Options spécifiques pour ce toast, surchargeant les défauts.
 */
export const showSuccessToast = (message, options = {}) => {
  toast.success(message, { ...defaultOptions, ...options });
};

/**
 * Affiche une notification d'erreur.
 * @param {string | React.ReactNode} message - Le message à afficher.
 * @param {object} [options] - Options spécifiques pour ce toast, surchargeant les défauts.
 */
export const showErrorToast = (message, options = {}) => {
  toast.error(message, { ...defaultOptions, ...options });
};

/**
 * Affiche une notification d'avertissement.
 * @param {string | React.ReactNode} message - Le message à afficher.
 * @param {object} [options] - Options spécifiques pour ce toast, surchargeant les défauts.
 */
export const showWarningToast = (message, options = {}) => {
  toast.warn(message, { ...defaultOptions, ...options });
};

/**
 * Affiche une notification d'information.
 * @param {string | React.ReactNode} message - Le message à afficher.
 * @param {object} [options] - Options spécifiques pour ce toast, surchargeant les défauts.
 */
export const showInfoToast = (message, options = {}) => {
  toast.info(message, { ...defaultOptions, ...options });
};

/**
 * Affiche une notification par défaut (ou personnalisée si le type est dans les options).
 * @param {string | React.ReactNode} message - Le message à afficher.
 * @param {object} [options] - Options spécifiques pour ce toast, surchargeant les défauts.
 */
export const showToast = (message, options = {}) => {
  toast(message, { ...defaultOptions, ...options });
};

/**
 * Fonction pour mettre à jour un toast existant.
 * Utile pour les opérations asynchrones (ex: afficher "Chargement...", puis "Succès !").
 * @param {string|number} toastId - L'ID du toast à mettre à jour.
 * @param {object} options - Nouvelles options pour le toast (render, type, isLoading, autoClose, etc.).
 *                          Ex: { render: "Tout est bon !", type: "success", isLoading: false, autoClose: 5000 }
 */
export const updateToast = (toastId, options) => {
  toast.update(toastId, options);
};

/**
 * Fonction pour afficher un toast pendant une promesse.
 * @param {Promise} promise - La promesse à suivre.
 * @param {object} messages - Objets avec les messages pour les états pending, success, error.
 *                          Ex: { pending: 'Chargement...', success: 'Réussi 👌', error: 'Échoué 🤯' }
 * @param {object} [options] - Options additionnelles pour le toast.
 */
export const showPromiseToast = (promise, messages, options = {}) => {
  toast.promise(promise, messages, { ...defaultOptions, ...options });
};

// Vous pouvez exporter un objet si vous préférez
// export default {
//   success: showSuccessToast,
//   error: showErrorToast,
//   warn: showWarningToast,
//   info: showInfoToast,
//   show: showToast,
//   update: updateToast,
//   promise: showPromiseToast,
// };