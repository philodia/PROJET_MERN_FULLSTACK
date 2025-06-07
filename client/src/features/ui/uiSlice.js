// frontend/src/features/ui/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // --- Thème ---
  // Le thème par défaut est 'light'. Il sera chargé depuis localStorage si disponible.
  theme: 'light',

  // --- Sidebar ---
  isSidebarOpen: window.innerWidth >= 992, // Ou true par défaut, et gérer la logique de taille d'écran dans MainLayout

  // --- Modale Globale (pour des cas simples, ex: confirmation, alerte) ---
  // Pour des modales complexes avec leur propre état, il est préférable de les gérer localement
  // ou d'avoir des slices dédiés si l'état de la modale est complexe et global.
  // Cet exemple est pour une modale de confirmation simple.
  isConfirmationModalOpen: false,
  confirmationModalProps: { // Props pour la modale de confirmation
    title: 'Confirmation',
    body: 'Êtes-vous sûr ?',
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler',
    confirmButtonVariant: 'primary',
    onConfirm: null, // Stocker une chaîne pour identifier l'action ou une fonction sérialisable
    isLoading: false, // Pour le bouton de confirmation de la modale
  },

  // --- Indicateur de Chargement Global ---
  // Utile pour bloquer l'UI ou afficher un spinner plein écran pendant des opérations critiques globales.
  // Pour les chargements de données spécifiques à une feature, utilisez le statut 'loading' du slice de cette feature.
  globalLoading: false,
  globalLoadingMessage: '',

  // --- Notifications (si vous voulez les gérer via Redux au lieu d'uniquement react-toastify) ---
  // Pour cet exemple, nous supposerons que react-toastify est géré indépendamment
  // et que ce slice ne s'occupe pas des notifications toast. Si vous voulez les gérer ici :
  // notifications: [], // [{ id, type: 'success' | 'error', message, autoClose }]
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // --- Thème ---
    setTheme(state, action) { // action.payload: 'light' | 'dark'
      const newTheme = action.payload === 'dark' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('appTheme', newTheme);
      document.documentElement.setAttribute('data-bs-theme', newTheme); // Pour Bootstrap 5.3+ theming
    },
    loadTheme(state) {
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        state.theme = savedTheme;
      } else {
        state.theme = initialState.theme; // Revenir au défaut si valeur invalide
        localStorage.setItem('appTheme', state.theme); // Sauvegarder le défaut
      }
      document.documentElement.setAttribute('data-bs-theme', state.theme);
    },
    toggleTheme(state) {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('appTheme', newTheme);
      document.documentElement.setAttribute('data-bs-theme', newTheme);
    },

    // --- Sidebar ---
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen(state, action) { // action.payload: boolean
      state.isSidebarOpen = action.payload;
    },

    // --- Modale de Confirmation ---
    openConfirmationModal(state, action) {
      // action.payload: { title?, body?, confirmButtonText?, onConfirmActionType?, confirmArgs? }
      // `onConfirmActionType` pourrait être une chaîne identifiant une action à dispatcher
      // ou vous pourriez passer une fonction simple si elle ne dépend pas de logique complexe.
      // Pour des raisons de sérialisation Redux, il est préférable d'éviter de stocker des fonctions non sérialisables (comme des callbacks directs) dans le store.
      state.isConfirmationModalOpen = true;
      state.confirmationModalProps = {
        ...initialState.confirmationModalProps, // Réinitialiser aux valeurs par défaut
        ...action.payload, // Surcharger avec les props passées
        isLoading: false, // S'assurer que isLoading est false à l'ouverture
      };
    },
    closeConfirmationModal(state) {
      state.isConfirmationModalOpen = false;
      // Il n'est généralement pas nécessaire de réinitialiser confirmationModalProps ici,
      // car openConfirmationModal le fait déjà. Mais si vous voulez être sûr :
      // state.confirmationModalProps = { ...initialState.confirmationModalProps };
    },
    setConfirmationModalLoading(state, action) { // action.payload: boolean
      state.confirmationModalProps.isLoading = action.payload;
    },

    // --- Chargement Global ---
    setGlobalLoading(state, action) { // action.payload: boolean | { isLoading: boolean, message?: string }
        if (typeof action.payload === 'boolean') {
            state.globalLoading = action.payload;
            if (!action.payload) state.globalLoadingMessage = ''; // Effacer le message si on arrête le loading
        } else {
            state.globalLoading = action.payload.isLoading;
            state.globalLoadingMessage = action.payload.isLoading ? (action.payload.message || '') : '';
        }
    },

    // --- Notifications (Exemple si vous les gérez ici) ---
    // addNotification(state, action) { // action.payload: { id?, type, message, autoClose? }
    //   const newNotification = {
    //     id: action.payload.id || Date.now().toString(), // Générer un ID si non fourni
    //     type: action.payload.type || 'info',
    //     message: action.payload.message,
    //     autoClose: action.payload.autoClose !== undefined ? action.payload.autoClose : 5000,
    //   };
    //   state.notifications.push(newNotification);
    // },
    // removeNotification(state, action) { // action.payload: id (string ou number)
    //   state.notifications = state.notifications.filter(
    //     (notification) => notification.id !== action.payload
    //   );
    // },
    // clearAllNotifications(state) {
    //   state.notifications = [];
    // },
  },
});

// Exporter les actions
export const {
  setTheme,
  loadTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  openConfirmationModal,
  closeConfirmationModal,
  setConfirmationModalLoading,
  setGlobalLoading,
  // addNotification, // Si vous implémentez les notifications ici
  // removeNotification,
  // clearAllNotifications,
} = uiSlice.actions;

// Sélecteurs
export const selectAppTheme = (state) => state.ui.theme;
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectIsConfirmationModalOpen = (state) => state.ui.isConfirmationModalOpen;
export const selectConfirmationModalProps = (state) => state.ui.confirmationModalProps;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectGlobalLoadingMessage = (state) => state.ui.globalLoadingMessage;
// export const selectNotifications = (state) => state.ui.notifications; // Si implémenté

export default uiSlice.reducer;