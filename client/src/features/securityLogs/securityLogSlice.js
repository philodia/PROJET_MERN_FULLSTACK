// frontend/src/features/securityLogs/securityLogSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
// Assurez-vous que getSecurityLogsApi est bien la fonction exportée de votre fichier API
import { getSecurityLogs as getSecurityLogsApi } from '../../api/admin.api';

const securityLogsAdapter = createEntityAdapter({
  selectId: (log) => log._id, // Mongoose utilise _id
  // Le tri est généralement géré par l'API.
  // Ce sortComparer s'appliquerait si vous ajoutez des logs manuellement
  // ou si vous voulez forcer un tri côté client après chaque fetch.
  // Pour les logs, l'ordre de l'API (par timestamp) est souvent suffisant.
  // sortComparer: (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
});

const initialPaginationState = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 25,
};

const initialState = securityLogsAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,    // Pour stocker l'objet erreur structuré (ex: { message: '...' })
  pagination: { ...initialPaginationState }, // Copier pour éviter la mutation de l'objet original
});

export const fetchSecurityLogs = createAsyncThunk(
  'securityLogs/fetchSecurityLogs',
  async (params = { page: 1, limit: initialPaginationState.limit }, { rejectWithValue }) => {
    try {
      // On s'attend à ce que getSecurityLogsApi transforme la réponse du backend
      // pour correspondre à la structure:
      // { data: logs[], currentPage, totalPages, totalItems, limit }
      const response = await getSecurityLogsApi(params);
      return response;
    } catch (error) {
      // error est déjà structuré par handleError dans admin.api.js
      return rejectWithValue(error || { message: 'Failed to fetch security logs' });
    }
  }
);

const securityLogSlice = createSlice({
  name: 'securityLogs',
  initialState,
  reducers: {
    clearSecurityLogError(state) {
      state.error = null;
      if (state.status === 'failed') {
        state.status = 'idle'; // Revenir à idle pour permettre un nouveau fetch
      }
    },
    // Vous pourriez ajouter un reducer pour changer la page ou la limite localement
    // si vous ne voulez pas toujours déclencher un fetch API immédiatement.
    // setSecurityLogPage(state, action) {
    //   state.pagination.currentPage = action.payload;
    // }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSecurityLogs.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Effacer les erreurs précédentes lors d'un nouveau chargement
      })
      .addCase(fetchSecurityLogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // action.payload devrait être { data: logs[], currentPage, totalPages, totalItems, limit }
        if (action.payload && Array.isArray(action.payload.data)) {
          securityLogsAdapter.setAll(state, action.payload.data);
          state.pagination.currentPage = action.payload.currentPage;
          state.pagination.totalPages = action.payload.totalPages;
          state.pagination.totalItems = action.payload.totalItems;
          state.pagination.limit = action.payload.limit || state.pagination.limit;
        } else {
          // Gérer le cas où la payload n'a pas la structure attendue
          console.error('fetchSecurityLogs.fulfilled: Payload inattendue', action.payload);
          state.status = 'failed';
          state.error = { message: 'Réponse du serveur invalide pour les journaux.' };
          securityLogsAdapter.removeAll(state);
          state.pagination = { ...initialPaginationState };
        }
      })
      .addCase(fetchSecurityLogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // action.payload est { message, details?, status? }
        securityLogsAdapter.removeAll(state); // Vider les logs en cas d'erreur
        state.pagination = { ...initialPaginationState }; // Réinitialiser la pagination
      });
  },
});

export const { clearSecurityLogError } = securityLogSlice.actions;

// Sélecteurs exportés par createEntityAdapter
export const {
  selectAll: selectAllSecurityLogs,
  selectById: selectSecurityLogById, // Sélectionne un log par son ID
  selectIds: selectSecurityLogIds,   // Sélectionne un tableau des IDs des logs
  selectTotal: selectTotalSecurityLogsInState, // Nombre de logs actuellement dans l'état de l'adapter
  // selectEntities: selectSecurityLogEntities, // Dictionnaire des logs par ID
} = securityLogsAdapter.getSelectors((state) => state.securityLogs);

// Sélecteurs personnalisés
export const selectSecurityLogStatus = (state) => state.securityLogs.status;
export const selectSecurityLogError = (state) => state.securityLogs.error;
export const selectSecurityLogPagination = (state) => state.securityLogs.pagination;

export default securityLogSlice.reducer;