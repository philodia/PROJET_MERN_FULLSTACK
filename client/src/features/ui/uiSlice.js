// frontend/src/features/ui/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Fonction utilitaire pour générer un ID plus robuste (optionnel, mais mieux que Math.random())
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

const defaultConfirmationModalProps = {
  title: 'Confirmation',
  message: 'Êtes-vous sûr de vouloir effectuer cette action ?',
  onConfirm: () => Promise.resolve(), // onConfirm devrait être une fonction (potentiellement async)
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  confirmButtonVariant: 'primary', // Variante par défaut pour le bouton de confirmation
  isLoading: false, // État de chargement pour le bouton de confirmation
  // Vous pourriez ajouter d'autres props par défaut ici si nécessaire
  // Par exemple: `showCancelButton: true`, `closeOnBackdropClick: false`
};

const initialState = {
  // Gestion des Modals
  isConfirmationModalOpen: false,
  confirmationModalProps: { ...defaultConfirmationModalProps },

  // Gestion des Notifications/Alertes globales
  notifications: [], // Tableau d'objets de notification { id, message, type: 'success' | 'error' | 'info' | 'warning', duration }

  // État du Sidebar (menu latéral)
  // Lire depuis localStorage pour persister l'état du sidebar (optionnel)
  isSidebarOpen: (() => {
    try {
      const storedSidebarState = localStorage.getItem('isSidebarOpen');
      return storedSidebarState ? JSON.parse(storedSidebarState) : true; // true par défaut
    } catch (e) {
      return true;
    }
  })(),

  // Thème de l'application
  theme: localStorage.getItem('appTheme') || 'light', // 'light' | 'dark'

  // Indicateur de chargement global
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // --- Actions pour la Modal de Confirmation ---
    openConfirmationModal(state, action) {
      state.isConfirmationModalOpen = true;
      // Fusionner les props par défaut avec celles fournies
      state.confirmationModalProps = {
        ...defaultConfirmationModalProps, // S'assurer d'avoir toutes les props par défaut
        ...action.payload, // Surcharger avec les props passées
        isLoading: false, // Toujours réinitialiser isLoading à l'ouverture
      };
    },
    closeConfirmationModal(state) {
      state.isConfirmationModalOpen = false;
      // Optionnel: réinitialiser complètement les props à leurs valeurs par défaut pour éviter les fuites d'état.
      // Cela est particulièrement important pour onConfirm si elle capture des variables de son scope de définition.
      state.confirmationModalProps = { ...defaultConfirmationModalProps };
    },
    setConfirmationModalLoading(state, action) {
      // action.payload est un booléen
      if (state.isConfirmationModalOpen) { // Agir seulement si la modale est ouverte
        state.confirmationModalProps.isLoading = action.payload;
      }
    },

    // --- Actions pour les Notifications ---
    addNotification(state, action) {
      const newNotification = {
        id: generateId(), // Utiliser un ID plus robuste
        duration: 5000, // Durée par défaut en ms
        type: 'info', // Type par défaut
        ...action.payload, // Attend { message: string, type?: string, duration?: number, title?: string }
      };
      state.notifications.push(newNotification);
    },
    removeNotification(state, action) {
      // action.payload est l'ID de la notification à supprimer
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearAllNotifications(state) {
      state.notifications = [];
    },

    // --- Actions pour le Sidebar ---
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
      localStorage.setItem('isSidebarOpen', JSON.stringify(state.isSidebarOpen));
    },
    setSidebarOpen(state, action) {
      state.isSidebarOpen = action.payload; // action.payload est un booléen
      localStorage.setItem('isSidebarOpen', JSON.stringify(state.isSidebarOpen));
    },

    // --- Actions pour le Thème ---
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('appTheme', state.theme);
    },
    setTheme(state, action) {
      state.theme = action.payload; // action.payload est 'light' ou 'dark'
      localStorage.setItem('appTheme', state.theme);
    },

    // --- Action pour le chargement global ---
    setGlobalLoading(state, action) {
      state.globalLoading = action.payload; // action.payload est un booléen
    },
  },
});

export const {
  openConfirmationModal,
  closeConfirmationModal,
  setConfirmationModalLoading,
  addNotification,
  removeNotification,
  clearAllNotifications,
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  setGlobalLoading,
} = uiSlice.actions;

// Sélecteurs
export const selectIsConfirmationModalOpen = (state) => state.ui.isConfirmationModalOpen;
export const selectConfirmationModalProps = (state) => state.ui.confirmationModalProps;
export const selectNotifications = (state) => state.ui.notifications;
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectAppTheme = (state) => state.ui.theme;
export const selectGlobalLoading = (state) => state.ui.globalLoading;

export default uiSlice.reducer;