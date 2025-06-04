// frontend/src/features/clients/clientSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import {
  fetchClients as fetchClientsApi,
  fetchClientById as fetchClientByIdApi,
  createClient as createClientApi,
  updateClient as updateClientApi,
  deleteClient as deleteClientApi,
  fetchClientHistory as fetchClientHistoryApi,
} from '../../api/client.api.js'; // Assurez-vous que le chemin est correct

// createEntityAdapter pour la gestion des données normalisées
const clientsAdapter = createEntityAdapter({
  selectId: (client) => client._id || client.id,
  sortComparer: (a, b) => a.companyName.localeCompare(b.companyName), // Trier par nom d'entreprise par défaut
});

const initialState = clientsAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  currentClient: null, // Pour le client sélectionné (détail/édition)
  currentClientHistory: { // Pour l'historique du client sélectionné
    items: [],
    status: 'idle',
    error: null,
    pagination: {},
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalClients: 0,
    limit: 10,
  },
});

// Thunks asynchrones
export const getClients = createAsyncThunk(
  'clients/getClients',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchClientsApi(params);
      return data; // Attend { clients: [...], totalPages, currentPage, totalClients, limit }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch clients');
    }
  }
);

export const getClientById = createAsyncThunk(
  'clients/getClientById',
  async (clientId, { rejectWithValue }) => {
    try {
      const data = await fetchClientByIdApi(clientId);
      return data; // Attend l'objet client
    } catch (error) {
      return rejectWithValue(error.message || `Failed to fetch client ${clientId}`);
    }
  }
);

export const addNewClient = createAsyncThunk(
  'clients/addNewClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const data = await createClientApi(clientData);
      return data; // Attend le client créé
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to create client');
    }
  }
);

export const editClient = createAsyncThunk(
  'clients/editClient',
  async ({ clientId, clientData }, { rejectWithValue }) => {
    try {
      const data = await updateClientApi(clientId, clientData);
      return data; // Attend le client mis à jour
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update client');
    }
  }
);

export const removeClient = createAsyncThunk(
  'clients/removeClient',
  async (clientId, { rejectWithValue }) => {
    try {
      await deleteClientApi(clientId);
      return clientId; // Retourne l'ID du client supprimé
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete client');
    }
  }
);

export const getClientHistory = createAsyncThunk(
  'clients/getClientHistory',
  async ({ clientId, params = {} }, { rejectWithValue }) => {
    try {
      const data = await fetchClientHistoryApi(clientId, params);
      return data; // Attend { history: [...], ...pagination }
    } catch (error) {
      return rejectWithValue(error.message || `Failed to fetch history for client ${clientId}`);
    }
  }
);


const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setCurrentClient(state, action) {
      state.currentClient = action.payload;
      // Réinitialiser l'historique lors de la sélection d'un nouveau client
      state.currentClientHistory = initialState.currentClientHistory;
    },
    clearCurrentClient(state) {
      state.currentClient = null;
      state.currentClientHistory = initialState.currentClientHistory;
    },
    clearClientError(state) {
      state.error = null;
      if (state.status === 'failed') state.status = 'idle';
    },
    setClientListPage(state, action) {
        state.pagination.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Clients
      .addCase(getClients.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getClients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        clientsAdapter.setAll(state, action.payload.clients);
        state.pagination = {
            currentPage: action.payload.currentPage,
            totalPages: action.payload.totalPages,
            totalClients: action.payload.totalClients,
            limit: action.payload.limit || state.pagination.limit,
        };
      })
      .addCase(getClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Get Client By Id
      .addCase(getClientById.pending, (state) => {
        state.status = 'loading'; // Ou un statut spécifique pour le client courant
        state.currentClient = null;
        state.currentClientHistory = initialState.currentClientHistory; // Réinitialiser l'historique
        state.error = null;
      })
      .addCase(getClientById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentClient = action.payload;
      })
      .addCase(getClientById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add New Client
      .addCase(addNewClient.fulfilled, (state, action) => {
        clientsAdapter.addOne(state, action.payload);
        state.pagination.totalClients += 1;
        state.status = 'succeeded';
      })
      // Edit Client
      .addCase(editClient.fulfilled, (state, action) => {
        clientsAdapter.upsertOne(state, action.payload);
        if (state.currentClient && (state.currentClient._id === action.payload._id || state.currentClient.id === action.payload.id)) {
          state.currentClient = action.payload;
        }
        state.status = 'succeeded';
      })
      // Remove Client
      .addCase(removeClient.fulfilled, (state, action) => {
        clientsAdapter.removeOne(state, action.payload);
        state.pagination.totalClients -= 1;
        state.status = 'succeeded';
      })
      // Get Client History
      .addCase(getClientHistory.pending, (state) => {
        state.currentClientHistory.status = 'loading';
        state.currentClientHistory.error = null;
      })
      .addCase(getClientHistory.fulfilled, (state, action) => {
        state.currentClientHistory.status = 'succeeded';
        state.currentClientHistory.items = action.payload.history;
        state.currentClientHistory.pagination = {
            currentPage: action.payload.currentPage,
            totalPages: action.payload.totalPages,
            totalItems: action.payload.totalItems,
            // ...autres infos de pagination de l'historique
        };
      })
      .addCase(getClientHistory.rejected, (state, action) => {
        state.currentClientHistory.status = 'failed';
        state.currentClientHistory.error = action.payload;
      })
      // Gestion générique des états pour les mutations (add, edit, remove)
      .addMatcher(
        (action) => [addNewClient.pending, editClient.pending, removeClient.pending].includes(action.type),
        (state) => {
          state.status = 'loading'; // État global du slice des clients
          state.error = null;
        }
      )
      .addMatcher(
        (action) => [addNewClient.rejected, editClient.rejected, removeClient.rejected].includes(action.type),
        (state, action) => {
          if (state.status === 'loading') {
            state.status = 'failed';
            state.error = action.payload; // Souvent un objet avec { message, errors } du backend
          }
        }
      );
  },
});

export const { setCurrentClient, clearCurrentClient, clearClientError, setClientListPage } = clientSlice.actions;

// Sélecteurs de l'adaptateur
export const {
  selectAll: selectAllClients,
  selectById: selectClientByIdFromAdapter,
  selectIds: selectClientIds,
} = clientsAdapter.getSelectors((state) => state.clients);

// Sélecteurs personnalisés
export const selectClientStatus = (state) => state.clients.status;
export const selectClientError = (state) => state.clients.error;
export const selectCurrentClientDetail = (state) => state.clients.currentClient;
export const selectClientPaginationInfo = (state) => state.clients.pagination;
export const selectCurrentClientHistoryItems = (state) => state.clients.currentClientHistory.items;
export const selectCurrentClientHistoryStatus = (state) => state.clients.currentClientHistory.status;
export const selectCurrentClientHistoryError = (state) => state.clients.currentClientHistory.error;
export const selectCurrentClientHistoryPagination = (state) => state.clients.currentClientHistory.pagination;


export default clientSlice.reducer;